// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { AdvancedSessionFilters } from '@/types/api';
import { toast } from 'sonner';

interface AdvancedSessionFiltersState {
  results: any;
  availableSessions: any[];
  loading: boolean;
  error: string | null;
  filters: AdvancedSessionFilters;
}

export function useAdvancedSessionFilters(initialFilters: AdvancedSessionFilters = {}) {
  const [state, setState] = useState<AdvancedSessionFiltersState>({
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

  // Load session results with advanced filtering
  const loadSessionResults = useCallback(async (filters?: AdvancedSessionFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const filtersToUse = filters || state.filters;
      const response = await StudentService.getAdvancedSessionResults(filtersToUse);
      
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

  // Load available sessions for filtering
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

  // Update filters with validation
  const updateFilters = useCallback((newFilters: Partial<AdvancedSessionFilters>) => {
    setState(prev => {
      const updatedFilters = {
        ...prev.filters,
        ...newFilters,
        page: newFilters.page || 1 // Reset to first page unless explicitly set
      };

      // Validate date range
      if (updatedFilters.completedAfter && updatedFilters.completedBefore) {
        const startDate = new Date(updatedFilters.completedAfter);
        const endDate = new Date(updatedFilters.completedBefore);
        
        if (startDate > endDate) {
          toast.error('Start date cannot be after end date');
          return prev;
        }
      }

      // Validate session IDs format
      if (updatedFilters.sessionIds && updatedFilters.sessionIds.trim()) {
        const sessionIds = updatedFilters.sessionIds.split(',').map(id => id.trim());
        const invalidIds = sessionIds.filter(id => isNaN(Number(id)));
        
        if (invalidIds.length > 0) {
          toast.error('Invalid session IDs format. Use comma-separated numbers.');
          return prev;
        }
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, []);

  // Apply current filters
  const applyFilters = useCallback(() => {
    loadSessionResults(state.filters);
  }, [loadSessionResults, state.filters]);

  // Reset filters to default
  const resetFilters = useCallback(() => {
    const defaultFilters: AdvancedSessionFilters = {
      answerType: 'all',
      page: 1,
      limit: 20
    };
    
    setState(prev => ({
      ...prev,
      filters: defaultFilters
    }));
    
    loadSessionResults(defaultFilters);
  }, [loadSessionResults]);

  // Set date range filter
  const setDateRange = useCallback((startDate: string, endDate: string) => {
    updateFilters({
      completedAfter: startDate,
      completedBefore: endDate,
      page: 1
    });
  }, [updateFilters]);

  // Set session comparison filter
  const setSessionComparison = useCallback((sessionIds: number[]) => {
    if (sessionIds.length === 0) {
      updateFilters({ sessionIds: undefined });
    } else {
      updateFilters({ 
        sessionIds: sessionIds.join(','),
        page: 1
      });
    }
  }, [updateFilters]);

  // Set answer type filter
  const setAnswerType = useCallback((answerType: 'all' | 'correct' | 'incorrect') => {
    updateFilters({ answerType, page: 1 });
  }, [updateFilters]);

  // Set session type filter
  const setSessionType = useCallback((sessionType: 'PRACTICE' | 'EXAM' | undefined) => {
    updateFilters({ sessionType, page: 1 });
  }, [updateFilters]);

  // Load data on mount and when filters change
  useEffect(() => {
    loadSessionResults();
    loadAvailableSessions();
  }, []);

  // Auto-apply filters when they change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.filters !== initialFilters) {
        loadSessionResults();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.filters, loadSessionResults, initialFilters]);

  return {
    // Data
    results: state.results,
    availableSessions: state.availableSessions,
    filters: state.filters,
    
    // State
    loading: state.loading,
    error: state.error,
    
    // Actions
    updateFilters,
    applyFilters,
    resetFilters,
    refresh: () => loadSessionResults(),
    
    // Convenience methods
    setDateRange,
    setSessionComparison,
    setAnswerType,
    setSessionType,
    
    // Pagination
    nextPage: () => updateFilters({ page: (state.filters.page || 1) + 1 }),
    prevPage: () => updateFilters({ page: Math.max((state.filters.page || 1) - 1, 1) }),
    setPage: (page: number) => updateFilters({ page: Math.max(page, 1) })
  };
}

// Specialized hooks for common use cases
export function useDateRangeAnalytics(startDate: string, endDate: string) {
  return useAdvancedSessionFilters({
    completedAfter: startDate,
    completedBefore: endDate,
    answerType: 'all',
    limit: 100
  });
}

export function useExamAnalytics(filters: Partial<AdvancedSessionFilters> = {}) {
  return useAdvancedSessionFilters({
    ...filters,
    sessionType: 'EXAM',
    answerType: 'all'
  });
}

export function usePracticeAnalytics(filters: Partial<AdvancedSessionFilters> = {}) {
  return useAdvancedSessionFilters({
    ...filters,
    sessionType: 'PRACTICE',
    answerType: 'all'
  });
}

export function useIncorrectAnswersAnalysis(filters: Partial<AdvancedSessionFilters> = {}) {
  return useAdvancedSessionFilters({
    ...filters,
    answerType: 'incorrect',
    limit: 50
  });
}
