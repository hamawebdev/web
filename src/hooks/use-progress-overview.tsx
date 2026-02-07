'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { useStudentAuth } from './use-auth';

interface ProgressOverviewState {
  progressOverview: any | null;
  loading: boolean;
  error: string | null;
}

export function useProgressOverview() {
  const { isAuthenticated, loading: authLoading } = useStudentAuth();
  const [state, setState] = useState<ProgressOverviewState>({
    progressOverview: null,
    loading: true,
    error: null,
  });

  const fetchProgressOverview = useCallback(async () => {
    if (!isAuthenticated || authLoading) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await StudentService.getProgressOverview();

      if (response.success) {
        // Extract the actual progress data from the nested response structure
        // API returns: { success: true, data: { success: true, data: { success: true, data: {...} } } }
        const progressData = response.data?.data?.data || response.data?.data || response.data || null;

        setState(prev => ({
          ...prev,
          progressOverview: progressData,
          loading: false,
          error: null,
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch progress overview');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress overview';
      setState(prev => ({
        ...prev,
        progressOverview: null,
        loading: false,
        error: errorMessage,
      }));
      console.error('Progress overview fetch error:', error);
    }
  }, [isAuthenticated, authLoading]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchProgressOverview();
  }, [fetchProgressOverview]);

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchProgressOverview();
    }
  }, [isAuthenticated, authLoading, fetchProgressOverview]);

  return {
    ...state,
    refresh,
  };
}
