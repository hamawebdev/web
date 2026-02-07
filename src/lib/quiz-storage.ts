/**
 * Client-Side Quiz Storage Service
 * 
 * Manages temporary storage of quiz answers and session state on the client side.
 * All answers are stored locally until the quiz session is fully completed.
 */

export interface QuizAnswer {
  questionId: number;
  selectedAnswerId?: number;
  selectedAnswerIds?: number[];
  selectedOptions?: string[]; // For backward compatibility
  textAnswer?: string;
  isCorrect?: boolean;
  timeSpent: number;
  timestamp: Date;
  flags?: ('difficult' | 'review_later' | 'report_error')[];
  notes?: string;
}

export interface QuizUIState {
  sidebarOpen: boolean;
  soundMuted: boolean;
  theme?: string;
  fontSize?: string;
  compactMode?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export interface QuizSessionState {
  sessionId: number;
  title: string;
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Record<number, QuizAnswer>;
  startedAt: Date;
  lastUpdatedAt: Date;
  timeSpent: number;
  bookmarkedQuestions: number[];
  flaggedQuestions: number[];
  settings: {
    showExplanations?: 'after_each' | 'at_end' | 'never';
    timeLimit?: number;
    shuffleQuestions?: boolean;
  };
  // Enhanced UI state persistence
  uiState: QuizUIState;
  // Session progress tracking
  lastQuestionIndex: number;
  progressCheckpoints: {
    questionIndex: number;
    timestamp: Date;
    timeSpent: number;
  }[];
}

export interface QuizStorageStats {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  totalAnswers: number;
  storageSize: number;
  lastCleanup: Date | null;
}

class QuizStorageService {
  private readonly STORAGE_PREFIX = 'quiz_session_';
  private readonly UI_STATE_PREFIX = 'quiz_ui_state_';
  private readonly PROGRESS_PREFIX = 'quiz_progress_';
  private readonly METADATA_KEY = 'quiz_storage_metadata';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Save quiz session state to localStorage
   */
  saveSessionState(sessionState: QuizSessionState): void {
    try {
      const key = this.getSessionKey(sessionState.sessionId);
      const data = {
        ...sessionState,
        lastUpdatedAt: new Date(),
        version: 2 // Updated version for enhanced state
      };

      localStorage.setItem(key, JSON.stringify(data, this.dateReplacer));
      this.updateMetadata();

      console.log(`💾 Saved quiz session ${sessionState.sessionId} to localStorage`);
    } catch (error) {
      console.error('Failed to save quiz session state:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * Save UI state separately for faster access
   */
  saveUIState(sessionId: number, uiState: QuizUIState): void {
    try {
      const key = this.getUIStateKey(sessionId);
      const data = {
        ...uiState,
        lastUpdatedAt: new Date(),
        version: 1
      };

      localStorage.setItem(key, JSON.stringify(data, this.dateReplacer));
      console.log(`💾 Saved UI state for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to save UI state:', error);
    }
  }

  /**
   * Save session progress checkpoint
   */
  saveProgressCheckpoint(sessionId: number, questionIndex: number, timeSpent: number): void {
    try {
      const key = this.getProgressKey(sessionId);
      const checkpoint = {
        questionIndex,
        timestamp: new Date(),
        timeSpent,
        version: 1
      };

      localStorage.setItem(key, JSON.stringify(checkpoint, this.dateReplacer));
      console.log(`📍 Saved progress checkpoint for session ${sessionId} at question ${questionIndex}`);
    } catch (error) {
      console.error('Failed to save progress checkpoint:', error);
    }
  }

  /**
   * Load quiz session state from localStorage
   */
  loadSessionState(sessionId: number): QuizSessionState | null {
    try {
      const key = this.getSessionKey(sessionId);
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const sessionState = JSON.parse(data, this.dateReviver) as QuizSessionState;

      // Check if session is expired
      if (this.isSessionExpired(sessionState)) {
        console.log(`⏰ Session ${sessionId} has expired, removing from storage`);
        this.removeSessionState(sessionId);
        return null;
      }

      // Migrate old session state format if needed
      const migratedState = this.migrateSessionState(sessionState);

      console.log(`📖 Loaded quiz session ${sessionId} from localStorage`);
      return migratedState;
    } catch (error) {
      console.error(`Failed to load quiz session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Load UI state for a session
   */
  loadUIState(sessionId: number): QuizUIState | null {
    try {
      const key = this.getUIStateKey(sessionId);
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const uiState = JSON.parse(data, this.dateReviver) as QuizUIState;
      console.log(`📖 Loaded UI state for session ${sessionId}`);
      return uiState;
    } catch (error) {
      console.error(`Failed to load UI state for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Load progress checkpoint for a session
   */
  loadProgressCheckpoint(sessionId: number): { questionIndex: number; timestamp: Date; timeSpent: number } | null {
    try {
      const key = this.getProgressKey(sessionId);
      const data = localStorage.getItem(key);

      if (!data) {
        return null;
      }

      const checkpoint = JSON.parse(data, this.dateReviver);
      console.log(`📍 Loaded progress checkpoint for session ${sessionId}`);
      return checkpoint;
    } catch (error) {
      console.error(`Failed to load progress checkpoint for session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Save individual answer to session
   */
  saveAnswer(sessionId: number, answer: QuizAnswer): void {
    const sessionState = this.loadSessionState(sessionId);
    if (!sessionState) {
      console.warn(`Cannot save answer: Session ${sessionId} not found`);
      return;
    }

    sessionState.answers[answer.questionId] = {
      ...answer,
      timestamp: new Date()
    };
    sessionState.lastUpdatedAt = new Date();

    this.saveSessionState(sessionState);
    console.log(`💾 Saved answer for question ${answer.questionId} in session ${sessionId}`);
  }

  /**
   * Get all answers for a session
   */
  getSessionAnswers(sessionId: number): Record<number, QuizAnswer> {
    const sessionState = this.loadSessionState(sessionId);
    return sessionState?.answers || {};
  }

  /**
   * Update session progress
   */
  updateSessionProgress(sessionId: number, updates: Partial<QuizSessionState>): void {
    const sessionState = this.loadSessionState(sessionId);
    if (!sessionState) {
      console.warn(`Cannot update progress: Session ${sessionId} not found`);
      return;
    }

    Object.assign(sessionState, updates, { lastUpdatedAt: new Date() });
    this.saveSessionState(sessionState);
  }

  /**
   * Mark session as completed and prepare for submission
   */
  completeSession(sessionId: number): QuizSessionState | null {
    const sessionState = this.loadSessionState(sessionId);
    if (!sessionState) {
      console.warn(`Cannot complete session: Session ${sessionId} not found`);
      return null;
    }

    sessionState.status = 'COMPLETED';
    sessionState.lastUpdatedAt = new Date();
    
    this.saveSessionState(sessionState);
    console.log(`✅ Marked session ${sessionId} as completed`);
    
    return sessionState;
  }

  /**
   * Remove a specific answer from session
   */
  removeAnswer(sessionId: number, questionId: number): void {
    try {
      const sessionState = this.loadSessionState(sessionId);
      if (!sessionState) {
        console.warn(`Cannot remove answer: Session ${sessionId} not found`);
        return;
      }

      delete sessionState.answers[questionId];
      sessionState.lastUpdatedAt = new Date();
      this.saveSessionState(sessionState);
      console.log(`🗑️ Removed answer for question ${questionId} from session ${sessionId}`);
    } catch (error) {
      console.error(`Failed to remove answer for question ${questionId}:`, error);
    }
  }

  /**
   * Get all answers ready for submission
   */
  getAnswersForSubmission(sessionId: number): QuizAnswer[] {
    const answers = this.getSessionAnswers(sessionId);
    return Object.values(answers).filter(answer =>
      answer.selectedAnswerId || answer.selectedAnswerIds?.length || answer.textAnswer
    );
  }

  /**
   * Remove session state after successful submission
   */
  removeSessionState(sessionId: number): void {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const uiStateKey = this.getUIStateKey(sessionId);
      const progressKey = this.getProgressKey(sessionId);

      localStorage.removeItem(sessionKey);
      localStorage.removeItem(uiStateKey);
      localStorage.removeItem(progressKey);

      this.updateMetadata();
      console.log(`🗑️ Removed session ${sessionId} and related data from localStorage`);
    } catch (error) {
      console.error(`Failed to remove session ${sessionId}:`, error);
    }
  }

  /**
   * Reset session progress while keeping UI preferences
   */
  resetSessionProgress(sessionId: number): void {
    try {
      const sessionState = this.loadSessionState(sessionId);
      if (!sessionState) return;

      // Reset progress but keep UI state
      const resetState: QuizSessionState = {
        ...sessionState,
        currentQuestionIndex: 0,
        lastQuestionIndex: 0,
        timeSpent: 0,
        answers: {},
        status: 'NOT_STARTED',
        progressCheckpoints: [],
        lastUpdatedAt: new Date()
      };

      this.saveSessionState(resetState);

      // Remove progress checkpoint
      const progressKey = this.getProgressKey(sessionId);
      localStorage.removeItem(progressKey);

      console.log(`🔄 Reset progress for session ${sessionId}`);
    } catch (error) {
      console.error(`Failed to reset session progress ${sessionId}:`, error);
    }
  }

  /**
   * Get all stored sessions
   */
  getAllSessions(): QuizSessionState[] {
    const sessions: QuizSessionState[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const sessionId = this.extractSessionId(key);
          if (sessionId) {
            const session = this.loadSessionState(sessionId);
            if (session) {
              sessions.push(session);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load all sessions:', error);
    }

    return sessions.sort((a, b) => b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime());
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): QuizStorageStats {
    const sessions = this.getAllSessions();
    const metadata = this.getMetadata();
    
    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'COMPLETED').length,
      inProgressSessions: sessions.filter(s => s.status === 'IN_PROGRESS').length,
      totalAnswers: sessions.reduce((total, session) => total + Object.keys(session.answers).length, 0),
      storageSize: this.calculateStorageSize(),
      lastCleanup: metadata.lastCleanup
    };
  }

  /**
   * Clean up expired sessions and optimize storage
   */
  cleanup(): void {
    try {
      const sessions = this.getAllSessions();
      let removedCount = 0;

      sessions.forEach(session => {
        if (this.isSessionExpired(session)) {
          this.removeSessionState(session.sessionId);
          removedCount++;
        }
      });

      // Update metadata
      const metadata = this.getMetadata();
      metadata.lastCleanup = new Date();
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata, this.dateReplacer));

      console.log(`🧹 Cleanup completed: removed ${removedCount} expired sessions`);
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(session: QuizSessionState): boolean {
    const now = new Date().getTime();
    const sessionTime = session.lastUpdatedAt.getTime();
    return (now - sessionTime) > this.SESSION_EXPIRY;
  }

  /**
   * Migrate old session state format to new format
   */
  private migrateSessionState(sessionState: any): QuizSessionState {
    // Check if already migrated
    if (sessionState.uiState && sessionState.lastQuestionIndex !== undefined) {
      return sessionState as QuizSessionState;
    }

    // Migrate from old format
    const migratedState: QuizSessionState = {
      ...sessionState,
      // Add missing fields with defaults
      uiState: {
        sidebarOpen: true,
        soundMuted: false,
        theme: undefined,
        fontSize: undefined,
        compactMode: false,
        reducedMotion: false,
        highContrast: false
      },
      lastQuestionIndex: sessionState.currentQuestionIndex || 0,
      progressCheckpoints: []
    };

    // Save migrated state
    try {
      this.saveSessionState(migratedState);
      console.log(`🔄 Migrated session ${sessionState.sessionId} to new format`);
    } catch (error) {
      console.warn('Failed to save migrated session state:', error);
    }

    return migratedState;
  }

  /**
   * Generate storage key for session
   */
  private getSessionKey(sessionId: number): string {
    return `${this.STORAGE_PREFIX}${sessionId}`;
  }

  private getUIStateKey(sessionId: number): string {
    return `${this.UI_STATE_PREFIX}${sessionId}`;
  }

  private getProgressKey(sessionId: number): string {
    return `${this.PROGRESS_PREFIX}${sessionId}`;
  }

  /**
   * Extract session ID from storage key
   */
  private extractSessionId(key: string): number | null {
    const match = key.match(new RegExp(`^${this.STORAGE_PREFIX}(\\d+)$`));
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Calculate total storage size used
   */
  private calculateStorageSize(): number {
    let totalSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.error('Failed to calculate storage size:', error);
    }
    return totalSize;
  }

  /**
   * Handle storage errors (quota exceeded, etc.)
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting cleanup...');
      this.cleanup();
      
      // If still over quota, remove oldest sessions
      const storageSize = this.calculateStorageSize();
      if (storageSize > this.MAX_STORAGE_SIZE) {
        this.forceCleanup();
      }
    }
  }

  /**
   * Force cleanup of oldest sessions when storage is full
   */
  private forceCleanup(): void {
    const sessions = this.getAllSessions();
    const oldestSessions = sessions
      .sort((a, b) => a.lastUpdatedAt.getTime() - b.lastUpdatedAt.getTime())
      .slice(0, Math.ceil(sessions.length * 0.3)); // Remove oldest 30%

    oldestSessions.forEach(session => {
      this.removeSessionState(session.sessionId);
    });

    console.log(`🚨 Force cleanup: removed ${oldestSessions.length} oldest sessions`);
  }

  /**
   * Get/update metadata
   */
  private getMetadata(): { lastCleanup: Date | null } {
    try {
      const data = localStorage.getItem(this.METADATA_KEY);
      return data ? JSON.parse(data, this.dateReviver) : { lastCleanup: null };
    } catch {
      return { lastCleanup: null };
    }
  }

  private updateMetadata(): void {
    // Trigger cleanup if needed
    const metadata = this.getMetadata();
    const now = new Date();
    
    if (!metadata.lastCleanup || (now.getTime() - metadata.lastCleanup.getTime()) > this.CLEANUP_INTERVAL) {
      setTimeout(() => this.cleanup(), 1000); // Async cleanup
    }
  }

  /**
   * Validate session state data integrity
   */
  private validateSessionState(sessionState: any): boolean {
    try {
      // Check required fields
      if (!sessionState.sessionId || !sessionState.title || !sessionState.type) {
        return false;
      }

      // Check data types
      if (typeof sessionState.sessionId !== 'number' ||
          typeof sessionState.currentQuestionIndex !== 'number' ||
          typeof sessionState.totalQuestions !== 'number' ||
          typeof sessionState.timeSpent !== 'number') {
        return false;
      }

      // Check ranges
      if (sessionState.currentQuestionIndex < 0 ||
          sessionState.totalQuestions <= 0 ||
          sessionState.timeSpent < 0) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session state validation failed:', error);
      return false;
    }
  }

  /**
   * JSON serialization helpers for Date objects
   */
  private dateReplacer(key: string, value: any): any {
    return value instanceof Date ? value.toISOString() : value;
  }

  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }
}

// Export singleton instance
export const quizStorage = new QuizStorageService();

// Export types and service
export default quizStorage;
