// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { StudentDashboardPerformance } from '@/types/api';

// Interface for dashboard state (refactored to only rely on performance endpoint)
interface DashboardState {
  performance: StudentDashboardPerformance | null;
  loading: boolean;
  error: string | null;
}

// Hook for managing student dashboard data
export function useStudentDashboard() {
  const [state, setState] = useState<DashboardState>({
    performance: null,
    loading: true,
    error: null,
  });

  // Fetch dashboard performance data
  const fetchPerformance = useCallback(async () => {
    try {
      const response = await StudentService.getDashboardPerformance();

      if (response.success) {
        // Expected shape: { success, data: { success, data: { ...performance } }, meta? }
        const performanceData = response.data?.data?.data ?? response.data?.data ?? response.data ?? null;

        setState(prev => ({
          ...prev,
          performance: performanceData,
          error: null,
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch performance data');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch performance data';
      setState(prev => ({
        ...prev,
        performance: null,
        error: errorMessage,
      }));
      console.error('Dashboard performance fetch error:', error);

    }
  }, []);

  // Fetch all dashboard data (only performance in this refactor)
  const fetchDashboardData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await fetchPerformance();
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [fetchPerformance]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchDashboardData();
  }, [fetchDashboardData]);

  // Initialize data on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    ...state,
    clearError,
    refresh,
  };
}

// Hook for quiz history with pagination
export function useQuizHistory(params: {
  type?: 'PRACTICE' | 'EXAM';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
} = {}) {
  const [state, setState] = useState<{
    data: any[] | null;
    pagination: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchQuizHistory = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await StudentService.getQuizHistory(params);

      if (response.success) {
        setState({
          data: response.data.data,
          pagination: response.data.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch quiz history');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quiz history';
      setState({
        data: null,
        pagination: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Quiz history fetch error:', error);
    }
  }, [params.page, params.limit, params.search, params.subjectId, params.sessionType, params.startDate, params.endDate, params.sortBy, params.sortOrder]);

  useEffect(() => {
    fetchQuizHistory();
  }, [fetchQuizHistory]);

  return {
    ...state,
    refresh: fetchQuizHistory,
  };
}

// Hook for session results with filtering
export function useSessionResults(filters: {
  answerType?: 'correct' | 'incorrect' | 'all';
  sessionType?: 'PRACTICE' | 'EXAM' | 'REVIEW';
  dateFrom?: string;
  dateTo?: string;
  sessionId?: number;
  page?: number;
  limit?: number;
} = {}) {
  const [state, setState] = useState<{
    data: any[] | null;
    pagination: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchSessionResults = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await StudentService.getSessionResults(filters);

      if (response.success) {
        setState({
          data: response.data.data,
          pagination: response.data.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch session results');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch session results';
      setState({
        data: null,
        pagination: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Session results fetch error:', error);
    }
  }, [filters.page, filters.limit, filters.search, filters.subjectId, filters.sessionType, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchSessionResults();
  }, [fetchSessionResults]);

  return {
    ...state,
    refresh: fetchSessionResults,
  };
}
