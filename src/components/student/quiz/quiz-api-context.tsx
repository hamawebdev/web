// @ts-nocheck
'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState, useMemo } from 'react';
import { useQuizAnswerSubmission } from '@/hooks/use-quiz-api';
import { QuizService } from '@/lib/api-services';
import { quizStorage, QuizSessionState, QuizAnswer } from '@/lib/quiz-storage';
import { sessionProgressManager, SessionProgressData } from '@/lib/session-progress-manager';
import { SessionStatusManager } from '@/lib/session-status-manager';
import { toast } from 'sonner';
import { debounce } from 'lodash';
import { useSoundManager } from '@/hooks/use-sound-manager';

// Re-export types from the original context for compatibility
export type {
  QuizQuestion,
  UserAnswer,
  QuizSession,
  QuizTimer,
} from './quiz-context';

// Enhanced quiz state with API integration and client-side storage
interface ApiQuizState {
  session: any; // QuizSession from original context
  timer: any; // QuizTimer from original context
  currentQuestion: any | null; // QuizQuestion from original context, can be null
  isAnswerRevealed: boolean;
  showExplanation: boolean;
  sidebarOpen: boolean;
  // API-specific state
  apiSessionId?: number;
  submittingAnswer: boolean;
  lastSubmissionError: string | null;
  autoSave: boolean;
  // Client-side storage state
  clientStorageEnabled: boolean;
  pendingSubmission: boolean;
  localAnswers: Record<number, QuizAnswer>;
  // UI hint to trigger edit mode in review
  editTriggerAt: number | null;
}

// Enhanced quiz actions with API integration
type ApiQuizAction =
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'GO_TO_QUESTION'; questionIndex: number }
  | { type: 'SUBMIT_ANSWER'; answer: any; submitToApi?: boolean }
  | { type: 'ANSWER_SUBMITTED'; success: boolean; error?: string }
  | { type: 'CLEAR_ANSWER'; questionId: string | number }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'TOGGLE_EXPLANATION' }
  | { type: 'PAUSE_QUIZ' }
  | { type: 'RESUME_QUIZ' }
  | { type: 'UPDATE_TIMER'; totalTime: number; questionTime: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'BOOKMARK_QUESTION'; questionId: string }
  | { type: 'ADD_NOTE'; questionId: string; note: string }
  | { type: 'FLAG_QUESTION'; questionId: string; flag: 'difficult' | 'review_later' | 'report_error' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'SET_AUTO_SAVE'; enabled: boolean }
  | { type: 'CLEAR_SUBMISSION_ERROR' }
  | { type: 'LOAD_LOCAL_ANSWERS'; answers: Record<number, QuizAnswer> }
  | { type: 'SAVE_LOCAL_ANSWER'; answer: QuizAnswer }
  | { type: 'SET_PENDING_SUBMISSION'; pending: boolean }
  | { type: 'TRIGGER_EDIT'; at: number }
  | { type: 'UPDATE_SESSION_RESULTS'; results: { score: number; percentage: number; timeSpent: number; answeredQuestions: number; totalQuestions: number; correctAnswersCount?: number; incorrectAnswersCount?: number; unansweredQuestionsCount?: number } };

// Enhanced quiz reducer with API integration
function apiQuizReducer(state: ApiQuizState, action: ApiQuizAction): ApiQuizState {
  switch (action.type) {
    case 'NEXT_QUESTION':
      if (state.session.currentQuestionIndex < state.session.totalQuestions - 1) {
        const nextIndex = state.session.currentQuestionIndex + 1;
        const nextQuestion = state.session.questions?.[nextIndex] || null;
        const newState = {
          ...state,
          session: {
            ...state.session,
            currentQuestionIndex: nextIndex,
          },
          currentQuestion: nextQuestion,
          isAnswerRevealed: false,
          showExplanation: false,
          timer: {
            ...state.timer,
            questionTime: 0,
          },
        } as ApiQuizState;
        // Persist current question index for resume-on-reenter
        if (state.apiSessionId) {
          try { quizStorage.updateSessionProgress(state.apiSessionId, { currentQuestionIndex: nextIndex }); } catch { }
        }
        return newState;
      }
      return state;

    case 'PREVIOUS_QUESTION':
      if (state.session.currentQuestionIndex > 0) {
        const prevIndex = state.session.currentQuestionIndex - 1;
        const prevQuestion = state.session.questions?.[prevIndex] || null;
        const newState = {
          ...state,
          session: {
            ...state.session,
            currentQuestionIndex: prevIndex,
          },
          currentQuestion: prevQuestion,
          isAnswerRevealed: false,
          showExplanation: false,
          timer: {
            ...state.timer,
            questionTime: 0,
          },
        } as ApiQuizState;
        if (state.apiSessionId) {
          try { quizStorage.updateSessionProgress(state.apiSessionId, { currentQuestionIndex: prevIndex }); } catch { }
        }
        return newState;
      }
      return state;

    case 'GO_TO_QUESTION':
      if (action.questionIndex >= 0 && action.questionIndex < state.session.totalQuestions) {
        const targetQuestion = state.session.questions?.[action.questionIndex] || null;
        const newIndex = action.questionIndex;
        const newState = {
          ...state,
          session: {
            ...state.session,
            currentQuestionIndex: newIndex,
          },
          currentQuestion: targetQuestion,
          isAnswerRevealed: false,
          showExplanation: false,
          timer: {
            ...state.timer,
            questionTime: 0,
          },
        } as ApiQuizState;
        if (state.apiSessionId) {
          try { quizStorage.updateSessionProgress(state.apiSessionId, { currentQuestionIndex: newIndex }); } catch { }
        }
        return newState;
      }
      return state;

    case 'SUBMIT_ANSWER':
      if (!state.currentQuestion) {
        console.warn('Cannot submit answer: currentQuestion is undefined');
        return state;
      }

      const currentQuestionId = state.currentQuestion.id;
      const userAnswer = {
        questionId: currentQuestionId,
        timeSpent: state.timer.questionTime,
        timestamp: new Date(),
        ...action.answer,
      };

      // Store answer locally if client storage is enabled
      const newLocalAnswers = state.clientStorageEnabled
        ? { ...state.localAnswers, [currentQuestionId]: userAnswer }
        : state.localAnswers;

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [currentQuestionId]: userAnswer,
          },
        },
        localAnswers: newLocalAnswers,
        isAnswerRevealed: state.session.showAnswers,
        submittingAnswer: action.submitToApi || false,
        lastSubmissionError: null,
      };

    case 'ANSWER_SUBMITTED':
      return {
        ...state,
        submittingAnswer: false,
        lastSubmissionError: action.success ? null : (action.error || 'Submission failed'),
      };

    case 'CLEAR_ANSWER':
      const questionIdToClear = String(action.questionId);
      const questionIdNumberToClear = Number(action.questionId);

      // Remove from session.userAnswers
      const { [questionIdToClear]: removedUserAnswer, ...remainingUserAnswers } = state.session.userAnswers;

      // Remove from localAnswers
      const { [questionIdNumberToClear]: removedLocalAnswer, ...remainingLocalAnswers } = state.localAnswers;

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: remainingUserAnswers,
        },
        localAnswers: remainingLocalAnswers,
      };

    case 'REVEAL_ANSWER':
      return {
        ...state,
        isAnswerRevealed: true,
        showExplanation: true,
      };

    case 'TOGGLE_EXPLANATION':
      return {
        ...state,
        showExplanation: !state.showExplanation,
      };

    case 'PAUSE_QUIZ':
      return {
        ...state,
        session: {
          ...state.session,
          status: 'paused',
        },
        timer: {
          ...state.timer,
          isPaused: true,
          isRunning: false,
        },
      };

    case 'RESUME_QUIZ':
      return {
        ...state,
        session: {
          ...state.session,
          status: 'active',
        },
        timer: {
          ...state.timer,
          isPaused: false,
          isRunning: true,
        },
      };

    case 'UPDATE_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          totalTime: action.totalTime,
          questionTime: action.questionTime,
        },
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case 'BOOKMARK_QUESTION':
      const bookmarkAnswer = state.session.userAnswers[action.questionId] || {
        questionId: action.questionId,
        timeSpent: 0,
        timestamp: new Date(),
      };

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [action.questionId]: {
              ...bookmarkAnswer,
              isBookmarked: !bookmarkAnswer.isBookmarked,
            },
          },
        },
      };

    case 'ADD_NOTE':
      const noteAnswer = state.session.userAnswers[action.questionId] || {
        questionId: action.questionId,
        timeSpent: 0,
        timestamp: new Date(),
      };

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [action.questionId]: {
              ...noteAnswer,
              notes: action.note,
            },
          },
        },
      };

    case 'FLAG_QUESTION':
      const flagAnswer = state.session.userAnswers[action.questionId] || {
        questionId: action.questionId,
        timeSpent: 0,
        timestamp: new Date(),
      };

      const currentFlags = flagAnswer.flags || [];
      const hasFlag = currentFlags.includes(action.flag);
      const newFlags = hasFlag
        ? currentFlags.filter(f => f !== action.flag)
        : [...currentFlags, action.flag];

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [action.questionId]: {
              ...flagAnswer,
              flags: newFlags,
            },
          },
        },
      };

    case 'COMPLETE_QUIZ':
      return {
        ...state,
        session: {
          ...state.session,
          status: 'COMPLETED',
        },
        timer: {
          ...state.timer,
          isRunning: false,
          isPaused: false,
        },
        // Don't auto-reveal answers when completing quiz
        // Users should explicitly click "Show Answer" to see explanations
      };

    case 'SET_AUTO_SAVE':
      return {
        ...state,
        autoSave: action.enabled,
      };

    case 'CLEAR_SUBMISSION_ERROR':
      return {
        ...state,
        lastSubmissionError: null,
      };

    case 'LOAD_LOCAL_ANSWERS':
      return {
        ...state,
        localAnswers: action.answers,
      };

    case 'SAVE_LOCAL_ANSWER':
      return {
        ...state,
        localAnswers: {
          ...state.localAnswers,
          [action.answer.questionId]: action.answer,
        },
      };

    case 'SET_PENDING_SUBMISSION':
      return {
        ...state,
        pendingSubmission: action.pending,
      };

    case 'TRIGGER_EDIT':
      return {
        ...state,
        editTriggerAt: action.at,
      };

    case 'UPDATE_SESSION_RESULTS':
      return {
        ...state,
        session: {
          ...state.session,
          score: action.results.score,
          percentage: action.results.percentage,
          timeSpent: action.results.timeSpent,
          answeredQuestions: action.results.answeredQuestions,
          totalQuestions: action.results.totalQuestions,
          correctAnswersCount: action.results.correctAnswersCount,
          incorrectAnswersCount: action.results.incorrectAnswersCount,
          unansweredQuestionsCount: action.results.unansweredQuestionsCount,
          unansweredCount: action.results.unansweredCount,
        },
      };

    default:
      return state;
  }
}

// Enhanced context type with API integration
interface ApiQuizContextType {
  state: ApiQuizState;
  dispatch: React.Dispatch<ApiQuizAction>;
  // Helper functions
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitAnswer: (answer: any, submitToApi?: boolean) => Promise<void>;
  clearAnswer: (questionId: string | number) => void;
  revealAnswer: () => void;
  toggleExplanation: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  toggleSidebar: () => void;
  bookmarkQuestion: (questionId: string) => void;
  addNote: (questionId: string, note: string) => void;
  flagQuestion: (questionId: string, flag: 'difficult' | 'review_later' | 'report_error') => void;
  completeQuiz: () => void;
  submitAllAnswers: () => Promise<boolean>;
  setAutoSave: (enabled: boolean) => void;
  clearSubmissionError: () => void;
  retrySubmission: () => Promise<void>;
  getStorageStats: () => any;
}

const ApiQuizContext = createContext<ApiQuizContextType | undefined>(undefined);

// Enhanced provider with API integration
interface ApiQuizProviderProps {
  children: React.ReactNode;
  initialSession: any;
  apiSessionId?: number;
  enableApiSubmission?: boolean;
}

export function ApiQuizProvider({
  children,
  initialSession,
  apiSessionId,
  // Disable per-question API submission by default; answers are sent only on final submit
  enableApiSubmission = false
}: ApiQuizProviderProps) {
  const [timeUpNotificationShown, setTimeUpNotificationShown] = useState(false);
  const initialState: ApiQuizState = {
    session: initialSession,
    timer: {
      // Resume timer from API timeSpent if available
      totalTime: initialSession.timeSpent || 0,
      questionTime: 0,
      isPaused: initialSession.status === 'COMPLETED',
      isRunning: initialSession.status !== 'COMPLETED',
    },
    currentQuestion: initialSession.questions?.[initialSession.currentQuestionIndex] || null,
    isAnswerRevealed: false, // Only reveal when user explicitly clicks "Show Answer" button
    showExplanation: false, // Only show when user explicitly requests it
    sidebarOpen: true,
    apiSessionId,
    submittingAnswer: false,
    lastSubmissionError: null,
    autoSave: false, // Disable auto-save for client-side storage
    clientStorageEnabled: !initialSession.resumeFromApi, // Disable client storage when resuming from API
    pendingSubmission: false,
    localAnswers: initialSession.userAnswers || {},
    editTriggerAt: null,
  };

  const [state, dispatch] = useReducer(apiQuizReducer, initialState);
  const { submitAnswer: apiSubmitAnswer, submitting } = useQuizAnswerSubmission();
  const { playSound } = useSoundManager();

  // Derive a stable client storage session ID even when apiSessionId is absent (e.g., practice mode)
  const computeLocalSessionId = (id: any) => {
    if (typeof id === 'number' && Number.isFinite(id)) return id;
    const s = String(id || '');
    const numeric = parseInt(s, 10);
    if (!Number.isNaN(numeric)) return numeric;
    // djb2 hash -> positive 31-bit int
    let hash = 5381;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) + hash) + s.charCodeAt(i);
      hash = hash & 0x7fffffff;
    }
    return hash;
  };

  const storageSessionId = useMemo(() => {
    return (apiSessionId && Number.isFinite(apiSessionId))
      ? apiSessionId
      : computeLocalSessionId(initialSession?.id || initialSession?.sessionId || Date.now());
  }, [apiSessionId, initialSession?.id]);

  // Initialize session state - prioritize API data over client storage for resumption
  useEffect(() => {
    if (initialSession.resumeFromApi) {
      // Session is being resumed from API - use API data directly
      console.log(`🔄 Resuming session ${apiSessionId} from API data`);

      // Load answers from API response
      if (initialSession.userAnswers && Object.keys(initialSession.userAnswers).length > 0) {
        dispatch({ type: 'LOAD_LOCAL_ANSWERS', answers: initialSession.userAnswers });
        console.log(`📖 Loaded ${Object.keys(initialSession.userAnswers).length} answers from API`);
      }

      // Navigate to the correct question (already set in currentQuestionIndex)
      if (typeof initialSession.currentQuestionIndex === 'number') {
        dispatch({ type: 'GO_TO_QUESTION', questionIndex: initialSession.currentQuestionIndex });
        console.log(`📍 Navigated to question ${initialSession.currentQuestionIndex + 1}`);
      }

      // Resume timer from API timeSpent
      if (typeof initialSession.timeSpent === 'number' && initialSession.timeSpent > 0) {
        dispatch({ type: 'UPDATE_TIMER', totalTime: initialSession.timeSpent, questionTime: 0 });
        console.log(`⏱️ Resumed timer at ${initialSession.timeSpent} seconds`);
      }

    } else if (storageSessionId && state.clientStorageEnabled) {
      // Try to restore session progress for non-API sessions
      const totalQuestions = initialSession.totalQuestions || initialSession.questions?.length || 0;
      const restorationResult = sessionProgressManager.restoreProgress(storageSessionId, totalQuestions);

      if (restorationResult.success && restorationResult.data) {
        const progressData = restorationResult.data;

        // Load stored answers
        dispatch({ type: 'LOAD_LOCAL_ANSWERS', answers: progressData.answers });

        // Restore current question index and timer
        dispatch({ type: 'GO_TO_QUESTION', questionIndex: progressData.currentQuestionIndex });
        dispatch({ type: 'UPDATE_TIMER', totalTime: progressData.timeSpent, questionTime: 0 });

        // Restore UI state
        if (progressData.uiState.sidebarOpen !== undefined && progressData.uiState.sidebarOpen !== state.sidebarOpen) {
          dispatch({ type: 'TOGGLE_SIDEBAR' });
        }

        // Show restoration notification if there's meaningful progress
        if (progressData.currentQuestionIndex > 0 || Object.keys(progressData.answers).length > 0 || progressData.timeSpent > 30) {
          sessionProgressManager.showRestorationNotification(progressData);
        }

        console.log(`📖 Restored session progress: question ${progressData.currentQuestionIndex + 1}/${totalQuestions}`);
      } else {
        // Handle corrupted data or initialize new session
        if (restorationResult.isCorrupted && restorationResult.shouldReset) {
          console.warn('Session data corrupted, resetting:', restorationResult.error);
          sessionProgressManager.resetProgress(storageSessionId);
        }

        // Initialize new session in storage
        const sessionState: QuizSessionState = {
          sessionId: storageSessionId,
          title: initialSession.title || 'Quiz Session',
          type: initialSession.type || 'PRACTICE',
          status: 'NOT_STARTED',
          currentQuestionIndex: initialSession.currentQuestionIndex || 0,
          totalQuestions: totalQuestions,
          answers: {},
          startedAt: new Date(),
          lastUpdatedAt: new Date(),
          timeSpent: 0,
          bookmarkedQuestions: [],
          flaggedQuestions: [],
          settings: {
            showExplanations: initialSession.showExplanations || 'after_each',
            timeLimit: initialSession.timeLimit,
            shuffleQuestions: initialSession.shuffleQuestions || false,
          },
          uiState: {
            sidebarOpen: true,
            soundMuted: false,
            theme: undefined,
            fontSize: undefined,
            compactMode: false,
            reducedMotion: false,
            highContrast: false
          },
          lastQuestionIndex: 0,
          progressCheckpoints: []
        };

        quizStorage.saveSessionState(sessionState);
        console.log(`💾 Initialized new session ${storageSessionId} in client storage`);
      }
    }
  }, [storageSessionId, state.clientStorageEnabled, initialSession, apiSessionId]);


  // On entering a session: if status is NOT_STARTED, mark it IN_PROGRESS on server
  useEffect(() => {
    if (!apiSessionId || !enableApiSubmission) return;
    const currentStatus = (state.session?.status || 'NOT_STARTED').toString().toUpperCase();
    if (currentStatus === 'NOT_STARTED') {
      QuizService.updateQuizSessionStatus(apiSessionId, 'IN_PROGRESS')
        .catch((err) => {
          console.warn('Failed to set session IN_PROGRESS:', err);
        });
    }
  }, [apiSessionId, enableApiSubmission]);

  // Answer batching state for optimized submissions
  const [pendingAnswers, setPendingAnswers] = useState<Array<{
    questionId: number;
    selectedAnswerId: number;
    timeSpent?: number;
    timestamp: Date;
  }>>([]);

  // Track submission status for better UX
  const [batchSubmissionStatus, setBatchSubmissionStatus] = useState<{
    isSubmitting: boolean;
    lastSubmissionTime: number | null;
    failedAnswers: number[];
  }>({
    isSubmitting: false,
    lastSubmissionTime: null,
    failedAnswers: []
  });

  // Helper functions
  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
    // Persist navigation in client storage for resume
    if (storageSessionId && state.clientStorageEnabled) {
      try {
        const nextIndex = Math.min(state.session.currentQuestionIndex + 1, state.session.totalQuestions - 1);
        quizStorage.updateSessionProgress(storageSessionId, { currentQuestionIndex: nextIndex });
      } catch { }
    }
  }, [storageSessionId, state.clientStorageEnabled, state.session.currentQuestionIndex, state.session.totalQuestions]);

  // REMOVED: Legacy updateAnswer functionality
  // Review mode now relies solely on GET /quiz-sessions/{sessionId} response structure
  const updateAnswer = useCallback(async (questionId: number, selected: number | number[]) => {
    // For review mode, we only update local state - no API calls
    // The session data comes from GET /quiz-sessions/{sessionId} and is read-only

    if (!apiSessionId || !questionId || (!Array.isArray(selected) && !selected)) {
      toast.error('Missing session or answer information');
      throw { success: false, error: 'Missing session or answer information' };
    }

    try {
      // Update local state only for UI purposes
      const quizAnswer: QuizAnswer = {
        questionId: Number(questionId),
        ...(Array.isArray(selected)
          ? {
            selectedAnswerIds: selected.map(Number) as number[],
            selectedOptions: selected.map(String)
          }
          : {
            selectedAnswerId: Number(selected),
            selectedAnswerIds: [Number(selected)] as number[],
            selectedOptions: [String(selected)]
          }),
        timeSpent: state.timer.questionTime,
        timestamp: new Date(),
        isCorrect: undefined,
      } as any;

      // Only update local storage, not server
      quizStorage.saveAnswer(apiSessionId, quizAnswer);
      dispatch({ type: 'SAVE_LOCAL_ANSWER', answer: quizAnswer });

      toast.info('Answer updated locally. Note: Review mode is read-only.');
    } catch (err: any) {
      console.error('Local answer update failed', err);
      toast.error('Failed to update answer locally');
      throw err;
    }
  }, [apiSessionId, state.timer.questionTime]);

  const previousQuestion = useCallback(() => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
    if (storageSessionId && state.clientStorageEnabled) {
      try {
        const prevIndex = Math.max(0, state.session.currentQuestionIndex - 1);
        sessionProgressManager.saveProgress(storageSessionId, {
          currentQuestionIndex: prevIndex
        });
      } catch { }
    }
  }, [storageSessionId, state.clientStorageEnabled, state.session.currentQuestionIndex]);

  const goToQuestion = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', questionIndex: index });
    if (storageSessionId && state.clientStorageEnabled) {
      try {
        sessionProgressManager.saveProgress(storageSessionId, {
          currentQuestionIndex: index
        });
      } catch { }
    }
  }, [storageSessionId, state.clientStorageEnabled]);

  // Legacy batch submission - DISABLED for manual submission flow
  const submitAnswersBatch = useCallback(async (answersToSubmit: any[]) => {
    console.log('⚠️ Legacy batch submission called - this should not happen in manual submission mode');
    // This function is disabled to prevent auto-submission
    return;
  }, []);

  // Legacy debounced batch submission - DISABLED
  const debouncedBatchSubmit = useMemo(
    () => ({
      cancel: () => { }, // No-op function
      flush: () => { }, // No-op function
    }),
    []
  );

  const submitAnswer = useCallback(async (answer: any) => {
    // Prevent submission when completed
    if (state.session.status === 'completed' || state.session.status === 'COMPLETED') {
      // Silently skip API submission if user is reviewing a completed session
      console.warn('Cannot submit answer: Quiz session is already completed');
      return;
    }

    // Persist in React state and set session IN_PROGRESS on first answer
    dispatch({ type: 'SUBMIT_ANSWER', answer, submitToApi: false });

    // Build a normalized answer object once
    let quizAnswer: QuizAnswer | null = null;
    if (state.currentQuestion) {
      const selectedAnswerId = answer.selectedOptions?.[0];
      quizAnswer = {
        questionId: parseInt(state.currentQuestion.id),
        selectedAnswerId: selectedAnswerId ? parseInt(selectedAnswerId) : undefined,
        selectedAnswerIds: answer.selectedOptions?.map((id: string) => parseInt(id)),
        selectedOptions: answer.selectedOptions, // Keep for backward compatibility
        textAnswer: answer.textAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: state.timer.questionTime,
        timestamp: new Date(),
        flags: answer.flags || [],
        notes: answer.notes,
      } as any;

      // Always reflect in localAnswers for real-time UI (even without apiSessionId)
      dispatch({ type: 'SAVE_LOCAL_ANSWER', answer: quizAnswer });
    }

    // Save to client storage with a stable session ID (works in local/practice mode too)
    if (state.clientStorageEnabled && storageSessionId && quizAnswer) {
      // Mark the session as IN_PROGRESS locally the first time an answer is saved
      if (quizStorage.loadSessionState(storageSessionId)?.status === 'NOT_STARTED') {
        try { quizStorage.updateSessionProgress(storageSessionId, { status: 'IN_PROGRESS' }); } catch { }
        // Best-effort server status update if an API session exists
        if (apiSessionId) {
          try { await QuizService.updateQuizSessionStatus(apiSessionId, 'IN_PROGRESS'); } catch { }
        }
      }

      // Save progress with answer data
      sessionProgressManager.saveProgress(storageSessionId, {
        currentQuestionIndex: state.session.currentQuestionIndex,
        answers: { [quizAnswer.questionId]: quizAnswer },
        status: 'IN_PROGRESS',
        uiState: {
          sidebarOpen: state.sidebarOpen,
          soundMuted: false, // Will be updated from sound context
          theme: undefined,
          fontSize: undefined,
          compactMode: false,
          reducedMotion: false,
          highContrast: false
        }
      });

      quizStorage.saveAnswer(storageSessionId, quizAnswer);
      console.log(`💾 Answer saved to client storage (Question ${quizAnswer.questionId})`);
      // Do NOT submit per-answer anymore. Answers are stored locally and submitted in bulk on final submit.
    }

    // Play sound feedback based on answer correctness
    if (answer.isCorrect !== undefined) {
      try {
        await playSound(answer.isCorrect ? 'correct' : 'incorrect');
      } catch (error) {
        // Silently fail - don't block answer submission
        console.warn('Failed to play answer feedback sound:', error);
      }
    }

    dispatch({ type: 'ANSWER_SUBMITTED', success: true });
  }, [state.clientStorageEnabled, state.currentQuestion?.id, state.timer.questionTime, storageSessionId, apiSessionId, enableApiSubmission, playSound]);

  const clearAnswer = useCallback((questionId: string | number) => {
    dispatch({ type: 'CLEAR_ANSWER', questionId });

    // Also clear from local storage if enabled
    if (state.clientStorageEnabled && storageSessionId) {
      try {
        const questionIdNumber = Number(questionId);
        quizStorage.removeAnswer(storageSessionId, questionIdNumber);
        console.log(`🗑️ Cleared answer for question ${questionId} from client storage`);
      } catch (error) {
        console.error('Failed to clear answer from storage:', error);
      }
    }
  }, [state.clientStorageEnabled, storageSessionId]);

  const revealAnswer = useCallback(() => {
    dispatch({ type: 'REVEAL_ANSWER' });

    // Scroll to explanation after a short delay to allow DOM update
    setTimeout(() => {
      const explanationElement = document.getElementById('answer-explanation');
      if (explanationElement) {
        explanationElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  }, []);

  const toggleExplanation = useCallback(() => {
    dispatch({ type: 'TOGGLE_EXPLANATION' });
  }, []);

  const pauseQuiz = useCallback(async () => {
    try {
      // Always submit current answers and fetch fresh stats on pause
      if (apiSessionId && enableApiSubmission) {
        const userAnswers = state.session?.userAnswers || {};
        const answersToSubmit = Object.keys(userAnswers).filter(
          questionId => {
            const answer = userAnswers[questionId];
            return answer && (answer.selectedOptions?.length || answer.textAnswer);
          }
        );

        if (answersToSubmit.length > 0) {
          console.log(`📤 Auto-submitting ${answersToSubmit.length} answers on pause...`);

          // Submit answers using existing submitAllAnswers logic but only for answered questions
          const answersForSubmission = answersToSubmit.map(questionId => {
            const answer = userAnswers[questionId];
            return {
              questionId: Number(questionId),
              selectedAnswerId: answer.selectedOptions?.[0],
              selectedAnswerIds: answer.selectedOptions,
              textAnswer: answer.textAnswer,
              timeSpent: answer.timeSpent || 0
            };
          });

          // Build question type lookup
          const questionTypeById: Record<number, string> = {};
          (state.session.questions || []).forEach((q: any) => {
            const qt = (q.questionType || q.type || '').toString().toUpperCase();
            questionTypeById[Number(q.id)] = qt || 'SINGLE_CHOICE';
          });

          // Convert to API format
          const apiAnswers = answersForSubmission.map(answer => {
            const qType = questionTypeById[Number(answer.questionId)] || 'SINGLE_CHOICE';
            const isSingle = qType === 'SINGLE_CHOICE' || qType === 'QCS';
            const isMulti = qType === 'MULTIPLE_CHOICE' || qType === 'QCM';

            if (isSingle) {
              const selectedId = typeof answer.selectedAnswerId === 'number'
                ? answer.selectedAnswerId
                : (Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length ? Number(answer.selectedAnswerIds[0]) : undefined);
              return {
                questionId: Number(answer.questionId),
                ...(Number.isFinite(selectedId as number) ? { selectedAnswerId: Number(selectedId) } : {}),
                timeSpent: answer.timeSpent,
              };
            }

            if (isMulti) {
              const ids = Array.isArray(answer.selectedAnswerIds) ? answer.selectedAnswerIds.map(Number).filter(n => Number.isFinite(n)) : [];
              return {
                questionId: Number(answer.questionId),
                ...(ids.length ? { selectedAnswerIds: ids } : {}),
                timeSpent: answer.timeSpent,
              };
            }

            return {
              questionId: Number(answer.questionId),
              ...(typeof answer.selectedAnswerId === 'number' ? { selectedAnswerId: answer.selectedAnswerId }
                : (Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length ? { selectedAnswerIds: answer.selectedAnswerIds } : {})),
              ...(answer.textAnswer ? { textAnswer: answer.textAnswer } : {}),
              ...(typeof answer.isCorrect === 'boolean' ? { isCorrect: answer.isCorrect } : {}),
              timeSpent: answer.timeSpent,
            };
          }).filter(entry => entry.selectedAnswerId || entry.selectedAnswerIds || (entry.textAnswer && String(entry.textAnswer).trim().length > 0));

          if (apiAnswers.length > 0) {
            const totalTimeSpent = state.timer.totalTime || 0;
            const response = await QuizService.submitAnswersBulk(apiSessionId, apiAnswers, totalTimeSpent);

            if (response.success && response.data) {
              console.log(`✅ Successfully submitted ${apiAnswers.length} answers on pause:`, response.data);
            } else {
              console.log(`✅ Submitted ${apiAnswers.length} answers on pause (no response data)`);
            }
          }
        }

        // Always fetch fresh session data to get accurate backend count fields
        console.log('📊 Fetching fresh session data for accurate pause stats...');
        try {
          const sessionResponse = await QuizService.getQuizSession(apiSessionId);
          if (sessionResponse.success && sessionResponse.data) {
            const sessionData = sessionResponse.data.data || sessionResponse.data;
            dispatch({
              type: 'UPDATE_SESSION_RESULTS',
              results: {
                score: sessionData.score || 0,
                percentage: sessionData.percentage || 0,
                timeSpent: sessionData.timeSpent || (state.timer.totalTime || 0),
                answeredQuestions: sessionData.answeredQuestions || 0,
                totalQuestions: sessionData.totalQuestions || state.session.totalQuestions,
                correctAnswersCount: sessionData.correctAnswersCount || 0,
                incorrectAnswersCount: sessionData.incorrectAnswersCount || 0,
                unansweredQuestionsCount: sessionData.unansweredQuestionsCount || 0
              }
            });
            console.log('✅ Fresh session data with backend counts fetched for pause display:', {
              correctAnswersCount: sessionData.correctAnswersCount,
              incorrectAnswersCount: sessionData.incorrectAnswersCount,
              unansweredQuestionsCount: sessionData.unansweredQuestionsCount
            });
          }
        } catch (error) {
          console.warn('Failed to fetch fresh session data on pause:', error);
        }
      }
    } catch (error) {
      console.error('Failed to submit answers on pause:', error);
      // Show user-friendly error message but continue with pause
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn(`Pause submission failed: ${errorMessage}. Quiz will be paused without submitting answers.`);
      // Continue with pause even if submission fails to ensure user can still pause
    }

    // Update session status to IN_PROGRESS when pausing with unanswered questions
    if (apiSessionId) {
      try {
        const userAnswers = state.session?.userAnswers || {};
        const answeredQuestions = Object.keys(userAnswers).filter(
          questionId => {
            const answer = userAnswers[questionId];
            return answer && (answer.selectedOptions?.length || answer.textAnswer);
          }
        ).length;

        const totalQuestions = state.session.totalQuestions || state.session.questions?.length || 0;

        if (answeredQuestions < totalQuestions && answeredQuestions > 0) {
          await SessionStatusManager.setInProgress(apiSessionId, {
            showToast: false,
            silent: true
          });
          console.log(`✅ Session ${apiSessionId} marked as IN_PROGRESS on pause`);
        }
      } catch (error) {
        console.warn('Failed to update session status on pause:', error);
      }
    }

    // Then pause the quiz
    dispatch({ type: 'PAUSE_QUIZ' });
  }, [apiSessionId, enableApiSubmission, state.session.userAnswers, state.session.questions, state.session.totalQuestions, state.timer.totalTime]);

  const resumeQuiz = useCallback(() => {
    dispatch({ type: 'RESUME_QUIZ' });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  const bookmarkQuestion = useCallback((questionId: string) => {
    dispatch({ type: 'BOOKMARK_QUESTION', questionId });
  }, []);

  const addNote = useCallback((questionId: string, note: string) => {
    dispatch({ type: 'ADD_NOTE', questionId, note });
  }, []);

  // Legacy flush pending answers - DISABLED for manual submission flow
  const flushPendingAnswers = useCallback(async () => {
    console.log('⚠️ Legacy flushPendingAnswers called - this should not happen in manual submission mode');
    // This function is disabled to prevent auto-submission
    return;
  }, []);

  // Manual quiz submission - only when user explicitly submits
  const submitAllAnswers = useCallback(async () => {
    if (!apiSessionId) {
      console.error('Cannot submit quiz: No session ID');
      throw new Error('No session ID available for submission');
    }

    // Validate session state
    if (!state.session) {
      console.error('Cannot submit quiz: No session data');
      throw new Error('No session data available');
    }

    // Check if session is already completed
    if (state.session.status === 'COMPLETED' || state.session.status === 'completed') {
      console.warn('Quiz is already completed, skipping submission');
      return true;
    }

    try {
      dispatch({ type: 'SET_PENDING_SUBMISSION', pending: true });

      // Mark session as completed in client storage
      const completedSession = quizStorage.completeSession(apiSessionId);
      if (!completedSession) {
        throw new Error('Failed to complete session in client storage');
      }

      // Get all answers for submission
      const answersForSubmission = quizStorage.getAnswersForSubmission(apiSessionId);

      // Validate answers before submission
      const totalQuestions = state.session.totalQuestions || state.session.questions?.length || 0;

      if (answersForSubmission.length === 0) {
        console.warn('No answers to submit');

        // Allow submission with no answers but warn user
        const shouldContinue = confirm(
          'You have not answered any questions. Do you want to submit an empty quiz?'
        );

        if (!shouldContinue) {
          dispatch({ type: 'SET_PENDING_SUBMISSION', pending: false });
          return false;
        }

        toast.warning('Submitting quiz with no answers');
      } else if (answersForSubmission.length < totalQuestions) {
        // Partial submission - warn user
        const unansweredCount = totalQuestions - answersForSubmission.length;
        console.warn(`Submitting partial quiz: ${answersForSubmission.length}/${totalQuestions} questions answered`);

        toast.info(`Submitting ${answersForSubmission.length} of ${totalQuestions} answers. ${unansweredCount} questions left unanswered.`);
      }

      console.log(`📤 Submitting ${answersForSubmission.length} answers to server...`);
      toast.loading('Submitting your answers...', { id: 'quiz-submission' });

      // Build a lookup of question types to shape payload correctly
      const questionTypeById: Record<number, string> = {};
      try {
        (state.session.questions || []).forEach((q: any) => {
          const qt = (q.questionType || q.type || '').toString().toUpperCase();
          questionTypeById[Number(q.id)] = qt || 'SINGLE_CHOICE';
        });
      } catch { }

      // Convert to API format and submit
      const apiAnswers = answersForSubmission.map(answer => {
        const qType = questionTypeById[Number(answer.questionId)] || 'SINGLE_CHOICE';
        const isSingle = qType === 'SINGLE_CHOICE' || qType === 'QCS';
        const isMulti = qType === 'MULTIPLE_CHOICE' || qType === 'QCM';

        if (isSingle) {
          const selectedId = typeof answer.selectedAnswerId === 'number'
            ? answer.selectedAnswerId
            : (Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length ? Number(answer.selectedAnswerIds[0]) : undefined);
          return {
            questionId: Number(answer.questionId),
            ...(Number.isFinite(selectedId as number) ? { selectedAnswerId: Number(selectedId) } : {}),
            timeSpent: answer.timeSpent,
          } as any;
        }

        if (isMulti) {
          const ids = Array.isArray(answer.selectedAnswerIds) ? answer.selectedAnswerIds.map(Number).filter(n => Number.isFinite(n)) : [];
          return {
            questionId: Number(answer.questionId),
            ...(ids.length ? { selectedAnswerIds: ids } : {}),
            timeSpent: answer.timeSpent,
          } as any;
        }

        // Fallback: try single first, else multi array
        return {
          questionId: Number(answer.questionId),
          ...(typeof answer.selectedAnswerId === 'number' ? { selectedAnswerId: answer.selectedAnswerId }
            : (Array.isArray(answer.selectedAnswerIds) && answer.selectedAnswerIds.length ? { selectedAnswerIds: answer.selectedAnswerIds } : {})),
          ...(answer.textAnswer ? { textAnswer: answer.textAnswer } : {}),
          ...(typeof answer.isCorrect === 'boolean' ? { isCorrect: answer.isCorrect } : {}),
          timeSpent: answer.timeSpent,
        } as any;
      }).filter(entry => (entry as any).selectedAnswerId || (entry as any).selectedAnswerIds || ((entry as any).textAnswer && String((entry as any).textAnswer).trim().length > 0));

      if (apiAnswers.length > 0) {
        // Get total time spent for the session according to session-doc.md
        const totalTimeSpent = state.timer.totalTime || 0;
        const response = await QuizService.submitAnswersBulk(apiSessionId, apiAnswers, totalTimeSpent);
        if (!response.success) throw new Error(response.error || 'Failed to submit answers');

        // Handle new response schema from session-doc.md
        const submissionResult = response.data;
        if (submissionResult) {
          console.log('📊 Submission result:', {
            sessionId: submissionResult.sessionId,
            scoreOutOf20: submissionResult.scoreOutOf20,
            percentageScore: submissionResult.percentageScore,
            timeSpent: submissionResult.timeSpent,
            answeredQuestions: submissionResult.answeredQuestions,
            totalQuestions: submissionResult.totalQuestions,
            status: submissionResult.status
          });

          // Store submission result in sessionStorage for results page
          try {
            sessionStorage.setItem(
              `quiz-submission-result-${apiSessionId}`,
              JSON.stringify(submissionResult)
            );
            console.log('💾 Stored submission result in sessionStorage for results page');
          } catch (e) {
            console.warn('Failed to store submission result in sessionStorage:', e);
          }

          // Update session with submission results
          // In the new response structure: 
          // - totalScore20 is the score out of 20
          // - score is the percentage
          dispatch({
            type: 'UPDATE_SESSION_RESULTS',
            results: {
              score: submissionResult.totalScore20 ?? submissionResult.scoreOutOf20 ?? 0,
              percentage: (submissionResult.totalScore20 !== undefined) ? submissionResult.score : (submissionResult.percentageScore || 0),
              timeSpent: submissionResult.timeSpent || totalTimeSpent,
              answeredQuestions: submissionResult.answeredQuestions ??
                ((submissionResult.correctAnswersCount !== undefined && submissionResult.incorrectAnswersCount !== undefined)
                  ? (submissionResult.correctAnswersCount + submissionResult.incorrectAnswersCount)
                  : apiAnswers.length),
              totalQuestions: submissionResult.totalQuestions || state.session.totalQuestions,
              correctAnswersCount: submissionResult.correctAnswersCount,
              incorrectAnswersCount: submissionResult.incorrectAnswersCount,
              unansweredQuestionsCount: submissionResult.unansweredCount ?? submissionResult.unansweredQuestionsCount
            }
          });
        }
      }

      // Mark completed on server and locally using SessionStatusManager
      const statusUpdateSuccess = await SessionStatusManager.setCompleted(apiSessionId, {
        showToast: false, // We'll show our own success toast below
        retryCount: 1
      });

      if (!statusUpdateSuccess) {
        console.warn('Failed to update session status to COMPLETED, but continuing with submission');
      }

      dispatch({ type: 'COMPLETE_QUIZ' });

      // Clean up client storage after successful submission
      quizStorage.removeSessionState(apiSessionId);

      toast.success('Quiz submitted successfully!', { id: 'quiz-submission' });
      console.log(`✅ Quiz ${apiSessionId} submitted successfully`);

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit quiz';
      console.error('Quiz submission error:', error);
      toast.error(`Failed to submit quiz: ${errorMessage}`, { id: 'quiz-submission' });

      // Keep answers in storage for retry
      toast.info('Your answers are saved locally. You can try submitting again.');
      return false;
    } finally {
      dispatch({ type: 'SET_PENDING_SUBMISSION', pending: false });
    }
  }, [apiSessionId]);

  // Legacy completion function - now just marks as ready for submission
  const completeQuiz = useCallback(async () => {
    // Just mark the quiz as ready for submission, don't auto-submit
    if (apiSessionId) {
      quizStorage.completeSession(apiSessionId);
      dispatch({ type: 'COMPLETE_QUIZ' });
      console.log(`✅ Quiz ${apiSessionId} marked as ready for submission`);
    }
  }, [apiSessionId]);

  const flagQuestion = useCallback((questionId: string, flag: 'difficult' | 'review_later' | 'report_error') => {
    dispatch({ type: 'FLAG_QUESTION', questionId, flag });
  }, []);



  const setAutoSave = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_AUTO_SAVE', enabled });
  }, []);

  const clearSubmissionError = useCallback(() => {
    dispatch({ type: 'CLEAR_SUBMISSION_ERROR' });
  }, []);

  // Retry submission of stored answers with enhanced error handling
  const retrySubmission = useCallback(async () => {
    if (!apiSessionId) {
      console.error('Cannot retry submission: No session ID');
      toast.error('Cannot retry submission: No session ID');
      return;
    }

    const storedSession = quizStorage.loadSessionState(apiSessionId);
    if (!storedSession || storedSession.status !== 'COMPLETED') {
      console.log('No completed session found for retry');
      toast.warning('No completed session found for retry');
      return;
    }

    console.log(`🔄 Retrying submission for session ${apiSessionId}...`);
    toast.loading('Retrying submission...', { id: 'retry-submission' });

    try {
      const success = await submitAllAnswers();

      if (success) {
        toast.success('Quiz submitted successfully on retry!', { id: 'retry-submission' });
        console.log(`✅ Retry submission successful for session ${apiSessionId}`);
      } else {
        toast.error('Retry submission failed. Please try again.', { id: 'retry-submission' });
        console.error(`❌ Retry submission failed for session ${apiSessionId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Retry submission error:', error);
      toast.error(`Retry submission failed: ${errorMessage}`, { id: 'retry-submission' });

      // Update submission error state for UI feedback
      dispatch({
        type: 'ANSWER_SUBMITTED',
        success: false,
        error: `Retry failed: ${errorMessage}`
      });
    }
  }, [apiSessionId, submitAllAnswers]);

  // Get client storage statistics
  const getStorageStats = useCallback(() => {
    return quizStorage.getStorageStats();
  }, []);

  // Reset time up notification when session changes
  useEffect(() => {
    setTimeUpNotificationShown(false);
  }, [apiSessionId, initialSession.id]);

  // Timer effect
  useEffect(() => {
    if (!state.timer.isRunning || state.timer.isPaused) return;

    const interval = setInterval(() => {
      const newTotalTime = state.timer.totalTime + 1;
      const newQuestionTime = state.timer.questionTime + 1;

      dispatch({
        type: 'UPDATE_TIMER',
        totalTime: newTotalTime,
        questionTime: newQuestionTime
      });

      // Check for time limit and show notification
      const timeLimit = state.session.timeLimit; // in minutes
      if (timeLimit && !timeUpNotificationShown) {
        const timeLimitSeconds = timeLimit * 60;
        if (newTotalTime >= timeLimitSeconds) {
          setTimeUpNotificationShown(true);
          toast.warning('⏰ Time is up!', {
            description: `You have reached the ${timeLimit} minute time limit for this quiz. You can continue, but your time is over.`,
            duration: 8000,
            important: true,
          });

          // Also dispatch an action to handle time up state
          dispatch({ type: 'PAUSE_QUIZ' });
        }
      }

      // Persist timer and progress periodically (every 10 seconds to avoid excessive writes)
      if (storageSessionId && newTotalTime % 10 === 0) {
        sessionProgressManager.saveProgress(storageSessionId, {
          timeSpent: newTotalTime,
          currentQuestionIndex: state.session.currentQuestionIndex,
          uiState: {
            sidebarOpen: state.sidebarOpen,
            soundMuted: false, // Will be updated from sound context
            theme: undefined,
            fontSize: undefined,
            compactMode: false,
            reducedMotion: false,
            highContrast: false
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.timer.isRunning, state.timer.isPaused, state.timer.totalTime, state.timer.questionTime, state.apiSessionId, state.session.timeLimit, timeUpNotificationShown]);

  const value: ApiQuizContextType & { updateAnswer: (questionId: number, selectedAnswerId: number) => Promise<void> } = {
    state,
    dispatch,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitAnswer,
    clearAnswer,
    revealAnswer,
    toggleExplanation,
    pauseQuiz,
    resumeQuiz,
    toggleSidebar,
    bookmarkQuestion,
    addNote,
    flagQuestion,
    completeQuiz,
    submitAllAnswers,
    setAutoSave,
    clearSubmissionError,
    retrySubmission,
    getStorageStats,
    // Legacy compatibility
    flushPendingAnswers,
    batchSubmissionStatus,
    pendingAnswersCount: Object.keys(state.localAnswers).length,
    // New
    updateAnswer,
  };

  return (
    <ApiQuizContext.Provider value={value}>
      {children}
    </ApiQuizContext.Provider>
  );
}

// Hook to use the enhanced quiz context
export function useApiQuiz() {
  const context = useContext(ApiQuizContext);
  if (context === undefined) {
    throw new Error('useApiQuiz must be used within an ApiQuizProvider');
  }
  return context;
}

// Export the API-only useQuiz hook - no fallback to ensure API-only usage
export function useQuiz() {
  return useApiQuiz();
}
