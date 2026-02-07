/**
 * Session Status Manager
 * 
 * Centralized utility for managing quiz session status updates
 * Implements the requirements for session status management:
 * - IN_PROGRESS when user exits before answering all questions
 * - COMPLETED when user finishes answering all questions
 * - Error handling with retry logic
 * - Validation of status enum values
 */

import { QuizService } from './api-services';
import { toast } from 'sonner';

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface SessionStatusUpdateOptions {
  showToast?: boolean;
  retryCount?: number;
  silent?: boolean;
}

export class SessionStatusManager {
  private static pendingUpdates = new Map<number, Promise<any>>();

  /**
   * Update session status to IN_PROGRESS
   * Called when user exits, pauses, or navigates away with unanswered questions
   */
  static async setInProgress(
    sessionId: number,
    options: SessionStatusUpdateOptions = {}
  ): Promise<boolean> {
    const { showToast = false, retryCount = 1, silent = false } = options;

    // Validate sessionId
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      const error = `Invalid sessionId: ${sessionId}. Must be a positive integer.`;
      if (!silent) {
        console.error(`❌ [SessionStatusManager] ${error}`);
      }
      if (showToast) {
        toast.error('Invalid session ID');
      }
      return false;
    }

    if (!silent) {
      console.log(`📝 [SessionStatusManager] Setting session ${sessionId} to IN_PROGRESS`);
    }

    const result = await this.updateStatus(sessionId, 'IN_PROGRESS', {
      showToast,
      retryCount,
      silent
    });

    if (!result.success && showToast) {
      toast.error('Failed to save session progress', {
        description: 'Your answers are saved locally and will be synced later.',
        duration: 5000
      });
    }

    return result.success;
  }

  /**
   * Update session status to COMPLETED
   * Called when user finishes answering all questions
   */
  static async setCompleted(
    sessionId: number,
    options: SessionStatusUpdateOptions = {}
  ): Promise<boolean> {
    const { showToast = true, retryCount = 1, silent = false } = options;

    // Validate sessionId
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      const error = `Invalid sessionId: ${sessionId}. Must be a positive integer.`;
      if (!silent) {
        console.error(`❌ [SessionStatusManager] ${error}`);
      }
      if (showToast) {
        toast.error('Invalid session ID');
      }
      return false;
    }

    if (!silent) {
      console.log(`🎉 [SessionStatusManager] Setting session ${sessionId} to COMPLETED`);
    }

    const result = await this.updateStatus(sessionId, 'COMPLETED', {
      showToast,
      retryCount,
      silent
    });

    if (!result.success && showToast) {
      toast.error('Failed to mark session as completed', {
        description: 'Your answers are submitted but status update failed.',
        duration: 5000
      });
    }

    return result.success;
  }

  /**
   * Determine appropriate status based on quiz state
   */
  static determineStatus(
    totalQuestions: number,
    answeredQuestions: number,
    isExiting: boolean = false
  ): SessionStatus {
    // If all questions are answered, mark as completed
    if (answeredQuestions === totalQuestions && totalQuestions > 0) {
      return 'COMPLETED';
    }
    
    // If exiting with unanswered questions, mark as in progress
    if (isExiting && answeredQuestions > 0) {
      return 'IN_PROGRESS';
    }

    // Default to in progress for any active session
    return 'IN_PROGRESS';
  }

  /**
   * Update status based on quiz completion state
   * Automatically determines the correct status
   */
  static async updateBasedOnCompletion(
    sessionId: number,
    totalQuestions: number,
    answeredQuestions: number,
    isExiting: boolean = false,
    options: SessionStatusUpdateOptions = {}
  ): Promise<boolean> {
    // Validate input data
    const validation = this.validateSessionData(sessionId, totalQuestions, answeredQuestions);
    if (!validation.isValid) {
      const errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
      console.error(`❌ [SessionStatusManager] ${errorMessage}`);

      if (options.showToast) {
        toast.error('Invalid session data for status update');
      }

      this.logStatusUpdate(sessionId, 'IN_PROGRESS', 'updateBasedOnCompletion', false, errorMessage);
      return false;
    }

    const status = this.determineStatus(totalQuestions, answeredQuestions, isExiting);
    const context = `updateBasedOnCompletion(isExiting=${isExiting})`;

    let result: boolean;
    if (status === 'COMPLETED') {
      result = await this.setCompleted(sessionId, options);
    } else {
      result = await this.setInProgress(sessionId, options);
    }

    this.logStatusUpdate(sessionId, status, context, result);
    return result;
  }

  /**
   * Core status update method with deduplication
   */
  private static async updateStatus(
    sessionId: number,
    status: SessionStatus,
    options: SessionStatusUpdateOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    const { retryCount = 1, silent = false } = options;
    const updateKey = `${sessionId}-${status}`;

    // Prevent duplicate concurrent updates for the same session and status
    if (this.pendingUpdates.has(sessionId)) {
      if (!silent) {
        console.log(`⏳ [SessionStatusManager] Status update already pending for session ${sessionId}`);
      }
      try {
        await this.pendingUpdates.get(sessionId);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    const updatePromise = this.performStatusUpdate(sessionId, status, retryCount, silent);
    this.pendingUpdates.set(sessionId, updatePromise);

    try {
      const result = await updatePromise;
      return result;
    } finally {
      this.pendingUpdates.delete(sessionId);
    }
  }

  /**
   * Perform the actual status update with retry logic
   */
  private static async performStatusUpdate(
    sessionId: number,
    status: SessionStatus,
    retryCount: number,
    silent: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await QuizService.updateQuizSessionStatusWithRetry(
        sessionId,
        status,
        retryCount
      );

      if (result.success && !silent) {
        console.log(`✅ [SessionStatusManager] Session ${sessionId} status updated to ${status}`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!silent) {
        console.error(`❌ [SessionStatusManager] Failed to update session ${sessionId} status:`, errorMessage);
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Handle browser beforeunload event
   * Sets status to IN_PROGRESS if there are unanswered questions
   */
  static handleBeforeUnload(
    sessionId: number,
    totalQuestions: number,
    answeredQuestions: number
  ): void {
    // Validate inputs
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      console.warn(`⚠️ [SessionStatusManager] Invalid sessionId for beforeunload: ${sessionId}`);
      return;
    }

    if (!Number.isInteger(totalQuestions) || totalQuestions <= 0) {
      console.warn(`⚠️ [SessionStatusManager] Invalid totalQuestions for beforeunload: ${totalQuestions}`);
      return;
    }

    if (!Number.isInteger(answeredQuestions) || answeredQuestions < 0) {
      console.warn(`⚠️ [SessionStatusManager] Invalid answeredQuestions for beforeunload: ${answeredQuestions}`);
      return;
    }

    // Only update if there are unanswered questions
    if (answeredQuestions < totalQuestions && answeredQuestions > 0) {
      // Use navigator.sendBeacon for reliable delivery during page unload
      const data = JSON.stringify({ status: 'IN_PROGRESS' });
      const url = `/api/students/quiz-sessions/${sessionId}/status`;

      if (navigator.sendBeacon) {
        try {
          const headers = {
            'Content-Type': 'application/json',
          };

          // Create a blob with proper headers for sendBeacon
          const blob = new Blob([data], { type: 'application/json' });
          const success = navigator.sendBeacon(url, blob);

          if (success) {
            console.log(`📡 [SessionStatusManager] Beacon sent for session ${sessionId} status update`);
          } else {
            console.warn(`⚠️ [SessionStatusManager] Beacon failed for session ${sessionId}`);
          }
        } catch (error) {
          console.warn(`⚠️ [SessionStatusManager] Failed to send beacon:`, error);
        }
      } else {
        // Fallback for browsers without sendBeacon support
        this.setInProgress(sessionId, { silent: true, retryCount: 0 });
      }
    }
  }

  /**
   * Validate session status enum value
   */
  static isValidStatus(status: string): status is SessionStatus {
    return ['IN_PROGRESS', 'COMPLETED'].includes(status);
  }

  /**
   * Get pending updates count (for debugging)
   */
  static getPendingUpdatesCount(): number {
    return this.pendingUpdates.size;
  }

  /**
   * Clear all pending updates (for cleanup)
   */
  static clearPendingUpdates(): void {
    this.pendingUpdates.clear();
  }

  /**
   * Validate quiz session data for status updates
   */
  static validateSessionData(
    sessionId: number,
    totalQuestions: number,
    answeredQuestions: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      errors.push(`Invalid sessionId: ${sessionId}. Must be a positive integer.`);
    }

    if (!Number.isInteger(totalQuestions) || totalQuestions <= 0) {
      errors.push(`Invalid totalQuestions: ${totalQuestions}. Must be a positive integer.`);
    }

    if (!Number.isInteger(answeredQuestions) || answeredQuestions < 0) {
      errors.push(`Invalid answeredQuestions: ${answeredQuestions}. Must be a non-negative integer.`);
    }

    if (answeredQuestions > totalQuestions) {
      errors.push(`Invalid state: answeredQuestions (${answeredQuestions}) cannot exceed totalQuestions (${totalQuestions}).`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Log session status update for debugging and monitoring
   */
  static logStatusUpdate(
    sessionId: number,
    status: SessionStatus,
    context: string,
    success: boolean,
    error?: string
  ): void {
    const logData = {
      sessionId,
      status,
      context,
      success,
      timestamp: new Date().toISOString(),
      ...(error && { error })
    };

    if (success) {
      console.log(`✅ [SessionStatusManager] Status update successful:`, logData);
    } else {
      console.error(`❌ [SessionStatusManager] Status update failed:`, logData);
    }

    // In production, this could be sent to monitoring/analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'session_status_update', {
        custom_map: {
          session_id: sessionId,
          status: status,
          context: context,
          success: success
        }
      });
    }
  }
}
