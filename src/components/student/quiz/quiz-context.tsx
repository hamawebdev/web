// @ts-nocheck
'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { sessionProgressManager } from '@/lib/session-progress-manager';
import { toast } from 'sonner';

// Basic quiz types for compatibility
export interface QuizQuestion {
  id: string;
  title: string;
  content: string;
  type: 'QCM' | 'QCS' | 'QROC' | 'CAS';
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  tags?: string[];
  repetitionCount?: number;
  repetitionYears?: number[];
  fields?: string[];
  // Additional fields from API response
  questionType?: 'MULTIPLE_CHOICE' | 'SINGLE_CHOICE' | 'TRUE_FALSE';
  yearLevel?: string;
  examYear?: number;
  metadata?: string;
  questionImages?: Array<{
    id: number;
    imagePath: string;
    altText?: string;
  }>;
  questionExplanationImages?: Array<{
    id: number;
    imagePath: string;
    altText?: string;
  }>;
  university?: {
    id: number;
    name: string;
    country: string;
  };
  course?: {
    id: number;
    name: string;
    description?: string;
    module?: {
      id: number;
      name: string;
    };
  };
  source?: {
    id: number;
    name: string;
  } | string; // Can be object or string for backward compatibility
}

export interface UserAnswer {
  questionId: string;
  selectedOptions?: string[];
  textAnswer?: string;
  timeSpent?: number;
  isCorrect?: boolean;
  isBookmarked?: boolean;
  notes?: string;
  flags?: string[];
}

export interface QuizSession {
  id: string;
  title: string;
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL';
  subject: string;
  questions: QuizQuestion[];
  totalQuestions: number;
  currentQuestionIndex: number;
  userAnswers: Record<string, UserAnswer>;
  startTime: Date;
  endTime?: Date;
  timeLimit?: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
}

export interface QuizTimer {
  totalTime: number;
  questionTime: number;
  isPaused: boolean;
  isRunning: boolean;
}

// Basic quiz state
interface QuizState {
  session: QuizSession;
  timer: QuizTimer;
  currentQuestion: QuizQuestion | null;
  isAnswerRevealed: boolean;
  showExplanation: boolean;
  sidebarOpen: boolean;
}

// Basic quiz actions
type QuizAction =
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'GO_TO_QUESTION'; questionIndex: number }
  | { type: 'SUBMIT_ANSWER'; answer: any }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'TOGGLE_EXPLANATION' }
  | { type: 'PAUSE_QUIZ' }
  | { type: 'RESUME_QUIZ' }
  | { type: 'UPDATE_TIMER'; totalTime: number; questionTime: number }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'BOOKMARK_QUESTION'; questionId: string }
  | { type: 'ADD_NOTE'; questionId: string; note: string }
  | { type: 'FLAG_QUESTION'; questionId: string; flag: string }
  | { type: 'COMPLETE_QUIZ' };

// Basic quiz reducer
function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'NEXT_QUESTION':
      if (state.session.currentQuestionIndex < state.session.totalQuestions - 1) {
        const nextIndex = state.session.currentQuestionIndex + 1;
        const nextQuestion = state.session.questions[nextIndex];
        return {
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
        };
      }
      return state;

    case 'PREVIOUS_QUESTION':
      if (state.session.currentQuestionIndex > 0) {
        const prevIndex = state.session.currentQuestionIndex - 1;
        const prevQuestion = state.session.questions[prevIndex];
        return {
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
        };
      }
      return state;

    case 'GO_TO_QUESTION':
      if (action.questionIndex >= 0 && action.questionIndex < state.session.totalQuestions) {
        const question = state.session.questions[action.questionIndex];
        return {
          ...state,
          session: {
            ...state.session,
            currentQuestionIndex: action.questionIndex,
          },
          currentQuestion: question,
          isAnswerRevealed: false,
          showExplanation: false,
          timer: {
            ...state.timer,
            questionTime: 0,
          },
        };
      }
      return state;

    case 'SUBMIT_ANSWER':
      if (state.currentQuestion) {
        return {
          ...state,
          session: {
            ...state.session,
            userAnswers: {
              ...state.session.userAnswers,
              [state.currentQuestion.id]: {
                ...state.session.userAnswers[state.currentQuestion.id],
                ...action.answer,
                timeSpent: state.timer.questionTime,
              },
            },
          },
        };
      }
      return state;

    case 'REVEAL_ANSWER':
      return {
        ...state,
        isAnswerRevealed: true,
      };

    case 'TOGGLE_EXPLANATION':
      return {
        ...state,
        showExplanation: !state.showExplanation,
      };

    case 'PAUSE_QUIZ':
      return {
        ...state,
        timer: {
          ...state.timer,
          isPaused: true,
          isRunning: false,
        },
      };

    case 'RESUME_QUIZ':
      return {
        ...state,
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
      if (state.currentQuestion) {
        return {
          ...state,
          session: {
            ...state.session,
            userAnswers: {
              ...state.session.userAnswers,
              [action.questionId]: {
                ...state.session.userAnswers[action.questionId],
                isBookmarked: !state.session.userAnswers[action.questionId]?.isBookmarked,
              },
            },
          },
        };
      }
      return state;

    case 'ADD_NOTE':
      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [action.questionId]: {
              ...state.session.userAnswers[action.questionId],
              notes: action.note,
            },
          },
        },
      };

    case 'FLAG_QUESTION':
      const currentFlags = state.session.userAnswers[action.questionId]?.flags || [];
      const newFlags = currentFlags.includes(action.flag)
        ? currentFlags.filter(f => f !== action.flag)
        : [...currentFlags, action.flag];

      return {
        ...state,
        session: {
          ...state.session,
          userAnswers: {
            ...state.session.userAnswers,
            [action.questionId]: {
              ...state.session.userAnswers[action.questionId],
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
          endTime: new Date(),
        },
        timer: {
          ...state.timer,
          isRunning: false,
        },
      };

    default:
      return state;
  }
}

// Context type
interface QuizContextType {
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitAnswer: (answer: any) => void;
  revealAnswer: () => void;
  toggleExplanation: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  toggleSidebar: () => void;
  bookmarkQuestion: (questionId: string) => void;
  addNote: (questionId: string, note: string) => void;
  flagQuestion: (questionId: string, flag: string) => void;
  completeQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider props
interface QuizProviderProps {
  children: React.ReactNode;
  initialSession: QuizSession;
}

export function QuizProvider({ children, initialSession }: QuizProviderProps) {
  const [timeUpNotificationShown, setTimeUpNotificationShown] = useState(false);

  const initialState: QuizState = {
    session: initialSession,
    timer: {
      totalTime: 0,
      questionTime: 0,
      isPaused: false,
      isRunning: true,
    },
    currentQuestion: initialSession.questions[initialSession.currentQuestionIndex] || null,
    isAnswerRevealed: false,
    showExplanation: false,
    sidebarOpen: true,
  };

  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Helper functions
  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const previousQuestion = useCallback(() => {
    dispatch({ type: 'PREVIOUS_QUESTION' });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    dispatch({ type: 'GO_TO_QUESTION', questionIndex: index });
  }, []);

  const submitAnswer = useCallback((answer: any) => {
    dispatch({ type: 'SUBMIT_ANSWER', answer });
  }, []);

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

  const pauseQuiz = useCallback(() => {
    dispatch({ type: 'PAUSE_QUIZ' });
  }, []);

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

  const flagQuestion = useCallback((questionId: string, flag: string) => {
    dispatch({ type: 'FLAG_QUESTION', questionId, flag });
  }, []);

  const completeQuiz = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUIZ' });
  }, []);

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
          toast.warning('Time is up!', {
            description: `You have reached the ${timeLimit} minute time limit for this quiz.`,
            duration: 5000,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.timer.isRunning, state.timer.isPaused, state.timer.totalTime, state.timer.questionTime, state.session.timeLimit, timeUpNotificationShown]);

  const value: QuizContextType = {
    state,
    dispatch,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitAnswer,
    revealAnswer,
    toggleExplanation,
    pauseQuiz,
    resumeQuiz,
    toggleSidebar,
    bookmarkQuestion,
    addNote,
    flagQuestion,
    completeQuiz,
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}

// Hook to use the quiz context
export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}
