/**
 * Offline Quiz Management Hook
 * 
 * Manages quiz sessions that have stored answers waiting for submission.
 * Provides functionality to detect, retry, and manage offline quiz sessions.
 */

import { useState, useEffect, useCallback } from 'react';
import { quizStorage, QuizSessionState } from '@/lib/quiz-storage';
import { QuizService } from '@/lib/api-services';
import { toast } from 'sonner';

export interface OfflineQuizSession {
  sessionId: number;
  title: string;
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  answersCount: number;
  lastUpdatedAt: Date;
  status: 'COMPLETED' | 'IN_PROGRESS';
}

export interface OfflineQuizStats {
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  totalAnswers: number;
  oldestSession: Date | null;
  newestSession: Date | null;
}

export function useOfflineQuiz() {
  const [offlineSessions, setOfflineSessions] = useState<OfflineQuizSession[]>([]);
  const [stats, setStats] = useState<OfflineQuizStats | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({});
  const [lastSync, setLastSync] = useState<Date | null>(null);

  /**
   * Load all offline quiz sessions from storage
   */
  const loadOfflineSessions = useCallback(() => {
    try {
      const sessions = quizStorage.getAllSessions();
      
      const offlineSessionsData: OfflineQuizSession[] = sessions.map(session => ({
        sessionId: session.sessionId,
        title: session.title,
        type: session.type,
        answersCount: Object.keys(session.answers).length,
        lastUpdatedAt: session.lastUpdatedAt,
        status: session.status,
      }));

      setOfflineSessions(offlineSessionsData);

      // Calculate statistics
      const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
      const inProgressSessions = sessions.filter(s => s.status === 'IN_PROGRESS');
      const allDates = sessions.map(s => s.lastUpdatedAt);
      
      const statsData: OfflineQuizStats = {
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        inProgressSessions: inProgressSessions.length,
        totalAnswers: sessions.reduce((total, session) => total + Object.keys(session.answers).length, 0),
        oldestSession: allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : null,
        newestSession: allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null,
      };

      setStats(statsData);
      console.log(`📊 Loaded ${sessions.length} offline quiz sessions`);
    } catch (error) {
      console.error('Failed to load offline sessions:', error);
    }
  }, []);

  /**
   * Submit a specific offline session
   */
  const submitOfflineSession = useCallback(async (sessionId: number): Promise<boolean> => {
    setIsSubmitting(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const sessionState = quizStorage.loadSessionState(sessionId);
      if (!sessionState) {
        throw new Error('Session not found in storage');
      }

      if (sessionState.status !== 'COMPLETED') {
        throw new Error('Session is not completed');
      }

      const answersForSubmission = quizStorage.getAnswersForSubmission(sessionId);
      if (answersForSubmission.length === 0) {
        throw new Error('No answers to submit');
      }

      console.log(`📤 Submitting offline session ${sessionId} with ${answersForSubmission.length} answers`);

      // Convert to API format (supports QCS and QCM)
      const apiAnswers = answersForSubmission.map(answer => ({
        questionId: answer.questionId,
        ...(Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length
          ? { selectedAnswerIds: answer.selectedAnswerIds }
          : (typeof answer.selectedAnswerId === 'number' ? { selectedAnswerId: answer.selectedAnswerId } : {})),
        timeSpent: answer.timeSpent,
      })).filter(entry => (entry as any).selectedAnswerId || (entry as any).selectedAnswerIds);

      if (apiAnswers.length > 0) {
        const response = await QuizService.submitAnswersBulk(sessionId, apiAnswers);
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to submit answers');
        }
      }

      // Remove from storage after successful submission
      quizStorage.removeSessionState(sessionId);
      
      // Reload sessions
      loadOfflineSessions();
      
      toast.success(`Quiz session ${sessionId} submitted successfully!`);
      console.log(`✅ Successfully submitted offline session ${sessionId}`);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit session';
      console.error(`Failed to submit offline session ${sessionId}:`, error);
      toast.error(`Failed to submit session ${sessionId}: ${errorMessage}`);
      return false;
    } finally {
      setIsSubmitting(prev => ({ ...prev, [sessionId]: false }));
    }
  }, [loadOfflineSessions]);

  /**
   * Submit all completed offline sessions
   */
  const submitAllOfflineSessions = useCallback(async (): Promise<{ success: number; failed: number }> => {
    const completedSessions = offlineSessions.filter(session => 
      session.status === 'COMPLETED' && !isSubmitting[session.sessionId]
    );

    if (completedSessions.length === 0) {
      toast.info('No completed sessions to submit');
      return { success: 0, failed: 0 };
    }

    console.log(`📤 Submitting ${completedSessions.length} offline sessions`);
    toast.loading(`Submitting ${completedSessions.length} quiz sessions...`, { id: 'bulk-submission' });

    let successCount = 0;
    let failedCount = 0;

    for (const session of completedSessions) {
      try {
        const success = await submitOfflineSession(session.sessionId);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        console.error(`Failed to submit session ${session.sessionId}:`, error);
      }
    }

    setLastSync(new Date());

    if (successCount > 0 && failedCount === 0) {
      toast.success(`Successfully submitted ${successCount} quiz sessions!`, { id: 'bulk-submission' });
    } else if (successCount > 0 && failedCount > 0) {
      toast.warning(`Submitted ${successCount} sessions, ${failedCount} failed`, { id: 'bulk-submission' });
    } else {
      toast.error(`Failed to submit ${failedCount} sessions`, { id: 'bulk-submission' });
    }

    console.log(`📊 Bulk submission completed: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount };
  }, [offlineSessions, isSubmitting, submitOfflineSession]);

  /**
   * Delete a specific offline session
   */
  const deleteOfflineSession = useCallback((sessionId: number) => {
    try {
      quizStorage.removeSessionState(sessionId);
      loadOfflineSessions();
      toast.success(`Session ${sessionId} deleted from local storage`);
      console.log(`🗑️ Deleted offline session ${sessionId}`);
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      toast.error(`Failed to delete session ${sessionId}`);
    }
  }, [loadOfflineSessions]);

  /**
   * Clear all offline sessions
   */
  const clearAllOfflineSessions = useCallback(() => {
    try {
      offlineSessions.forEach(session => {
        quizStorage.removeSessionState(session.sessionId);
      });
      loadOfflineSessions();
      toast.success('All offline sessions cleared');
      console.log('🗑️ Cleared all offline sessions');
    } catch (error) {
      console.error('Failed to clear offline sessions:', error);
      toast.error('Failed to clear offline sessions');
    }
  }, [offlineSessions, loadOfflineSessions]);

  /**
   * Get session details
   */
  const getSessionDetails = useCallback((sessionId: number): QuizSessionState | null => {
    return quizStorage.loadSessionState(sessionId);
  }, []);

  /**
   * Check if there are any sessions pending submission
   */
  const hasPendingSessions = useCallback((): boolean => {
    return offlineSessions.some(session => session.status === 'COMPLETED');
  }, [offlineSessions]);

  /**
   * Get storage usage information
   */
  const getStorageInfo = useCallback(() => {
    return quizStorage.getStorageStats();
  }, []);

  // Load sessions on mount and set up periodic refresh
  useEffect(() => {
    loadOfflineSessions();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadOfflineSessions, 30000);
    
    return () => clearInterval(interval);
  }, [loadOfflineSessions]);

  // Auto-submission DISABLED - manual submission only
  useEffect(() => {
    // Auto-submission is disabled to ensure manual submission workflow
    // Users must explicitly click "Submit Answers" to submit their quiz
    console.log('📝 Auto-submission disabled - manual submission required');
  }, []);

  return {
    // Data
    offlineSessions,
    stats,
    isSubmitting,
    lastSync,
    
    // Actions
    loadOfflineSessions,
    submitOfflineSession,
    submitAllOfflineSessions,
    deleteOfflineSession,
    clearAllOfflineSessions,
    getSessionDetails,
    
    // Utilities
    hasPendingSessions,
    getStorageInfo,
  };
}
