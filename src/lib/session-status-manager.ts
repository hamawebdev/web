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
import { AUTH_TOKEN_STORAGE_KEY } from './api-client';
import { API_BASE_URL } from './config';
import { toast } from 'sonner';

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface SessionStatusUpdateOptions {
  showToast?: boolean;
  retryCount?: number;
  silent?: boolean;
}

export class SessionStatusManager {
  // Keyed by session and status: a pending IN_PROGRESS update never swallows a COMPLETED one
  private static pendingUpdates = new Map<string, Promise<any>>();

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
   * True when the server already holds the session as completed (finished in another tab, for
   * example): it accepts no more answers, and its results are the answers it saved
   */
  static async isCompletedOnServer(sessionId: number): Promise<boolean> {
    try {
      const response: any = await QuizService.getQuizSession(sessionId);
      const session = response?.data?.data ?? response?.data;
      return response?.success === true && session?.status === 'COMPLETED';
    } catch {
      return false;
    }
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
    if (this.pendingUpdates.has(updateKey)) {
      if (!silent) {
        console.log(`⏳ [SessionStatusManager] Status update already pending for session ${sessionId}`);
      }
      try {
        return await this.pendingUpdates.get(updateKey);
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    const updatePromise = this.performStatusUpdate(sessionId, status, retryCount, silent);
    this.pendingUpdates.set(updateKey, updatePromise);

    try {
      const result = await updatePromise;
      return result;
    } finally {
      this.pendingUpdates.delete(updateKey);
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
      // PATCH /api/v1/students/quiz-sessions/:sessionId/status on the API origin with the
      // Bearer token. sendBeacon cannot do this (POST only, no Authorization header), so use
      // a keepalive fetch, which the browser lets outlive the page during unload.
      const body = JSON.stringify({ status: 'IN_PROGRESS' });
      const url = `${API_BASE_URL}/students/quiz-sessions/${sessionId}/status`;

      let token: string | null = null;
      try {
        token = typeof window !== 'undefined' ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
      } catch {
        token = null;
      }

      if (!token) {
        console.warn(`⚠️ [SessionStatusManager] No auth token; skipping unload status update for session ${sessionId}`);
        return;
      }

      if (typeof fetch === 'function') {
        try {
          fetch(url, {
            method: 'PATCH',
            keepalive: true,
            headers: {
              Authorization: 'Bearer ' + token,
              'Content-Type': 'application/json',
            },
            body,
          }).catch((error) => {
            console.warn(`⚠️ [SessionStatusManager] Keepalive status update failed for session ${sessionId}:`, error instanceof Error ? error.message : error);
          });
          console.log(`📡 [SessionStatusManager] Keepalive status update sent for session ${sessionId}`);
        } catch (error) {
          console.warn(`⚠️ [SessionStatusManager] Failed to send keepalive status update:`, error instanceof Error ? error.message : error);
        }
      } else {
        // Fallback for environments without fetch
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
