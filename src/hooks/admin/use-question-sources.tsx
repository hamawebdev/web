'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '@/lib/api-services';
import { QuestionSource } from '@/types/api';

interface UseQuestionSourcesState {
  questionSources: QuestionSource[];
  loading: boolean;
  error: string | null;
}

/**
 * Lightweight hook for fetching question sources for dropdowns and selection
 * This is a simpler version of useQuestionSourcesManagement for basic data fetching
 */
export function useQuestionSources() {
  const [state, setState] = useState<UseQuestionSourcesState>({
    questionSources: [],
    loading: true,
    error: null,
  });

  // Fetch all question sources (without pagination for dropdown use)
  const fetchQuestionSources = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Fetch with a high limit to get all sources for dropdown
      const response = await AdminService.getQuestionSources({
        page: 1,
        limit: 100 // Should be enough for most use cases
      });

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          questionSources: response.data.items || [],
          loading: false,
          error: null,
        }));
      } else {
        throw new Error(response.error?.toString() || 'Failed to fetch question sources');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question sources';
      console.error('❌ Error fetching question sources:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Load question sources on mount
  useEffect(() => {
    fetchQuestionSources();
  }, [fetchQuestionSources]);

  return {
    questionSources: state.questionSources,
    loading: state.loading,
    error: state.error,
    refetch: fetchQuestionSources,
    hasQuestionSources: state.questionSources.length > 0,
  };
}
