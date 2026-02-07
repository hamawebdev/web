/**
 * Hook for managing content filters using the new API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NewApiService, ContentFilters, ApiError } from '@/lib/api/new-api-services';
import { toast } from 'sonner';

export interface ContentFilterItem {
  id: number;
  name: string;
  type: 'unite' | 'module';
  uniteId?: number;
  uniteName?: string;
  description?: string;
}

export interface UseContentFiltersResult {
  filters: ContentFilters | null;
  navigationItems: ContentFilterItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseContentFiltersOptions {
  yearLevel?: string;
}

export function useContentFilters(options?: UseContentFiltersOptions): UseContentFiltersResult {
  const [filters, setFilters] = useState<ContentFilters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const yearLevel = options?.yearLevel;

  const fetchContentFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🌐 [useContentFilters] Fetching content filters...', {
        yearLevel: yearLevel || 'none'
      });

      let response;
      try {
        // Use the content filters endpoint with optional yearLevel
        response = await NewApiService.getContentFilters(yearLevel);
        console.log('🌐 [useContentFilters] Content filters endpoint success');
      } catch (primaryError) {
        console.error('🌐 [useContentFilters] Content filters endpoint failed:', primaryError);
        throw primaryError;
      }

      if (response.success && response.data) {
        console.log('🌐 [useContentFilters] Content filters loaded successfully:', {
          unites: response.data.unites?.length || 0,
          independentModules: response.data.independentModules?.length || 0,
          yearLevelApplied: yearLevel || 'none'
        });
        setFilters(response.data);
      } else {
        console.error('🌐 [useContentFilters] API Error:', response.error);
        throw new ApiError(response.error || 'Failed to fetch content filters');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to fetch content filters';

      if (err instanceof ApiError) {
        errorMessage = err.message;
        if (err.statusCode === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.statusCode === 403) {
          errorMessage = 'You do not have permission to access content filters.';
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Content filters fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearLevel]); // Re-fetch when yearLevel changes

  // Convert the new API structure to navigation items for compatibility
  const navigationItems: ContentFilterItem[] = React.useMemo(() => {
    if (!filters) return [];

    const items: ContentFilterItem[] = [];

    // Add unites (with null check)
    (filters.unites || []).forEach(unite => {
      items.push({
        id: unite.id,
        name: unite.name,
        type: 'unite'
      });

      // Add modules within unites (with null check)
      (unite.modules || []).forEach(module => {
        items.push({
          id: module.id,
          name: module.name,
          type: 'module',
          uniteId: unite.id,
          uniteName: unite.name,
          description: module.description
        });
      });
    });

    // Add independent modules (with null check)
    (filters.independentModules || []).forEach(module => {
      items.push({
        id: module.id,
        name: module.name,
        type: 'module',
        description: module.description
      });
    });

    return items;
  }, [filters]);

  return {
    filters,
    navigationItems,
    loading,
    error,
    refetch: fetchContentFilters
  };
}

/**
 * Hook for managing session filters using the new API
 */
export interface UseSessionFiltersResult {
  practiceFilters: any | null;
  examFilters: any | null;
  loading: boolean;
  error: string | null;
  refetchPractice: () => Promise<void>;
  refetchExam: () => Promise<void>;
}

/**
 * Hook for managing quiz session filters using the /students/content/filters endpoint
 * @deprecated Consider using useContentFilters directly for hierarchical content data
 */
export interface UseQuizSessionFiltersResult {
  filters: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseQuizSessionFiltersOptions {
  uniteId?: number;
  moduleId?: number;
}

export function useQuizSessionFilters(options?: UseQuizSessionFiltersOptions): UseQuizSessionFiltersResult {
  const [filters, setFilters] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🌐 [useQuizSessionFilters] Fetching quiz session filters...', {
        uniteId: options?.uniteId,
        moduleId: options?.moduleId
      });

      const response = await NewApiService.getQuizSessionFilters({
        uniteId: options?.uniteId,
        moduleId: options?.moduleId
      });

      if (response.success && response.data) {
        console.log('🌐 [useQuizSessionFilters] Session filters loaded successfully:', {
          universities: response.data.universities?.length || 0,
          questionSources: response.data.questionSources?.length || 0,
          rotations: response.data.rotations?.length || 0,
          examYears: response.data.examYears?.length || 0
        });
        setFilters(response.data);
      } else {
        console.error('🌐 [useQuizSessionFilters] API Error:', response.error);
        throw new ApiError(response.error || 'Failed to fetch quiz session filters');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch quiz session filters';
      setError(errorMessage);
      console.error('Quiz session filters fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [options?.uniteId, options?.moduleId]);

  // Re-fetch when filter options change
  useEffect(() => {
    fetchSessionFilters();
  }, [fetchSessionFilters]);

  return {
    filters,
    loading,
    error,
    refetch: fetchSessionFilters
  };
}

/**
 * Hook for getting question count using the new /quizzes/question-count endpoint
 */
export interface UseQuestionCountResult {
  questionCount: number;
  totalQuestionCount: number;
  loading: boolean;
  error: string | null;
  refetch: (filters: any) => Promise<void>;
}

export function useQuestionCount(): UseQuestionCountResult {
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [totalQuestionCount, setTotalQuestionCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache for storing results to avoid duplicate requests
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  // Track ongoing requests to prevent duplicates
  const ongoingRequestsRef = useRef<Map<string, Promise<any>>>(new Map());
  // AbortController to cancel in-flight requests when filters change rapidly
  const abortRef = useRef<AbortController | null>(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  // Generate cache key from filters
  const generateCacheKey = useCallback((filters: {
    courseIds: number[];
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
    years?: number[];
    rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
    universityIds?: number[];
    questionSourceIds?: number[];
  }) => {
    return JSON.stringify({
      courseIds: filters.courseIds?.slice().sort(),
      questionTypes: filters.questionTypes?.slice().sort(),
      years: filters.years?.slice().sort(),
      rotations: filters.rotations?.slice().sort(),
      universityIds: filters.universityIds?.slice().sort(),
      questionSourceIds: filters.questionSourceIds?.slice().sort(),
    });
  }, []);

  const fetchQuestionCount = useCallback(async (filters: {
    courseIds: number[];
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
    years?: number[];
    rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
    universityIds?: number[];
    questionSourceIds?: number[];
  }) => {
    const cacheKey = generateCacheKey(filters);

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🌐 [useQuestionCount] Using cached result for filters:', filters);

      // Validate cached data has accessibleQuestionCount
      if (cached.data.accessibleQuestionCount === undefined || cached.data.accessibleQuestionCount === null) {
        console.warn('🌐 [useQuestionCount] Cached data missing accessibleQuestionCount, refetching');
        // Remove invalid cache entry and continue to fetch
        cacheRef.current.delete(cacheKey);
      } else {
        setQuestionCount(cached.data.accessibleQuestionCount || 0);
        setError(null);
        return;
      }
    }

    // Check if request is already ongoing
    const ongoingRequest = ongoingRequestsRef.current.get(cacheKey);
    if (ongoingRequest) {
      console.log('🌐 [useQuestionCount] Request already in progress, waiting for result:', filters);
      try {
        const result = await ongoingRequest;

        // Validate result has accessibleQuestionCount
        if (result.accessibleQuestionCount === undefined || result.accessibleQuestionCount === null) {
          throw new ApiError('Question count unavailable. Please try again.');
        }

        setQuestionCount(result.accessibleQuestionCount || 0);
        setTotalQuestionCount(result.totalQuestionCount || 0);
        setError(null);
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to fetch question count';
        setError(errorMessage);
        console.error('Question count fetch error (from ongoing request):', err);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🌐 [useQuestionCount] Fetching question count with filters:', filters);

      // Cancel any previous in-flight request
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch { }
      }
      const controller = new AbortController();
      abortRef.current = controller;

      // Create and store the request promise with abort support
      const requestPromise = NewApiService.getQuestionCount(filters, { signal: controller.signal });
      ongoingRequestsRef.current.set(cacheKey, requestPromise.then(response => response.data));

      const response = await requestPromise;

      if (response.success && response.data) {
        console.log('🌐 [useQuestionCount] Question count loaded successfully:', {
          totalQuestionCount: response.data.totalQuestionCount,
          accessibleQuestionCount: response.data.accessibleQuestionCount
        });

        // Check if accessibleQuestionCount is missing from the response
        if (response.data.accessibleQuestionCount === undefined || response.data.accessibleQuestionCount === null) {
          console.warn('🌐 [useQuestionCount] accessibleQuestionCount is missing from API response');
          throw new ApiError('Question count unavailable. Please try again.');
        }

        // Cache the result
        cacheRef.current.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });

        setQuestionCount(response.data.accessibleQuestionCount || 0);
        setTotalQuestionCount(response.data.totalQuestionCount || 0);
      } else {
        console.error('🌐 [useQuestionCount] API Error:', response.error);
        throw new ApiError(response.error || 'Failed to fetch question count');
      }
    } catch (err: any) {
      // If the request was canceled, silently ignore
      if (abortRef.current?.signal.aborted) {
        console.log('\u23f8\ufe0f [useQuestionCount] Request was canceled due to new filters');
        return;
      }
      const errorMessage = err?.message || 'Failed to fetch question count';
      setError(errorMessage);
      console.error('Question count fetch error:', err);
    } finally {
      setLoading(false);
      // Clean up ongoing request
      ongoingRequestsRef.current.delete(cacheKey);
      if (abortRef.current?.signal.aborted) {
        abortRef.current = null;
      }
    }
  }, [generateCacheKey]);

  return {
    questionCount,
    totalQuestionCount,
    loading,
    error,
    refetch: fetchQuestionCount
  };
}

export function useSessionFilters(): UseSessionFiltersResult {
  const [practiceFilters, setPracticeFilters] = useState<any | null>(null);
  const [examFilters, setExamFilters] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPracticeFilters = async () => {
    try {
      const response = await NewApiService.getSessionFilters('PRACTICE');
      if (response.success && response.data) {
        setPracticeFilters(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch practice session filters');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch practice session filters';
      setError(errorMessage);
      console.error('Practice session filters fetch error:', err);
    }
  };

  const fetchExamFilters = async () => {
    try {
      const response = await NewApiService.getSessionFilters('EXAM');
      if (response.success && response.data) {
        setExamFilters(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch exam session filters');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch exam session filters';
      setError(errorMessage);
      console.error('Exam session filters fetch error:', err);
    }
  };

  const fetchAllFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchPracticeFilters(),
        fetchExamFilters()
      ]);
    } catch (err: any) {
      // Error handling is done in individual fetch functions
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFilters();
  }, []);

  return {
    practiceFilters,
    examFilters,
    loading,
    error,
    refetchPractice: fetchPracticeFilters,
    refetchExam: fetchExamFilters
  };
}

/**
 * Hook for managing exam session creation filters
 * DEPRECATED: Use useQuizSessionFilters() instead
 */
export interface UseExamSessionFiltersResult {
  filters: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useExamSessionFilters(): UseExamSessionFiltersResult {
  console.warn('[DEPRECATED] useExamSessionFilters() is deprecated. Use useQuizSessionFilters() instead.');
  return useQuizSessionFilters();
}
