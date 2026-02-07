/**
 * Session Restoration Service
 * 
 * Handles the logic for detecting and restoring saved session progress
 * when users return to a session, with validation and fallback mechanisms.
 */

import { sessionProgressManager, SessionProgressData } from './session-progress-manager';
import { quizStorage } from './quiz-storage';
import { toast } from 'sonner';

export interface SessionRestorationOptions {
  sessionId: number;
  totalQuestions: number;
  allowCorruptedDataReset?: boolean;
  showNotifications?: boolean;
  validateAnswers?: boolean;
}

export interface SessionRestorationResult {
  success: boolean;
  restored: boolean;
  data?: SessionProgressData;
  error?: string;
  action: 'restored' | 'reset' | 'fresh_start' | 'error';
  message?: string;
}

class SessionRestorationService {
  /**
   * Attempt to restore session progress with comprehensive validation
   */
  async restoreSession(options: SessionRestorationOptions): Promise<SessionRestorationResult> {
    const { sessionId, totalQuestions, allowCorruptedDataReset = true, showNotifications = true } = options;

    try {
      // Check if there's any saved progress
      const progressSummary = sessionProgressManager.getProgressSummary(sessionId);
      
      if (!progressSummary.hasProgress) {
        return {
          success: true,
          restored: false,
          action: 'fresh_start',
          message: 'No saved progress found. Starting fresh session.'
        };
      }

      // Attempt to restore progress
      const restorationResult = sessionProgressManager.restoreProgress(sessionId, totalQuestions);

      if (restorationResult.success && restorationResult.data) {
        const progressData = restorationResult.data;
        
        // Additional validation
        const validationResult = this.validateRestoredData(progressData, totalQuestions);
        
        if (!validationResult.isValid) {
          if (allowCorruptedDataReset) {
            await this.handleCorruptedData(sessionId, validationResult.error, showNotifications);
            return {
              success: true,
              restored: false,
              action: 'reset',
              message: 'Session data was corrupted and has been reset.'
            };
          } else {
            return {
              success: false,
              restored: false,
              action: 'error',
              error: validationResult.error,
              message: 'Session data validation failed.'
            };
          }
        }

        // Show restoration notification
        if (showNotifications && this.shouldShowRestorationNotification(progressData)) {
          this.showRestorationNotification(progressData);
        }

        return {
          success: true,
          restored: true,
          data: progressData,
          action: 'restored',
          message: `Restored session at question ${progressData.currentQuestionIndex + 1} of ${totalQuestions}.`
        };
      } else {
        // Handle restoration failure
        if (restorationResult.isCorrupted && allowCorruptedDataReset) {
          await this.handleCorruptedData(sessionId, restorationResult.error, showNotifications);
          return {
            success: true,
            restored: false,
            action: 'reset',
            message: 'Session data was corrupted and has been reset.'
          };
        } else {
          return {
            success: false,
            restored: false,
            action: 'error',
            error: restorationResult.error,
            message: 'Failed to restore session progress.'
          };
        }
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      return {
        success: false,
        restored: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'An unexpected error occurred during session restoration.'
      };
    }
  }

  /**
   * Validate restored session data for integrity
   */
  private validateRestoredData(data: SessionProgressData, expectedTotalQuestions: number): {
    isValid: boolean;
    error?: string;
  } {
    // Check basic data integrity
    if (!data.sessionId || !data.totalQuestions) {
      return { isValid: false, error: 'Missing required session data' };
    }

    // Check question count consistency
    if (data.totalQuestions !== expectedTotalQuestions) {
      return { 
        isValid: false, 
        error: `Question count mismatch: expected ${expectedTotalQuestions}, found ${data.totalQuestions}` 
      };
    }

    // Check question index bounds
    if (data.currentQuestionIndex < 0 || data.currentQuestionIndex >= expectedTotalQuestions) {
      return { 
        isValid: false, 
        error: `Invalid question index: ${data.currentQuestionIndex}` 
      };
    }

    // Check timestamp validity
    if (!data.timestamp || isNaN(new Date(data.timestamp).getTime())) {
      return { isValid: false, error: 'Invalid timestamp data' };
    }

    // Check if data is too old (more than 7 days)
    const daysSinceLastUpdate = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastUpdate > 7) {
      return { isValid: false, error: 'Session data is too old (>7 days)' };
    }

    // Validate answers structure
    if (data.answers && typeof data.answers === 'object') {
      for (const [questionId, answer] of Object.entries(data.answers)) {
        if (!answer || typeof answer !== 'object') {
          return { isValid: false, error: `Invalid answer data for question ${questionId}` };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Handle corrupted session data
   */
  private async handleCorruptedData(sessionId: number, error?: string, showNotification = true): Promise<void> {
    try {
      console.warn(`Handling corrupted session data for session ${sessionId}:`, error);
      
      // Reset the session progress
      sessionProgressManager.resetProgress(sessionId);
      
      if (showNotification) {
        toast.warning('Session Data Reset', {
          description: 'Your previous session data was corrupted and has been reset. Starting fresh.',
          duration: 5000,
        });
      }
    } catch (resetError) {
      console.error('Failed to reset corrupted session data:', resetError);
      if (showNotification) {
        toast.error('Session Reset Failed', {
          description: 'Unable to reset corrupted session data. Please refresh the page.',
          duration: 8000,
        });
      }
    }
  }

  /**
   * Determine if restoration notification should be shown
   */
  private shouldShowRestorationNotification(data: SessionProgressData): boolean {
    // Show notification if there's meaningful progress
    const hasAnswers = Object.keys(data.answers).length > 0;
    const hasProgress = data.currentQuestionIndex > 0;
    const hasTimeSpent = data.timeSpent > 30; // More than 30 seconds
    
    return hasAnswers || hasProgress || hasTimeSpent;
  }

  /**
   * Show restoration notification with options
   */
  private showRestorationNotification(data: SessionProgressData): void {
    const questionNumber = data.currentQuestionIndex + 1;
    const totalQuestions = data.totalQuestions;
    const answeredCount = Object.keys(data.answers).length;
    
    let description = `Resumed at Question ${questionNumber} of ${totalQuestions}`;
    if (answeredCount > 0) {
      description += ` • ${answeredCount} answer${answeredCount !== 1 ? 's' : ''} saved`;
    }
    if (data.timeSpent > 0) {
      const minutes = Math.floor(data.timeSpent / 60);
      const seconds = data.timeSpent % 60;
      if (minutes > 0) {
        description += ` • ${minutes}m ${seconds}s elapsed`;
      } else {
        description += ` • ${seconds}s elapsed`;
      }
    }

    toast.success('Session Restored', {
      description,
      duration: 6000,
      action: {
        label: 'Start Over',
        onClick: () => {
          sessionProgressManager.resetProgress(data.sessionId);
        }
      }
    });
  }

  /**
   * Get session restoration status without actually restoring
   */
  getRestorationStatus(sessionId: number): {
    hasProgress: boolean;
    summary: string;
    canRestore: boolean;
    lastUpdated: Date | null;
  } {
    try {
      const progressSummary = sessionProgressManager.getProgressSummary(sessionId);
      
      if (!progressSummary.hasProgress) {
        return {
          hasProgress: false,
          summary: 'No saved progress',
          canRestore: false,
          lastUpdated: null
        };
      }

      const summary = `Question ${progressSummary.currentQuestion}/${progressSummary.totalQuestions} • ${progressSummary.answeredQuestions} answered`;
      
      return {
        hasProgress: true,
        summary,
        canRestore: true,
        lastUpdated: progressSummary.lastUpdated
      };
    } catch (error) {
      console.error('Failed to get restoration status:', error);
      return {
        hasProgress: false,
        summary: 'Error checking progress',
        canRestore: false,
        lastUpdated: null
      };
    }
  }

  /**
   * Clean up old session data
   */
  cleanupOldSessions(): void {
    try {
      sessionProgressManager.cleanupExpiredProgress();
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}

// Export singleton instance
export const sessionRestorationService = new SessionRestorationService();
