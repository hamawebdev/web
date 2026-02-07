/**
 * Session Progress Manager
 * 
 * Handles saving and restoring session progress with proper namespacing per sessionId.
 * Manages current question index, answers, timer, and UI preferences.
 */

import { quizStorage, QuizSessionState, QuizUIState } from './quiz-storage';
import { toast } from 'sonner';

export interface SessionProgressData {
  sessionId: number;
  currentQuestionIndex: number;
  lastQuestionIndex: number;
  timeSpent: number;
  answers: Record<number, any>;
  uiState: QuizUIState;
  timestamp: Date;
  totalQuestions: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface SessionRestorationResult {
  success: boolean;
  data?: SessionProgressData;
  error?: string;
  isCorrupted?: boolean;
  shouldReset?: boolean;
}

class SessionProgressManager {
  private readonly PROGRESS_STORAGE_KEY = 'session_progress_';
  private readonly RESTORATION_TOAST_DURATION = 5000;

  /**
   * Save session progress with automatic checkpointing and validation
   */
  saveProgress(sessionId: number, progressData: Partial<SessionProgressData>): void {
    try {
      // Validate session ID
      if (!this.isValidSessionId(sessionId)) {
        console.warn(`Invalid session ID: ${sessionId}`);
        return;
      }

      // Validate progress data
      const validationResult = this.validateProgressData(progressData);
      if (!validationResult.isValid) {
        console.warn(`Invalid progress data: ${validationResult.error}`);
        return;
      }

      const existingSession = quizStorage.loadSessionState(sessionId);

      if (!existingSession) {
        console.warn(`Cannot save progress: session ${sessionId} not found`);
        return;
      }

      // Update session state with new progress
      const updatedSession: QuizSessionState = {
        ...existingSession,
        currentQuestionIndex: progressData.currentQuestionIndex ?? existingSession.currentQuestionIndex,
        lastQuestionIndex: progressData.currentQuestionIndex ?? existingSession.lastQuestionIndex,
        timeSpent: progressData.timeSpent ?? existingSession.timeSpent,
        answers: { ...existingSession.answers, ...progressData.answers },
        uiState: { ...existingSession.uiState, ...progressData.uiState },
        status: progressData.status ?? existingSession.status,
        lastUpdatedAt: new Date()
      };

      // Save updated session state
      quizStorage.saveSessionState(updatedSession);

      // Save UI state separately for faster access
      if (progressData.uiState) {
        quizStorage.saveUIState(sessionId, updatedSession.uiState);
      }

      // Save progress checkpoint if question index changed
      if (progressData.currentQuestionIndex !== undefined) {
        quizStorage.saveProgressCheckpoint(
          sessionId, 
          progressData.currentQuestionIndex, 
          progressData.timeSpent ?? existingSession.timeSpent
        );
      }

      console.log(`💾 Saved progress for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to save session progress:', error);
    }
  }

  /**
   * Restore session progress with validation
   */
  restoreProgress(sessionId: number, totalQuestions: number): SessionRestorationResult {
    try {
      const sessionState = quizStorage.loadSessionState(sessionId);
      
      if (!sessionState) {
        return {
          success: false,
          error: 'No saved session found'
        };
      }

      // Validate session data integrity
      const validationResult = this.validateSessionData(sessionState, totalQuestions);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.error,
          isCorrupted: true,
          shouldReset: validationResult.shouldReset
        };
      }

      // Load additional progress data
      const progressCheckpoint = quizStorage.loadProgressCheckpoint(sessionId);
      const uiState = quizStorage.loadUIState(sessionId) || sessionState.uiState;

      const progressData: SessionProgressData = {
        sessionId,
        currentQuestionIndex: progressCheckpoint?.questionIndex ?? sessionState.currentQuestionIndex,
        lastQuestionIndex: sessionState.lastQuestionIndex,
        timeSpent: progressCheckpoint?.timeSpent ?? sessionState.timeSpent,
        answers: sessionState.answers,
        uiState,
        timestamp: progressCheckpoint?.timestamp ?? sessionState.lastUpdatedAt,
        totalQuestions: sessionState.totalQuestions,
        status: sessionState.status
      };

      console.log(`📖 Restored progress for session ${sessionId} at question ${progressData.currentQuestionIndex}`);
      
      return {
        success: true,
        data: progressData
      };
    } catch (error) {
      console.error('Failed to restore session progress:', error);
      return {
        success: false,
        error: 'Failed to restore session progress',
        isCorrupted: true,
        shouldReset: true
      };
    }
  }

  /**
   * Show restoration notification to user
   */
  showRestorationNotification(progressData: SessionProgressData): void {
    const questionNumber = progressData.currentQuestionIndex + 1;
    const totalQuestions = progressData.totalQuestions;
    
    toast.success('Session Restored', {
      description: `Resumed where you left off at Question ${questionNumber} of ${totalQuestions}.`,
      duration: this.RESTORATION_TOAST_DURATION,
      action: {
        label: 'Start Over',
        onClick: () => this.resetProgress(progressData.sessionId)
      }
    });
  }

  /**
   * Reset session progress
   */
  resetProgress(sessionId: number): void {
    try {
      quizStorage.resetSessionProgress(sessionId);
      
      toast.info('Progress Reset', {
        description: 'Session progress has been reset. Starting from the beginning.',
        duration: 3000
      });
      
      console.log(`🔄 Reset progress for session ${sessionId}`);
      
      // Reload the page to start fresh
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset session progress:', error);
      toast.error('Failed to reset progress. Please try again.');
    }
  }

  /**
   * Validate session data integrity
   */
  private validateSessionData(sessionState: QuizSessionState, expectedTotalQuestions: number): {
    isValid: boolean;
    error?: string;
    shouldReset?: boolean;
  } {
    // Check if total questions match
    if (sessionState.totalQuestions !== expectedTotalQuestions) {
      return {
        isValid: false,
        error: `Question count mismatch: expected ${expectedTotalQuestions}, found ${sessionState.totalQuestions}`,
        shouldReset: true
      };
    }

    // Check if current question index is valid
    if (sessionState.currentQuestionIndex < 0 || sessionState.currentQuestionIndex >= expectedTotalQuestions) {
      return {
        isValid: false,
        error: `Invalid question index: ${sessionState.currentQuestionIndex}`,
        shouldReset: true
      };
    }

    // Check if session state is reasonable
    if (!sessionState.sessionId || !sessionState.title) {
      return {
        isValid: false,
        error: 'Missing required session data',
        shouldReset: true
      };
    }

    return { isValid: true };
  }

  /**
   * Get session progress summary
   */
  getProgressSummary(sessionId: number): {
    hasProgress: boolean;
    currentQuestion: number;
    totalQuestions: number;
    answeredQuestions: number;
    timeSpent: number;
    lastUpdated: Date | null;
  } {
    try {
      const sessionState = quizStorage.loadSessionState(sessionId);
      
      if (!sessionState) {
        return {
          hasProgress: false,
          currentQuestion: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          timeSpent: 0,
          lastUpdated: null
        };
      }

      const answeredQuestions = Object.keys(sessionState.answers).length;
      
      return {
        hasProgress: sessionState.status === 'IN_PROGRESS' && (answeredQuestions > 0 || sessionState.timeSpent > 0),
        currentQuestion: sessionState.currentQuestionIndex + 1,
        totalQuestions: sessionState.totalQuestions,
        answeredQuestions,
        timeSpent: sessionState.timeSpent,
        lastUpdated: sessionState.lastUpdatedAt
      };
    } catch (error) {
      console.error('Failed to get progress summary:', error);
      return {
        hasProgress: false,
        currentQuestion: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
        timeSpent: 0,
        lastUpdated: null
      };
    }
  }

  /**
   * Clean up expired progress data
   */
  cleanupExpiredProgress(): void {
    try {
      quizStorage.cleanup();
      console.log('🧹 Cleaned up expired session progress');
    } catch (error) {
      console.error('Failed to cleanup expired progress:', error);
    }
  }

  /**
   * Validate session ID
   */
  private isValidSessionId(sessionId: number): boolean {
    return typeof sessionId === 'number' &&
           Number.isInteger(sessionId) &&
           sessionId > 0 &&
           sessionId < Number.MAX_SAFE_INTEGER;
  }

  /**
   * Validate progress data structure
   */
  private validateProgressData(data: Partial<SessionProgressData>): {
    isValid: boolean;
    error?: string;
  } {
    // Check for required fields when provided
    if (data.currentQuestionIndex !== undefined) {
      if (typeof data.currentQuestionIndex !== 'number' ||
          data.currentQuestionIndex < 0 ||
          !Number.isInteger(data.currentQuestionIndex)) {
        return { isValid: false, error: 'Invalid currentQuestionIndex' };
      }
    }

    if (data.timeSpent !== undefined) {
      if (typeof data.timeSpent !== 'number' || data.timeSpent < 0) {
        return { isValid: false, error: 'Invalid timeSpent' };
      }
    }

    if (data.totalQuestions !== undefined) {
      if (typeof data.totalQuestions !== 'number' ||
          data.totalQuestions <= 0 ||
          !Number.isInteger(data.totalQuestions)) {
        return { isValid: false, error: 'Invalid totalQuestions' };
      }
    }

    if (data.answers !== undefined) {
      if (typeof data.answers !== 'object' || data.answers === null) {
        return { isValid: false, error: 'Invalid answers structure' };
      }

      // Validate individual answers
      for (const [questionId, answer] of Object.entries(data.answers)) {
        if (!this.isValidQuestionId(questionId) || !this.isValidAnswer(answer)) {
          return { isValid: false, error: `Invalid answer for question ${questionId}` };
        }
      }
    }

    if (data.status !== undefined) {
      const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(data.status)) {
        return { isValid: false, error: 'Invalid status' };
      }
    }

    return { isValid: true };
  }

  /**
   * Validate question ID
   */
  private isValidQuestionId(questionId: string): boolean {
    const numericId = parseInt(questionId, 10);
    return !isNaN(numericId) && numericId > 0;
  }

  /**
   * Validate answer structure
   */
  private isValidAnswer(answer: any): boolean {
    if (!answer || typeof answer !== 'object') {
      return false;
    }

    // Check required fields
    if (typeof answer.questionId !== 'number' || answer.questionId <= 0) {
      return false;
    }

    if (typeof answer.timeSpent !== 'number' || answer.timeSpent < 0) {
      return false;
    }

    if (!answer.timestamp || isNaN(new Date(answer.timestamp).getTime())) {
      return false;
    }

    return true;
  }

  /**
   * Handle storage errors gracefully
   */
  private handleStorageError(error: any, operation: string): void {
    console.error(`Storage error during ${operation}:`, error);

    // Check if it's a quota exceeded error
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      toast.error('Storage Full', {
        description: 'Your browser storage is full. Some progress may not be saved.',
        duration: 8000,
      });

      // Attempt cleanup
      try {
        this.cleanupExpiredProgress();
      } catch (cleanupError) {
        console.error('Failed to cleanup after quota error:', cleanupError);
      }
    } else if (error.name === 'SecurityError') {
      toast.error('Storage Access Denied', {
        description: 'Unable to save progress due to browser security settings.',
        duration: 8000,
      });
    } else {
      toast.error('Save Error', {
        description: 'Failed to save session progress. Your answers may not be preserved.',
        duration: 5000,
      });
    }
  }

  /**
   * Recover from corrupted data
   */
  recoverFromCorruption(sessionId: number): boolean {
    try {
      console.warn(`Attempting to recover from corrupted data for session ${sessionId}`);

      // Remove corrupted session data
      quizStorage.removeSessionState(sessionId);

      // Clear any related progress checkpoints
      const progressKey = `quiz_progress_${sessionId}`;
      const uiStateKey = `quiz_ui_state_${sessionId}`;

      try {
        localStorage.removeItem(progressKey);
        localStorage.removeItem(uiStateKey);
      } catch (error) {
        console.warn('Failed to clear related storage keys:', error);
      }

      console.log(`Successfully recovered from corruption for session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Failed to recover from corruption:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sessionProgressManager = new SessionProgressManager();
