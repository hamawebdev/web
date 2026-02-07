// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StudentService } from '@/lib/api-services';
import { AnalyticsSession, SessionType } from '@/types/api';
import { toast } from 'sonner';

interface UseAnalyticsSessionsParams {
  sessionType: SessionType;
  enabled?: boolean;
}

interface UseAnalyticsSessionsResult {
  sessions: AnalyticsSession[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isEmpty: boolean;
}

export function useAnalyticsSessions({
  sessionType,
  enabled = true
}: UseAnalyticsSessionsParams): UseAnalyticsSessionsResult {
  const [error, setError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error: queryError,
    refetch: queryRefetch
  } = useQuery({
    queryKey: ['analytics-sessions', sessionType],
    queryFn: async () => {
      const response = await StudentService.getQuizSessionsByType(sessionType);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch analytics sessions');
      }

      return response.data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 or 403 errors
      if (error?.response?.status === 404 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });

  const refetch = useCallback(() => {
    setError(null);
    queryRefetch();
  }, [queryRefetch]);

  // Handle different error states
  useEffect(() => {
    if (queryError) {
      console.error('Analytics sessions fetch error:', queryError);

      let errorMessage = 'Impossible de charger les statistiques des sessions.';

      if (queryError?.response?.status === 404) {
        errorMessage = 'Aucune session disponible pour ce type.';
      } else if (queryError?.response?.status === 403) {
        errorMessage = 'Vous n\'avez pas accès à ces statistiques.';
      } else if (queryError?.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      }

      setError(errorMessage);
    } else if (!queryError && data) {
      // Clear error when query succeeds
      setError(null);
    }
  }, [queryError, data]);

  const sessions = data?.sessions || [];
  const isEmpty = sessions.length === 0;

  return {
    sessions,
    loading: isLoading,
    error,
    refetch,
    isEmpty
  };
}

// Additional hook for managing session type state with persistence
export function useSessionTypeState(defaultType: SessionType = 'PRACTICE') {
  const [sessionType, setSessionType] = useState<SessionType>(defaultType);
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist session type to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const stored = localStorage.getItem('analytics-session-type');
        if (stored && ['PRACTICE', 'EXAM', 'RESIDENCY'].includes(stored)) {
          setSessionType(stored as SessionType);
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const updateSessionType = useCallback((newType: SessionType) => {
    setSessionType(newType);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('analytics-session-type', newType);
      } catch (error) {
        console.warn('Failed to write to localStorage:', error);
      }
    }
  }, []);

  return {
    sessionType,
    setSessionType: updateSessionType
  };
}
