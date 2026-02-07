/**
 * Hook for managing practice sessions using the new API
 */

import React, { useState, useEffect, useCallback } from 'react';
import { NewApiService, PracticeSessionsResponse, ApiError } from '@/lib/api/new-api-services';
import { toast } from 'sonner';

export interface UsePracticeSessionsParams {
  sessionType: 'PRACTICE' | 'EXAM';
  moduleId?: number;
  uniteId?: number;
}

export interface UsePracticeSessionsResult {
  data: PracticeSessionsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePracticeSessions(params: UsePracticeSessionsParams): UsePracticeSessionsResult {
  const [data, setData] = useState<PracticeSessionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPracticeSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate mutually exclusive parameters
      if (params.moduleId && params.uniteId) {
        throw new ApiError('Cannot provide both uniteId and moduleId. Please select only one.');
      }

      if (!params.moduleId && !params.uniteId) {
        throw new ApiError('Either moduleId or uniteId must be provided');
      }

      const response = await NewApiService.getPracticeSessions({
        sessionType: params.sessionType,
        moduleId: params.moduleId,
        uniteId: params.uniteId
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new ApiError(response.error || 'Failed to fetch practice sessions');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to fetch practice sessions';

      if (err instanceof ApiError) {
        errorMessage = err.message;
        if (err.statusCode === 404) {
          errorMessage = 'No practice sessions found for the selected criteria.';
        } else if (err.statusCode === 403) {
          errorMessage = 'You do not have permission to access these practice sessions.';
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error('Practice sessions fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.sessionType, params.moduleId, params.uniteId]);

  useEffect(() => {
    if (params.moduleId || params.uniteId) {
      fetchPracticeSessions();
    }
  }, [fetchPracticeSessions]);

  return {
    data,
    loading,
    error,
    refetch: fetchPracticeSessions
  };
}

/**
 * Hook for managing student notes using the new API
 */
export interface UseStudentNotesParams {
  moduleId?: number;
  uniteId?: number;
}

export interface UseStudentNotesResult {
  data: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStudentNotes(params: UseStudentNotesParams): UseStudentNotesResult {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!params.moduleId && !params.uniteId) {
        setData(null);
        setLoading(false);
        return;
      }

      const response = await NewApiService.getStudentNotes({
        moduleId: params.moduleId,
        uniteId: params.uniteId
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch student notes');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch student notes';
      setError(errorMessage);
      console.error('Student notes fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.moduleId, params.uniteId]);

  useEffect(() => {
    fetchStudentNotes();
  }, [fetchStudentNotes]);

  return {
    data,
    loading,
    error,
    refetch: fetchStudentNotes
  };
}

/**
 * Hook for managing student labels using the new API
 */
export interface UseStudentLabelsParams {
  moduleId?: number;
  uniteId?: number;
}

export interface UseStudentLabelsResult {
  data: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStudentLabels(params: UseStudentLabelsParams): UseStudentLabelsResult {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!params.moduleId && !params.uniteId) {
        setData(null);
        setLoading(false);
        return;
      }

      const response = await NewApiService.getStudentLabels({
        moduleId: params.moduleId,
        uniteId: params.uniteId
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch student labels');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch student labels';
      setError(errorMessage);
      console.error('Student labels fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.moduleId, params.uniteId]);

  useEffect(() => {
    fetchStudentLabels();
  }, [fetchStudentLabels]);

  return {
    data,
    loading,
    error,
    refetch: fetchStudentLabels
  };
}

/**
 * Hook for managing student courses using the new API
 */
export interface UseStudentCoursesParams {
  moduleId?: number;
  uniteId?: number;
}

export interface UseStudentCoursesResult {
  data: any | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStudentCourses(params: UseStudentCoursesParams): UseStudentCoursesResult {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!params.moduleId && !params.uniteId) {
        setData(null);
        setLoading(false);
        return;
      }

      const response = await NewApiService.getStudentCourses({
        moduleId: params.moduleId,
        uniteId: params.uniteId
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch student courses');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch student courses';
      setError(errorMessage);
      console.error('Student courses fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [params.moduleId, params.uniteId]);

  useEffect(() => {
    fetchStudentCourses();
  }, [fetchStudentCourses]);

  return {
    data,
    loading,
    error,
    refetch: fetchStudentCourses
  };
}
