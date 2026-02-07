// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ExamService } from '@/lib/api-services';
import { Exam, ExamInfo, ExamSession, ExamResult, ExamFilters } from '@/types/api';
import { toast } from 'sonner';

// Interface for exams list state
interface ExamsState {
  exams: ExamInfo[] | null;
  loading: boolean;
  error: string | null;
}

// Interface for exam details state
interface ExamDetailsState {
  exam: Exam | null;
  loading: boolean;
  error: string | null;
}

// Interface for exam session state
interface ExamSessionState {
  session: ExamSession | null;
  loading: boolean;
  error: string | null;
  creating: boolean;
}

// Interface for exam results state
interface ExamResultsState {
  results: ExamResult | null;
  loading: boolean;
  error: string | null;
}

// Hook for managing available exams
export function useExams(filters: ExamFilters = {}) {
  const [state, setState] = useState<ExamsState>({
    exams: null,
    loading: true,
    error: null,
  });

  const fetchExams = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Clean filters to remove "all" values and empty strings
      const cleanedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== 'all' && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as ExamFilters);

      const response = await ExamService.getAvailableExams(cleanedFilters);

      if (response.success) {
        // Handle nested response structure
        const examsData = response.data?.data || response.data;

        // Support both shapes:
        // 1) { exams: [...] }
        // 2) { examsByYear: [{ year, exams: [...] }] }
        let examsList: any[] = [];
        if (Array.isArray(examsData?.exams)) {
          examsList = examsData.exams;
        } else if (Array.isArray(examsData?.examsByYear)) {
          const flattened: any[] = [];
          examsData.examsByYear.forEach((yg: any) => {
            if (Array.isArray(yg.exams)) flattened.push(...yg.exams);
          });
          examsList = flattened;
        }

        setState({
          exams: examsList,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch exams');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exams';
      setState({
        exams: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Exams fetch error:', error);
    }
  }, [filters.universityId, filters.yearLevel, filters.examYear, filters.isActive, filters.startDate, filters.endDate, filters.search]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return {
    ...state,
    refresh: fetchExams,
  };
}

// Hook for managing exam details
export function useExamDetails(examId: number | null) {
  const [state, setState] = useState<ExamDetailsState>({
    exam: null,
    loading: false,
    error: null,
  });

  const fetchExamDetails = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await ExamService.getExamDetails(id);
      
      if (response.success) {
        // Handle nested response structure
        const responseData = response.data.data || response.data;

        // Extract exam object and merge with additional properties
        const examData = responseData.exam ? {
          ...responseData.exam,
          questionsCount: responseData.questionsCount,
          canAccess: responseData.canAccess,
          totalQuestions: responseData.questionsCount, // Alias for consistency
        } : responseData;

        setState({
          exam: examData,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch exam details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exam details';
      setState({
        exam: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Exam details fetch error:', error);
    }
  }, []);

  useEffect(() => {
    if (examId) {
      fetchExamDetails(examId);
    }
  }, [examId, fetchExamDetails]);

  return {
    ...state,
    refresh: examId ? () => fetchExamDetails(examId) : undefined,
  };
}

// Hook for managing exam sessions
export function useExamSession(sessionId: number | null = null) {
  const [state, setState] = useState<ExamSessionState>({
    session: null,
    loading: false,
    error: null,
    creating: false,
  });

  const fetchExamSession = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use unified session endpoint - exam sessions are retrieved via /quiz-sessions
      const response = await ExamService.getExamSession(id);

      if (response.success) {
        // Handle nested response structure from unified API
        const sessionData = response.data.data?.data || response.data.data || response.data;

        // Ensure session has exam type identifier
        const examSession = {
          ...sessionData,
          type: sessionData.type || 'EXAM', // Ensure type is set for exam sessions
        };

        setState(prev => ({
          ...prev,
          session: examSession,
          loading: false,
          error: null,
        }));

        console.log(`📖 Loaded exam session ${id} via unified endpoint`);
      } else {
        throw new Error(response.error || 'Failed to fetch exam session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exam session';
      setState(prev => ({
        ...prev,
        session: null,
        loading: false,
        error: errorMessage,
      }));
      console.error('Exam session fetch error:', error);
    }
  }, []);

  const createExamSession = useCallback(async (examId: number) => {
    setState(prev => ({ ...prev, creating: true, error: null }));

    try {
      const response = await ExamService.createExamSession(examId);
      
      if (response.success) {
        // Handle nested response structure
        const sessionData = response.data.data || response.data;
        setState(prev => ({
          ...prev,
          session: sessionData,
          creating: false,
          error: null,
        }));
        toast.success('Exam session created successfully');
        return sessionData;
      } else {
        throw new Error(response.error || 'Failed to create exam session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create exam session';
      setState(prev => ({
        ...prev,
        creating: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      console.error('Exam session creation error:', error);
      throw error;
    }
  }, []);

  const submitAnswer = useCallback(async (sessionId: number, answer: {
    questionId: number;
    selectedAnswerId?: number;
    selectedAnswerIds?: number[];
    textAnswer?: string;
    timeSpent: number;
    flagged?: boolean;
  }) => {
    try {
      const response = await ExamService.submitExamAnswer(sessionId, answer);
      
      if (response.success) {
        // Update local session state if needed
        setState(prev => {
          if (prev.session && prev.session.id === sessionId) {
            const updatedAnswers = [...prev.session.answers];
            const existingIndex = updatedAnswers.findIndex(a => a.questionId === answer.questionId);
            
            const newAnswer = {
              questionId: answer.questionId,
              selectedAnswerId: answer.selectedAnswerId,
              selectedAnswerIds: answer.selectedAnswerIds,
              textAnswer: answer.textAnswer,
              timeSpent: answer.timeSpent,
              flagged: answer.flagged || false,
              submittedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
              updatedAnswers[existingIndex] = newAnswer;
            } else {
              updatedAnswers.push(newAnswer);
            }

            return {
              ...prev,
              session: {
                ...prev.session,
                answers: updatedAnswers,
              },
            };
          }
          return prev;
        });

        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit answer');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit answer';
      console.error('Answer submission error:', error);
      throw new Error(errorMessage);
    }
  }, []);

  const completeExam = useCallback(async (sessionId: number) => {
    try {
      // Exam completion uses unified session management
      // Exams auto-complete when answers are submitted, so this just retrieves final state
      const response = await ExamService.completeExamSession(sessionId);

      if (response.success) {
        const examResult = response.data.data || response.data;

        setState(prev => ({
          ...prev,
          session: prev.session ? {
            ...prev.session,
            status: 'COMPLETED',
            endTime: new Date().toISOString(),
            score: examResult.score,
            percentage: examResult.percentage,
          } : null,
        }));

        toast.success('Exam completed successfully');
        console.log(`✅ Exam session ${sessionId} completed via unified management`);
        return examResult;
      } else {
        throw new Error(response.error || 'Failed to complete exam');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete exam';
      toast.error(errorMessage);
      console.error('Exam completion error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchExamSession(sessionId);
    }
  }, [sessionId, fetchExamSession]);

  return {
    ...state,
    createExamSession,
    submitAnswer,
    completeExam,
    refresh: sessionId ? () => fetchExamSession(sessionId) : undefined,
  };
}

// Hook for managing exam results (uses unified session data)
export function useExamResults(sessionId: number | null) {
  const [state, setState] = useState<ExamResultsState>({
    results: null,
    loading: false,
    error: null,
  });

  const fetchExamResults = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use unified session endpoint - results are embedded in session data
      const response = await ExamService.getExamResults(id);

      if (response.success) {
        // Results come from unified session data structure
        const sessionData = response.data.data?.data || response.data.data || response.data;

        // Transform session data to exam results format
        const examResults = {
          sessionId: sessionData.sessionId || sessionData.id,
          examId: sessionData.examId,
          score: sessionData.score || 0,
          percentage: sessionData.percentage || 0,
          status: sessionData.status,
          completedAt: sessionData.updatedAt || sessionData.completedAt,
          questions: sessionData.questions || [],
          userAnswers: sessionData.userAnswers || {},
          totalQuestions: sessionData.questions?.length || 0,
          correctAnswers: sessionData.questions?.filter((q: any) => {
            const userAnswer = sessionData.userAnswers?.[q.id];
            return userAnswer?.isCorrect;
          }).length || 0,
        };

        setState({
          results: examResults,
          loading: false,
          error: null,
        });

        console.log(`📊 Loaded exam results for session ${id} from unified session data`);
      } else {
        throw new Error(response.error || 'Failed to fetch exam results');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exam results';
      setState({
        results: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Exam results fetch error:', error);
    }
  }, []);

  useEffect(() => {
    if (sessionId) {
      fetchExamResults(sessionId);
    }
  }, [sessionId, fetchExamResults]);

  return {
    ...state,
    refresh: sessionId ? () => fetchExamResults(sessionId) : undefined,
  };
}
