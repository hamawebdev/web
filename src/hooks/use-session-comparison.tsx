// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { SessionComparison, SessionSummary } from '@/types/api';
import { toast } from 'sonner';

interface SessionComparisonState {
  comparison: SessionComparison | null;
  selectedSessions: number[];
  availableSessions: any[];
  loading: boolean;
  error: string | null;
}

export function useSessionComparison(initialSessionIds: number[] = []) {
  const [state, setState] = useState<SessionComparisonState>({
    comparison: null,
    selectedSessions: initialSessionIds,
    availableSessions: [],
    loading: false,
    error: null
  });

  // Load available sessions for selection
  const loadAvailableSessions = useCallback(async () => {
    try {
      const response = await StudentService.getAvailableSessions('all');
      if (response.success) {
        setState(prev => ({
          ...prev,
          availableSessions: response.data.data || []
        }));
      }
    } catch (err) {
      console.error('Failed to load available sessions:', err);
    }
  }, []);

  // Compare selected sessions
  const compareSessions = useCallback(async (sessionIds?: number[]) => {
    const idsToCompare = sessionIds || state.selectedSessions;
    
    if (idsToCompare.length === 0) {
      setState(prev => ({
        ...prev,
        comparison: null,
        error: 'No sessions selected for comparison'
      }));
      return;
    }

    if (idsToCompare.length === 1) {
      setState(prev => ({
        ...prev,
        comparison: null,
        error: 'At least 2 sessions are required for comparison'
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await StudentService.compareSessionPerformance(idsToCompare);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          comparison: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to compare sessions',
          loading: false
        }));
        toast.error('Failed to compare sessions');
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to compare sessions',
        loading: false
      }));
      toast.error('Failed to compare sessions');
    }
  }, [state.selectedSessions]);

  // Add session to comparison
  const addSession = useCallback((sessionId: number) => {
    setState(prev => {
      if (prev.selectedSessions.includes(sessionId)) {
        toast.warning('Session already selected');
        return prev;
      }
      
      if (prev.selectedSessions.length >= 5) {
        toast.warning('Maximum 5 sessions can be compared at once');
        return prev;
      }

      const newSelectedSessions = [...prev.selectedSessions, sessionId];
      return {
        ...prev,
        selectedSessions: newSelectedSessions
      };
    });
  }, []);

  // Remove session from comparison
  const removeSession = useCallback((sessionId: number) => {
    setState(prev => ({
      ...prev,
      selectedSessions: prev.selectedSessions.filter(id => id !== sessionId)
    }));
  }, []);

  // Clear all selected sessions
  const clearSessions = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedSessions: [],
      comparison: null,
      error: null
    }));
  }, []);

  // Set multiple sessions at once
  const setSessions = useCallback((sessionIds: number[]) => {
    if (sessionIds.length > 5) {
      toast.warning('Maximum 5 sessions can be compared at once');
      return;
    }

    setState(prev => ({
      ...prev,
      selectedSessions: sessionIds
    }));
  }, []);

  // Get comparison insights
  const getComparisonInsights = useCallback(() => {
    if (!state.comparison) return [];

    const insights: string[] = [];
    const { sessions, metrics } = state.comparison;

    if (sessions.length < 2) return insights;

    // Accuracy insights
    if (metrics.accuracyImprovement > 5) {
      insights.push(`Great improvement! Your accuracy increased by ${metrics.accuracyImprovement.toFixed(1)}% between sessions.`);
    } else if (metrics.accuracyImprovement < -5) {
      insights.push(`Your accuracy decreased by ${Math.abs(metrics.accuracyImprovement).toFixed(1)}%. Consider reviewing the topics you struggled with.`);
    } else {
      insights.push('Your accuracy remained relatively stable across sessions.');
    }

    // Speed insights
    if (metrics.speedImprovement > 10) {
      insights.push(`You're getting faster! You saved an average of ${metrics.speedImprovement.toFixed(0)} seconds per question.`);
    } else if (metrics.speedImprovement < -10) {
      insights.push(`You're taking more time per question. This might indicate more careful consideration or difficulty with the material.`);
    }

    // Consistency insights
    if (metrics.consistencyScore > 80) {
      insights.push('Excellent consistency! Your performance is very stable across sessions.');
    } else if (metrics.consistencyScore < 60) {
      insights.push('Your performance varies significantly between sessions. Try to identify what factors affect your performance.');
    }

    // Session type insights
    const examSessions = sessions.filter(s => s.type === 'EXAM');
    const practiceSessions = sessions.filter(s => s.type === 'PRACTICE');
    
    if (examSessions.length > 0 && practiceSessions.length > 0) {
      const examAvg = examSessions.reduce((sum, s) => sum + s.accuracy, 0) / examSessions.length;
      const practiceAvg = practiceSessions.reduce((sum, s) => sum + s.accuracy, 0) / practiceSessions.length;
      
      if (examAvg > practiceAvg + 5) {
        insights.push('You perform better in exam conditions than practice sessions. Great exam readiness!');
      } else if (practiceAvg > examAvg + 5) {
        insights.push('Your practice performance is stronger than exam performance. Consider exam-specific preparation strategies.');
      }
    }

    return insights;
  }, [state.comparison]);

  // Load available sessions on mount
  useEffect(() => {
    loadAvailableSessions();
  }, [loadAvailableSessions]);

  // Auto-compare when sessions change
  useEffect(() => {
    if (state.selectedSessions.length >= 2) {
      compareSessions();
    } else {
      setState(prev => ({ ...prev, comparison: null, error: null }));
    }
  }, [state.selectedSessions, compareSessions]);

  return {
    // Data
    comparison: state.comparison,
    selectedSessions: state.selectedSessions,
    availableSessions: state.availableSessions,
    insights: getComparisonInsights(),
    
    // State
    loading: state.loading,
    error: state.error,
    canCompare: state.selectedSessions.length >= 2,
    
    // Actions
    addSession,
    removeSession,
    clearSessions,
    setSessions,
    compareSessions: () => compareSessions(),
    refresh: loadAvailableSessions,
    
    // Computed properties
    sessionCount: state.selectedSessions.length,
    maxSessionsReached: state.selectedSessions.length >= 5,
    
    // Helper methods
    isSessionSelected: (sessionId: number) => state.selectedSessions.includes(sessionId),
    toggleSession: (sessionId: number) => {
      if (state.selectedSessions.includes(sessionId)) {
        removeSession(sessionId);
      } else {
        addSession(sessionId);
      }
    }
  };
}

// Specialized hook for comparing recent sessions
export function useRecentSessionComparison(count: number = 3) {
  const [recentSessionIds, setRecentSessionIds] = useState<number[]>([]);
  const comparison = useSessionComparison(recentSessionIds);

  useEffect(() => {
    // Get recent sessions from available sessions
    if (comparison.availableSessions.length > 0) {
      const recent = comparison.availableSessions
        .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
        .slice(0, count)
        .map(session => session.id);
      
      setRecentSessionIds(recent);
      comparison.setSessions(recent);
    }
  }, [comparison.availableSessions, count]);

  return comparison;
}

// Hook for comparing exam vs practice sessions
export function useExamVsPracticeComparison() {
  const [examSessions, setExamSessions] = useState<number[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<number[]>([]);
  const comparison = useSessionComparison();

  useEffect(() => {
    if (comparison.availableSessions.length > 0) {
      const exams = comparison.availableSessions
        .filter(s => s.type === 'EXAM')
        .slice(0, 2)
        .map(s => s.id);
      
      const practice = comparison.availableSessions
        .filter(s => s.type === 'PRACTICE')
        .slice(0, 2)
        .map(s => s.id);
      
      setExamSessions(exams);
      setPracticeSessions(practice);
      comparison.setSessions([...exams, ...practice]);
    }
  }, [comparison.availableSessions]);

  return {
    ...comparison,
    examSessions,
    practiceSessions
  };
}
