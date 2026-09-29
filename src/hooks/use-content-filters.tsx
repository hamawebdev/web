/**
 * Hook for managing content filters using the new API
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCachedResource } from '@/lib/cached-resource';
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
  /** false: load nothing yet (for example while the student's year is not known) */
  enabled?: boolean;
}

/** GET /students/content/filters[?yearLevel=], unwrapped (throws on failure) */
async function fetchContentFilters(yearLevel?: string): Promise<ContentFilters> {
  const response = await NewApiService.getContentFilters(yearLevel);
  if (!response.success || !response.data) {
    throw new ApiError(response.error || 'Failed to fetch content filters');
  }
  return response.data;
}

/**
 * Content tree (unites, modules, courses) the student can pick from, per year
 * level. The last tree shows at once on later visits and is refreshed in the
 * background.
 */
export function useContentFilters(options?: UseContentFiltersOptions): UseContentFiltersResult {
  const yearLevel = options?.yearLevel;
  const enabled = options?.enabled !== false;
  const { data: filters, loading, error, refresh } = useCachedResource<ContentFilters>(
    enabled ? `content-filters:${yearLevel || 'all'}` : null,
    () => fetchContentFilters(yearLevel)
  );

  // Errors are shown once per failed load
  useEffect(() => {
    if (!error) return;
    let message = error;
    if (/401/.test(error)) message = 'Authentication required. Please log in again.';
    else if (/403/.test(error)) message = 'You do not have permission to access content filters.';
    toast.error(message);
  }, [error]);

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
    filters: filters ?? null,
    navigationItems,
    loading: enabled ? loading : true,
    error,
    refetch: refresh
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

/** GET /quizzes/session-filters[?uniteId=&moduleId=], unwrapped (throws on failure) */
async function fetchQuizSessionFilters(uniteId?: number, moduleId?: number): Promise<any> {
  const response = await NewApiService.getQuizSessionFilters({ uniteId, moduleId });
  if (!response.success || !response.data) {
    throw new ApiError(response.error || 'Failed to fetch quiz session filters');
  }
  return response.data;
}

/**
 * Sources, exam years and counts for session setup (optionally within one unite or
 * module). The last answer shows at once on later visits and is refreshed in the
 * background. `enabled: false` loads nothing.
 */
export function useQuizSessionFilters(options?: UseQuizSessionFiltersOptions & { enabled?: boolean }): UseQuizSessionFiltersResult {
  const uniteId = options?.uniteId;
  const moduleId = options?.moduleId;
  const enabled = options?.enabled !== false;
  const { data, loading, error, refresh } = useCachedResource<any>(
    enabled ? `session-filters:${uniteId || ''}:${moduleId || ''}` : null,
    () => fetchQuizSessionFilters(uniteId, moduleId)
  );
  return {
    filters: data ?? null,
    loading,
    error,
    refetch: refresh
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
    repetitionCountMin?: number;
  }) => {
    return JSON.stringify({
      courseIds: filters.courseIds?.slice().sort(),
      questionTypes: filters.questionTypes?.slice().sort(),
      years: filters.years?.slice().sort(),
      rotations: filters.rotations?.slice().sort(),
      universityIds: filters.universityIds?.slice().sort(),
      questionSourceIds: filters.questionSourceIds?.slice().sort(),
      repetitionCountMin: filters.repetitionCountMin,
    });
  }, []);

  const fetchQuestionCount = useCallback(async (filters: {
    courseIds: number[];
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
    years?: number[];
    rotations?: Array<'R1' | 'R2' | 'R3' | 'R4'>;
    universityIds?: number[];
    questionSourceIds?: number[];
    repetitionCountMin?: number;
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
