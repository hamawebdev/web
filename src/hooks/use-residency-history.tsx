'use client';

import { useState, useEffect, useCallback } from 'react';
import { NewApiService } from '@/lib/api/new-api-services';
import { toast } from 'sonner';

export interface ResidencySession {
  id: number;
  type: 'RESIDENCY';
  title: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  score: number;
  percentage: number;
  questionsCount: number;
  answersCount: number;
  startedAt: string | null;
  completedAt: string | null;
  timeSpent: number;
  createdAt: string;
  stats: {
    averagePerQuestion: number;
    totalQuestions: number;
    answeredCorrect: number;
    answeredWrong: number;
    consulted: number;
    accuracy: string;
  };
}

export interface ResidencyHistoryState {
  sessions: ResidencySession[] | null;
  loading: boolean;
  error: string | null;
  summary: {
    totalSessions: number;
    completedSessions: number;
    inProgressSessions: number;
    notStartedSessions: number;
    averageScore: number;
  } | null;
}

export interface UseResidencyHistoryResult extends ResidencyHistoryState {
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage residency session history
 * Uses the /api/v1/quizzes/residency-sessions-only endpoint
 */
export function useResidencyHistory(): UseResidencyHistoryResult {
  const [state, setState] = useState<ResidencyHistoryState>({
    sessions: null,
    loading: true,
    error: null,
    summary: null
  });

  // Fetch residency sessions
  const fetchSessions = useCallback(async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      console.log('🩺 [useResidencyHistory] Fetching residency sessions...');

      const response = await NewApiService.getResidencySessionsOnly();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch residency sessions');
      }

      // Extract sessions from response
      const sessions = response.data?.data?.sessions || response.data?.sessions || [];
      
      console.log('🩺 [useResidencyHistory] Sessions fetched:', {
        count: sessions.length,
        sessions: sessions.slice(0, 2) // Log first 2 for debugging
      });

      // Calculate summary statistics
      const summary = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s: ResidencySession) => s.status === 'COMPLETED').length,
        inProgressSessions: sessions.filter((s: ResidencySession) => s.status === 'IN_PROGRESS').length,
        notStartedSessions: sessions.filter((s: ResidencySession) => s.status === 'NOT_STARTED').length,
        averageScore: sessions.length > 0
          ? Math.round(sessions.reduce((sum: number, s: ResidencySession) => sum + s.percentage, 0) / sessions.length)
          : 0
      };

      setState({
        sessions,
        loading: false,
        error: null,
        summary
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch residency sessions';
      console.error('💥 [useResidencyHistory] Error:', errorMessage);
      
      setState({
        sessions: null,
        loading: false,
        error: errorMessage,
        summary: null
      });

      toast.error(errorMessage);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    ...state,
    refetch: fetchSessions
  };
}

