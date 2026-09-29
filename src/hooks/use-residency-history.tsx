'use client';

import { useEffect, useMemo } from 'react';
import { useCachedResource } from '@/lib/cached-resource';
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

/** The student's résidanat sessions (throws on failure) */
async function fetchResidencySessions(): Promise<ResidencySession[]> {
  const response = await NewApiService.getResidencySessionsOnly();
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch residency sessions');
  }
  // The API returns the sessions array itself; older shapes nested it under `sessions`
  const payload: any = response.data;
  return Array.isArray(payload)
    ? payload
    : (payload?.sessions || payload?.data?.sessions || (Array.isArray(payload?.data) ? payload.data : []));
}

/**
 * Hook to fetch and manage residency session history
 * Uses the /api/v1/quizzes/residency-sessions-only endpoint. The last list shows at
 * once on later visits and is refreshed in the background.
 */
export function useResidencyHistory(): UseResidencyHistoryResult {
  const { data: sessions, loading, error, refresh } = useCachedResource('residency-history', fetchResidencySessions);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Summary statistics. The API sends `score` (null until a session is completed)
  const summary = useMemo(() => {
    if (!sessions) return null;
    const scores: number[] = sessions
      .map((s: ResidencySession) => s.score ?? s.percentage)
      .filter((v: unknown): v is number => typeof v === 'number' && Number.isFinite(v));
    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter((s: ResidencySession) => s.status === 'COMPLETED').length,
      inProgressSessions: sessions.filter((s: ResidencySession) => s.status === 'IN_PROGRESS').length,
      notStartedSessions: sessions.filter((s: ResidencySession) => s.status === 'NOT_STARTED').length,
      averageScore: scores.length > 0
        ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
        : 0
    };
  }, [sessions]);

  return {
    sessions: sessions ?? null,
    loading,
    error: sessions ? null : error,
    summary,
    refetch: refresh
  };
}
