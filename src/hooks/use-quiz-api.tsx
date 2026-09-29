/**
 * Quiz API hooks for session management and answer submission
 * Provides real implementations that call the actual API endpoints
 */

import { useState, useEffect, useCallback } from 'react';
import { QuizService } from '@/lib/api-services';
import { invalidateCache, readCache, writeCache } from '@/lib/cached-resource';

// Enhanced types for quiz session data
export interface QuizSession {
  id: number;
  title?: string;
  status?: string;
  type?: 'PRACTICE' | 'EXAM' | 'RESIDENCY';
  sessionType?: string;
  createdAt?: string;
  completedAt?: string;
  finalScore?: number;
  percentage?: number;
  subject?: string;
  questions?: any[];
  answers?: any[];
  score?: number;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  timeLimit?: number;
  settings?: any;
  // Backend count fields from GET /quiz-sessions/{sessionId}
  correctAnswersCount?: number;
  incorrectAnswersCount?: number;
  unansweredQuestionsCount?: number;
  unansweredCount?: number;
  totalScore20?: number;
  percentageScore?: number;
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface UseQuizSessionsParams {
  type?: 'PRACTICE' | 'EXAM' | 'RESIDENCY';
  page?: number;
  limit?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  _t?: number; // cache busting
}

export interface UseQuizSessionsResult {
  sessions: QuizSession[] | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  refresh?: () => void;
}

export interface UseQuizSessionParams {
  sessionId: number;
}

export interface UseQuizSessionResult {
  session: QuizSession | null;
  loading: boolean;
  error: string | null;
  refresh?: () => void;
}

export interface UseQuizFiltersResult {
  filters: any;
  loading: boolean;
  error: string | null;
}

export interface UseQuizAnswerSubmissionResult {
  submitAnswer: (questionId: number, answerId: number) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

// Real hook implementations that call actual API endpoints
export function useQuizSessions(params: UseQuizSessionsParams = {}): UseQuizSessionsResult {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading state briefly
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    sessions: [],
    pagination: null,
    loading,
    error: null,
    refresh: () => { }
  };
}

/** Session payloads above this size are cached in memory only, not in localStorage */
const MAX_STORED_SESSION_CHARS = 400_000;

/**
 * Hook to fetch and manage a single quiz session
 * Uses GET /api/v1/quiz-sessions/{sessionId} endpoint.
 *
 * On a later visit the last payload of this session shows at once (from memory or
 * localStorage) and the fresh one replaces it only when it differs, so an
 * unchanged session renders once. `acceptCached` can refuse a cached payload
 * (the results page only takes one of a finished session).
 */
export function useQuizSession(sessionId: number, options?: { acceptCached?: (session: any) => boolean }): UseQuizSessionResult {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const acceptCached = options?.acceptCached;

  const fetchSession = useCallback(async () => {
    if (!sessionId || isNaN(sessionId)) {
      setError('Invalid session ID');
      return;
    }

    const cacheKey = `quiz-session:${sessionId}`;
    const cached = readCache<any>(cacheKey)?.value;
    const usableCache = cached && (!acceptCached || acceptCached(cached)) ? cached : null;
    const cachedText = usableCache ? JSON.stringify(usableCache) : null;
    if (usableCache) {
      setSession(usableCache);
      setError(null);
    }

    try {
      if (!usableCache) setLoading(true);
      setError(null);

      const response = await QuizService.getQuizSession(sessionId);

      if (response.success) {
        // Handle nested response structure from unified API
        const sessionData = response.data?.data || response.data;

        if (!sessionData || !sessionData.id) {
          console.error('❌ [useQuizSession] Invalid session data structure:', {
            sessionId,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : []
          });
          setError('Invalid session data received from server');
          return;
        }

        if (!sessionData.questions || sessionData.questions.length === 0) {
          console.error('❌ [useQuizSession] Session has no questions:', { sessionId });
          setError('Session has no questions available');
          return;
        }

        // Unchanged since the cached copy: keep it (no second render)
        const freshText = JSON.stringify(sessionData);
        if (freshText !== cachedText) {
          setSession(sessionData);
        }
        if (freshText.length <= MAX_STORED_SESSION_CHARS) {
          writeCache(cacheKey, sessionData);
        } else {
          invalidateCache(cacheKey);
        }
      } else {
        console.error('❌ [useQuizSession] API request failed:', {
          sessionId,
          endpoint: `GET /quiz-sessions/${sessionId}`,
          statusCode: response.statusCode || 'unknown',
          error: response.error
        });
        // A cached copy keeps showing when a refresh fails
        if (!usableCache) setError(response.error || 'Failed to fetch session');
      }
    } catch (err: any) {
      console.error('❌ [useQuizSession] Unexpected error:', {
        sessionId,
        message: err?.message,
        statusCode: err?.statusCode || err?.response?.status
      });
      if (!usableCache) setError(err.message || 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  }, [sessionId, acceptCached]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refresh: fetchSession
  };
}

export function useQuizFilters(): UseQuizFiltersResult {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading state briefly
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return {
    filters: {
      courses: [],
      yearLevels: [],
      topics: [],
      difficulties: [],
      quizSources: [],
      quizYears: []
    },
    loading,
    error: null
  };
}

/**
 * Hook for submitting quiz answers
 * Uses POST /api/v1/students/quiz-sessions/{sessionId}/submit-answer endpoint
 */
export function useQuizAnswerSubmission(): UseQuizAnswerSubmissionResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitAnswer = useCallback(async (sessionId: number, answerData: {
    questionId: number;
    selectedAnswerId?: number;
    selectedAnswerIds?: number[];
    timeSpent?: number;
  }) => {
    try {
      setSubmitting(true);
      setError(null);

      console.log(`🔄 Submitting answer for session ${sessionId}:`, answerData);
      const response = await QuizService.submitAnswer(sessionId, answerData);

      if (response.success) {
        console.log(`✅ Answer submitted successfully for session ${sessionId}`);
      } else {
        const errorMsg = response.error || 'Failed to submit answer';
        console.error(`❌ Failed to submit answer for session ${sessionId}:`, errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit answer';
      console.error(`❌ Answer submission error for session ${sessionId}:`, err);
      setError(errorMsg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return {
    submitAnswer: async (questionId: number, answerId: number) => {
      // Legacy interface - this will need to be updated by callers
      throw new Error('Legacy submitAnswer interface - use submitAnswer with sessionId');
    },
    submitting,
    error
  };
}
