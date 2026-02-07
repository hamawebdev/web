// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudentService } from '@/lib/api-services';
import { PaginationParams } from '@/types/api';
import { useStudentAuth } from '@/hooks/use-auth';

export interface QuizHistoryFilters extends PaginationParams {
  type?: 'PRACTICE' | 'EXAM';
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'completedAt' | 'score' | 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface QuizHistoryState {
  sessions: any[] | null;
  pagination: any | null;
  loading: boolean;
  error: string | null;
  filters: QuizHistoryFilters;
  summary: {
    totalSessions: number;
    averageScore: number;
    completedSessions: number;
    inProgressSessions: number;
  } | null;
}

export function useQuizHistory(initialFilters: QuizHistoryFilters = {}) {
  const { isAuthenticated, loading: authLoading } = useStudentAuth();
  const [allSessions, setAllSessions] = useState<any[] | null>(null); // Store all data from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuizHistoryFilters>({
    page: 1,
    limit: 20,
    sortBy: 'completedAt',
    sortOrder: 'desc',
    ...initialFilters
  });

  // Fetch all data once without filters (except for initial type filter if provided)
  const fetchAllQuizHistory = useCallback(async () => {
    if (!isAuthenticated || authLoading) {
      console.log('❌ Cannot fetch quiz history: not authenticated or still loading auth', { isAuthenticated, authLoading });
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch data with reasonable pagination and collect all pages
      let allSessions: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const apiFilters: any = {
          limit: 50, // Use reasonable page size
          page: currentPage
        };

        // Only apply type filter to API if it was in initial filters (to avoid fetching unnecessary data)
        if (initialFilters.type) {
          apiFilters.type = initialFilters.type;
        }

        console.log(`🔍 Fetching quiz history page ${currentPage}:`, apiFilters);
        const response = await StudentService.getQuizHistory(apiFilters);
        console.log('📡 API Response:', response);

        if (response.success) {
          // Handle nested response structure: response.data.data.data.sessions
          console.log('🔍 Raw response structure:', {
            responseSuccess: response.success,
            dataLevel1: response.data,
            dataLevel2: response.data?.data,
            dataLevel3: response.data?.data?.data
          });

          // Try different levels of nesting to find sessions
          let sessionsArray = [];
          let paginationInfo = null;

          if (response.data?.data?.data?.sessions) {
            // Level 3: response.data.data.data.sessions
            sessionsArray = response.data.data.data.sessions;
            paginationInfo = response.data.data.data.pagination;
            console.log('✅ Found sessions at level 3 (data.data.data.sessions)');
          } else if (response.data?.data?.sessions) {
            // Level 2: response.data.data.sessions
            sessionsArray = response.data.data.sessions;
            paginationInfo = response.data.data.pagination;
            console.log('✅ Found sessions at level 2 (data.data.sessions)');
          } else if (response.data?.sessions) {
            // Level 1: response.data.sessions
            sessionsArray = response.data.sessions;
            paginationInfo = response.data.pagination;
            console.log('✅ Found sessions at level 1 (data.sessions)');
          } else {
            console.log('❌ No sessions found in response structure');
            sessionsArray = [];
          }

          // Add sessions from this page to our collection
          if (Array.isArray(sessionsArray)) {
            allSessions = [...allSessions, ...sessionsArray];
            console.log(`📊 Page ${currentPage} fetched: ${sessionsArray.length} sessions, total: ${allSessions.length}`);
          }

          // Check if there are more pages
          if (paginationInfo && paginationInfo.hasNextPage) {
            currentPage++;
          } else {
            hasMorePages = false;
          }
        } else {
          console.error('❌ API Error:', response.error);
          throw new Error(response.error || 'Failed to fetch quiz history');
        }
      }

      console.log('📊 All sessions fetched:', {
        totalSessions: allSessions.length,
        firstSession: allSessions[0]
      });

      setAllSessions(allSessions);
      setLoading(false);
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quiz history';
      console.error('💥 Quiz history fetch error:', error);
      setAllSessions(null);
      setLoading(false);
      setError(errorMessage);
    }
  }, [isAuthenticated, authLoading, initialFilters.type]);

  // Client-side filtering and sorting
  const { sessions, pagination, summary } = useMemo(() => {
    if (!allSessions) {
      return { sessions: null, pagination: null, summary: null };
    }

    let filteredSessions = [...allSessions];

    // Apply filters
    if (filters.type) {
      filteredSessions = filteredSessions.filter(session => session.type === filters.type);
    }



    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredSessions = filteredSessions.filter(session =>
        session.title?.toLowerCase().includes(searchTerm) ||
        session.type?.toLowerCase().includes(searchTerm) ||
        session.status?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredSessions = filteredSessions.filter(session => {
        const sessionDate = new Date(session.completedAt || session.createdAt);
        return sessionDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filteredSessions = filteredSessions.filter(session => {
        const sessionDate = new Date(session.completedAt || session.createdAt);
        return sessionDate <= toDate;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredSessions.sort((a, b) => {
        let aValue, bValue;

        switch (filters.sortBy) {
          case 'completedAt':
            aValue = new Date(a.completedAt || a.createdAt).getTime();
            bValue = new Date(b.completedAt || b.createdAt).getTime();
            break;
          case 'score':
            aValue = a.percentage || 0;
            bValue = b.percentage || 0;
            break;
          case 'title':
            aValue = a.title?.toLowerCase() || '';
            bValue = b.title?.toLowerCase() || '';
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            aValue = new Date(a.completedAt || a.createdAt).getTime();
            bValue = new Date(b.completedAt || b.createdAt).getTime();
        }

        if (filters.sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Calculate pagination
    const totalItems = filteredSessions.length;
    const totalPages = Math.ceil(totalItems / (filters.limit || 20));
    const currentPage = filters.page || 1;
    const startIndex = (currentPage - 1) * (filters.limit || 20);
    const endIndex = startIndex + (filters.limit || 20);
    const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

    const paginationData = {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: filters.limit || 20,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };

    // Calculate summary statistics
    const completedSessions = filteredSessions.filter(s => s.status === 'COMPLETED');
    const inProgressSessions = filteredSessions.filter(s => s.status === 'IN_PROGRESS');
    const averageScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.percentage || 0), 0) / completedSessions.length)
      : 0;

    const summaryData = {
      totalSessions: filteredSessions.length,
      averageScore,
      completedSessions: completedSessions.length,
      inProgressSessions: inProgressSessions.length
    };

    return {
      sessions: paginatedSessions,
      pagination: paginationData,
      summary: summaryData
    };
  }, [allSessions, filters]);

  // Update filters without triggering API calls
  const updateFilters = useCallback((newFilters: Partial<QuizHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const refresh = useCallback(() => {
    fetchAllQuizHistory();
  }, [fetchAllQuizHistory]);

  // Initial load - only when authenticated and not loading auth
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('🚀 Initial load of quiz history (authenticated)');
      fetchAllQuizHistory();
    } else if (!authLoading && !isAuthenticated) {
      console.log('⏳ Authentication complete but user not authenticated');
      setLoading(false); // Stop loading if not authenticated
    } else {
      console.log('⏳ Waiting for authentication to complete', { isAuthenticated, authLoading });
    }
  }, [isAuthenticated, authLoading, fetchAllQuizHistory]);

  return {
    sessions,
    pagination,
    loading,
    error,
    summary,
    filters,
    updateFilters,
    refresh
  };
}

// Specialized hooks for common use cases
export function useRecentQuizHistory(limit: number = 10) {
  return useQuizHistory({
    limit,
    sortBy: 'completedAt',
    sortOrder: 'desc',
    status: 'COMPLETED'
  });
}

export function usePracticeHistory(filters: Omit<QuizHistoryFilters, 'type'> = {}) {
  return useQuizHistory({ ...filters, type: 'PRACTICE' });
}

export function useExamHistory(filters: Omit<QuizHistoryFilters, 'type'> = {}) {
  return useQuizHistory({ ...filters, type: 'EXAM' });
}
