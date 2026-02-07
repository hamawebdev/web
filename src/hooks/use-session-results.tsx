// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { toast } from 'sonner';

interface SessionResultsFilters {
  answerType?: 'all' | 'correct' | 'incorrect';
  sessionType?: 'PRACTICE' | 'EXAM';
  sessionIds?: string;
  completedAfter?: string;
  completedBefore?: string;
  page?: number;
  limit?: number;
}

interface SessionResultsState {
  results: any;
  availableSessions: any[];
  loading: boolean;
  error: string | null;
  filters: SessionResultsFilters;
}

export function useSessionResults(initialFilters: SessionResultsFilters = {}) {
  const [state, setState] = useState<SessionResultsState>({
    results: null,
    availableSessions: [],
    loading: true,
    error: null,
    filters: {
      answerType: 'all',
      page: 1,
      limit: 20,
      ...initialFilters
    }
  });

  // Load session results
  const loadSessionResults = useCallback(async (filters?: SessionResultsFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const filtersToUse = filters || state.filters;
      const response = await StudentService.getSessionResults(filtersToUse);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          results: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load session results',
          loading: false
        }));
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load session results',
        loading: false
      }));
      toast.error('Failed to load session results');
    }
  }, [state.filters]);

  // Load available sessions
  const loadAvailableSessions = useCallback(async (type: 'all' | 'PRACTICE' | 'EXAM' = 'all') => {
    try {
      const response = await StudentService.getAvailableSessions(type);
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

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SessionResultsFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
        page: newFilters.page || 1 // Reset to first page unless explicitly set
      }
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        answerType: 'all',
        page: 1,
        limit: 20
      }
    }));
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    loadSessionResults();
    loadAvailableSessions();
  }, [loadSessionResults, loadAvailableSessions]);

  // Load data when filters change
  useEffect(() => {
    loadSessionResults(state.filters);
  }, [state.filters]);

  // Initial load
  useEffect(() => {
    loadAvailableSessions();
  }, [loadAvailableSessions]);

  return {
    results: state.results,
    availableSessions: state.availableSessions,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    updateFilters,
    clearFilters,
    refresh,
    loadSessionResults,
    loadAvailableSessions
  };
}

// Hook for specific session result types
export function useCorrectAnswers(filters: Omit<SessionResultsFilters, 'answerType'> = {}) {
  return useSessionResults({ ...filters, answerType: 'correct' });
}

export function useIncorrectAnswers(filters: Omit<SessionResultsFilters, 'answerType'> = {}) {
  return useSessionResults({ ...filters, answerType: 'incorrect' });
}

export function useExamResults(filters: Omit<SessionResultsFilters, 'sessionType'> = {}) {
  return useSessionResults({ ...filters, sessionType: 'EXAM' });
}

export function usePracticeResults(filters: Omit<SessionResultsFilters, 'sessionType'> = {}) {
  return useSessionResults({ ...filters, sessionType: 'PRACTICE' });
}
