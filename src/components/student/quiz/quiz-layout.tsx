// @ts-nocheck
'use client';

import { PauseCircle, PlayCircle, Home } from '@solar-icons/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Flag,
  BookOpen,
  Trophy,
  Send,
  Check,
  X as XIcon,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useQuiz } from './quiz-api-context';
import { QuestionDisplay } from './question-display';
// import { ClientStorageIndicator } from './client-storage-indicator';
import { SessionTypeIndicator } from './session-type-indicator';
import { QuizTimer } from './quiz-timer';
import { useGlobalKeyboardShortcuts } from './hooks/use-global-keyboard-shortcuts';
import { QuizResults } from './session-completion/quiz-results';
import { ApiStatusIndicator } from './api-status-indicator';
import { ApiQuizResults } from './api-quiz-results';
import { useApiQuiz } from './quiz-api-context';
import { EnhancedQuizFooter } from './enhanced-quiz-footer';
import { QuizStatisticsDisplay } from './quiz-statistics-display';
import { EnhancedExitDialog } from './enhanced-exit-dialog';
import { SoundToggle } from './sound-toggle';

import { SessionStatusManager } from '@/lib/session-status-manager';
import { QuizService } from '@/lib/api-services';
import { toast } from 'sonner';


export function QuizLayout() {
  const router = useRouter();
  const { state, pauseQuiz, resumeQuiz, nextQuestion, previousQuestion, completeQuiz, goToQuestion, toggleSidebar, submitAllAnswers } = useQuiz();
  const { state: apiState } = useApiQuiz();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [latestApiResults, setLatestApiResults] = useState<any>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  // Extract API session results from the API state, prioritizing latest API response
  const apiSessionResults = latestApiResults || (apiState.session ? {
    scoreOutOf20: apiState.session.score,
    percentageScore: apiState.session.percentage,
    timeSpent: apiState.session.timeSpent,
    answeredQuestions: apiState.session.answeredQuestions,
    totalQuestions: apiState.session.totalQuestions,
    status: apiState.session.status,
    sessionId: apiState.apiSessionId,
    // Backend count fields for accurate stats display
    correctAnswersCount: apiState.session.correctAnswersCount,
    incorrectAnswersCount: apiState.session.incorrectAnswersCount,
    unansweredCount: apiState.session.unansweredCount || apiState.session.unansweredQuestionsCount,
    unansweredQuestionsCount: apiState.session.unansweredQuestionsCount
  } : undefined);

  // Global keyboard shortcuts
  useGlobalKeyboardShortcuts({
    onShowExitDialog: () => setShowExitDialog(true),
    onClearAnswers: () => {
      // This will be handled by individual question components
      // We'll pass this down to question components
    }
  });

  const { session, timer, currentQuestion } = state;

  // Redirect to completion page when quiz is completed
  const totalQuestions = session?.totalQuestions || session?.questions?.length || 0;
  const answeredQuestions = Object.keys(state.localAnswers || {}).length;

  // Redirect to new completion page instead of showing inline results
  const sessionStatus = session?.status;

  useEffect(() => {
    if (sessionStatus === 'completed' || sessionStatus === 'COMPLETED') {
      const id = (state as any).apiSessionId || session?.id;
      if (id) {
        router.push(`/session/${id}/results`);
      }
    }
  }, [sessionStatus, router]);

  // Handle browser close/navigation with session status management
  useEffect(() => {
    const apiSessionId = (state as any).apiSessionId;
    if (!apiSessionId || !session) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Only update status if session is not already completed
      if (sessionStatus !== 'COMPLETED' && sessionStatus !== 'completed') {
        SessionStatusManager.handleBeforeUnload(
          apiSessionId,
          totalQuestions,
          answeredQuestions
        );
      }
    };

    const handleVisibilityChange = () => {
      // Handle tab/window visibility changes
      if (document.hidden && sessionStatus !== 'COMPLETED' && sessionStatus !== 'completed') {
        // User switched away from tab - update status if there are unanswered questions
        if (answeredQuestions < totalQuestions && answeredQuestions > 0) {
          SessionStatusManager.setInProgress(apiSessionId, { silent: true });
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionStatus, totalQuestions, answeredQuestions, state]);

  // Safety check - ensure session exists and has required properties
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in-up">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center animate-pulse-soft">
              <span className="text-xl">📚</span>
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Loading Quiz Session...
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Please wait while we prepare your quiz.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Initializing...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  if (session.status === 'completed' || session.status === 'COMPLETED') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          Redirecting to completion page...
        </div>
      </div>
    );
  }

  // Ensure required session properties exist with defaults
  const currentQuestionIndex = session.currentQuestionIndex ?? 0;
  const userAnswers = session.userAnswers ?? {};

  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExitQuiz = () => {
    router.push('/student/practice');
  };

  // Helper functions for question info
  const getQuestionType = (question: any) => {
    if (question?.type) return question.type;
    if (question?.questionType) return question.questionType;
    if (question?.options?.length > 0) {
      const correctCount = question.options.filter((opt: any) => opt.isCorrect).length;
      return correctCount > 1 ? 'QCM' : 'QCS';
    }
    return 'QCS';
  };

  const getQuestionTypeInfo = (type: string) => {
    switch (type) {
      case 'QCM':
        return {
          name: 'Multiple Choice (QCM)',
          description: 'Multiple correct answers possible',
          icon: '☑️',
        };
      case 'QCS':
        return {
          name: 'Single Choice (QCS)',
          description: 'Only one correct answer',
          icon: '⚪',
        };
      case 'QROC':
        return {
          name: 'Questions à Réponse Ouverte Courte',
          description: 'Réponse libre courte',
          icon: '✏️',
        };
      case 'CAS':
        return {
          name: 'Cas Cliniques',
          description: 'Cas clinique avec sous-questions',
          icon: '🏥',
        };
      default:
        return {
          name: 'Question',
          description: 'Type de question',
          icon: '❓',
        };
    }
  };

  const transformQuestion = (question: any) => {
    return {
      ...question,
      content: question.content || question.questionText || question.text || '',
      source: question.source || 'Practice Quiz',
      tags: question.tags || [],
    };
  };

  const handlePauseResume = () => {
    if (timer.isPaused) {
      resumeQuiz();
    } else {
      pauseQuiz();
    }
  };

  const handleShowStatsOverlay = async () => {
    setShowExitDialog(false); // Close exit dialog first
    setStatsError(null); // Clear any previous errors

    // Submit answers like pause does (but don't actually pause the timer)
    try {
      // Use the same submission logic as pause but without pausing
      const currentSessionId = apiState?.apiSessionId || state.apiSessionId;
      if (currentSessionId) {
        const userAnswers = session?.userAnswers || {};
        const answersToSubmit = Object.keys(userAnswers).filter(
          questionId => {
            const answer = userAnswers[questionId];
            return answer && (answer.selectedOptions?.length || answer.textAnswer);
          }
        );

        if (answersToSubmit.length > 0) {
          console.log(`📤 Submitting ${answersToSubmit.length} answers for stats display...`);

          // Import QuizService dynamically to avoid circular dependencies
          const { QuizService } = await import('@/lib/api-services');

          // Convert answers to API format (same logic as pause)
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
          (session.questions || []).forEach((q: any) => {
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
              timeSpent: answer.timeSpent,
            };
          }).filter(entry => (
            (entry.selectedAnswerId !== undefined && entry.selectedAnswerId !== null) ||
            (Array.isArray(entry.selectedAnswerIds) && entry.selectedAnswerIds.length > 0) ||
            (entry.textAnswer && String(entry.textAnswer).trim().length > 0)
          ));

          if (apiAnswers.length > 0) {
            const totalTimeSpent = timer.totalTime || 0;
            const response = await QuizService.submitAnswersBulk(currentSessionId, apiAnswers, totalTimeSpent);

            if (response.success && response.data) {
              // Capture the API response data for display
              console.log('✅ Successfully submitted answers for stats display:', response.data);
              setLatestApiResults({
                scoreOutOf20: response.data.totalScore20,
                percentageScore: response.data.score,
                timeSpent: response.data.timeSpent || totalTimeSpent,
                answeredQuestions: response.data.correctAnswersCount + response.data.incorrectAnswersCount,
                correctAnswersCount: response.data.correctAnswersCount,
                incorrectAnswersCount: response.data.incorrectAnswersCount,
                unansweredCount: response.data.unansweredCount,
                totalQuestions: response.data.totalQuestions,
                status: response.data.status || 'IN_PROGRESS',
                sessionId: response.data.sessionId || currentSessionId
              });
            } else {
              throw new Error(response.error || 'Failed to submit answers');
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to submit answers for stats display:', error);
      setStatsError(error instanceof Error ? error.message : 'Failed to submit answers');
      // Continue to show stats even if submission fails
    }

    // Show the stats overlay
    setShowStatsOverlay(true);
  };

  const handleCloseStatsOverlay = () => {
    setShowStatsOverlay(false);
  };

  const getSessionTypeBadge = (type: string) => {
    const variants = {
      training: 'bg-primary/10 text-primary-foreground border-primary/20',
      exam: 'bg-primary/10 text-primary border-primary/20',
      residency: 'bg-accent/10 text-accent-foreground border-accent/20',
      remedial: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
    };
    return variants[type as keyof typeof variants] || 'bg-muted/10 text-muted-foreground border-muted/20';
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card lg:bg-card/50 md:backdrop-blur-sm md:supports-[backdrop-filter]:bg-card lg:md:supports-[backdrop-filter]:bg-card/50 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="gap-1 sm:gap-2 flex-shrink-0"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Questions</span>
            </Button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-1 flex items-center gap-1 sm:gap-2">
              </div>
            </div>
          </div>



          {/* Right Section */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* ClientStorageIndicator removed to avoid iterating all sessions */}

            {/* API Status Indicator - Hidden on mobile */}
            <div className="hidden lg:block">
              <ApiStatusIndicator />
            </div>

            {/* Timer */}
            {(session.settings?.showTimer ?? true) && (
              (() => {
                const timeLimit = session.timeLimit; // in minutes
                const totalTimeSeconds = timer.totalTime;
                const timeLimitSeconds = timeLimit ? timeLimit * 60 : null;
                const timeRemaining = timeLimitSeconds ? Math.max(0, timeLimitSeconds - totalTimeSeconds) : null;
                const isTimeUp = timeLimitSeconds && totalTimeSeconds >= timeLimitSeconds;
                const isNearEnd = timeLimitSeconds && timeRemaining && timeRemaining <= 300; // 5 minutes warning

                return (
                  <div className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 ${isTimeUp ? 'bg-red-100 dark:bg-red-900/30' :
                    isNearEnd ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-muted/30'
                    }`}>
                    <Clock className={`h-3 w-3 sm:h-4 sm:w-4 ${isTimeUp ? 'text-red-600 dark:text-red-400' :
                      isNearEnd ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-muted-foreground'
                      }`} />
                    <span className={`font-mono font-medium tracking-wider text-xs sm:text-sm ${isTimeUp ? 'text-red-600 dark:text-red-400' :
                      isNearEnd ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-foreground'
                      }`}>
                      {timeLimit ? (
                        timeRemaining !== null ? formatTime(timeRemaining) : formatTime(totalTimeSeconds)
                      ) : (
                        formatTime(totalTimeSeconds)
                      )}
                    </span>
                    {timeLimit && (
                      <span className="text-xs text-muted-foreground">
                        / {formatTime(timeLimitSeconds || 0)}
                      </span>
                    )}
                  </div>
                );
              })()
            )}


            {/* Pause/Resume */}
            {/* Review-mode actions */}
            {(session.status === 'COMPLETED' || session.status === 'completed') ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/session/${apiState?.apiSessionId || state.apiSessionId || session.id}/results`)} className="gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Return to Results</span>
                </Button>
                {/* Per-question Edit button exists inside question components now */}
              </div>
            ) : (
              <>
                {(session.settings?.allowPause ?? true) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseResume}
                    className="gap-1 sm:gap-2 btn-modern focus-ring hover:bg-accent/50 px-2 sm:px-3"
                  >
                    {timer.isPaused ? (
                      <>
                        <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                )}

                {/* Sound Toggle */}
                <SoundToggle />

                {/* Exit Quiz */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setShowExitDialog(true)}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit</span>
                </Button>
              </>
            )}
          </div>
        </div>


      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Quiz Questions Sidebar */}
        <div className={cn(
          "border-r border-border/50 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col quiz-sidebar-container",
          // Background: solid on mobile/tablet, semi-transparent on desktop
          "bg-card lg:bg-card/50",
          // Desktop behavior
          "hidden lg:flex",
          state.sidebarOpen ? "lg:w-64" : "lg:w-0 lg:border-r-0",
          // Mobile behavior - overlay
          "lg:relative absolute inset-y-0 left-0 z-50",
          state.sidebarOpen ? "flex w-64 shadow-xl" : "hidden"
        )}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Questions</h3>
              {/* Close button for mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="lg:hidden p-1 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Scrollable Questions Container */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 quiz-questions-scrollbar quiz-questions-container">
              <div className="space-y-2 min-h-0">
                {session.questions.map((question, index) => {
                  const isCurrentQuestion = index === currentQuestionIndex;
                  // Use localAnswers from API context instead of session.userAnswers
                  const userAnswer = state.localAnswers?.[question?.id] || session.userAnswers?.[question?.id];
                  const isAnswered = !!userAnswer;

                  // Only show status if user has actually interacted with the question
                  // Check if answer was submitted (has selectedOptions, selectedAnswerIds, or selectedAnswerId) or if session is completed
                  const hasUserInteraction = isAnswered && (
                    userAnswer.selectedOptions?.length > 0 ||
                    userAnswer.selectedAnswerIds?.length > 0 ||
                    userAnswer.selectedAnswerId ||
                    userAnswer.textAnswer ||
                    session.status === 'COMPLETED' ||
                    session.status === 'completed'
                  );

                  // Determine if the answer is correct (only if user has interacted)
                  let isCorrect = null;
                  if (hasUserInteraction && userAnswer) {
                    // If we have the isCorrect field directly (set at submission time), use it
                    if (typeof userAnswer.isCorrect === 'boolean') {
                      isCorrect = userAnswer.isCorrect;
                    } else {
                      // Handle text questions (QROC)
                      if (userAnswer.textAnswer && !userAnswer.selectedOptions && !userAnswer.selectedAnswerIds && !userAnswer.selectedAnswerId) {
                        const correctAnswers = question.correctAnswers || [];
                        if (correctAnswers.length > 0) {
                          // Simple keyword matching for text answers
                          const userText = userAnswer.textAnswer.toLowerCase().trim();
                          isCorrect = correctAnswers.some(correctAnswer => {
                            const keywords = correctAnswer.toLowerCase().split(/[\s,;]+/);
                            const matchedKeywords = keywords.filter(keyword =>
                              keyword.length > 2 && userText.includes(keyword)
                            );
                            return matchedKeywords.length >= Math.ceil(keywords.length * 0.6);
                          });
                        }
                      } else {
                        // Handle multiple choice questions
                        // Get selected answer IDs from different possible formats
                        let selectedAnswerIds: string[] = [];

                        if (userAnswer.selectedOptions?.length > 0) {
                          selectedAnswerIds = userAnswer.selectedOptions.map(String);
                        } else if (userAnswer.selectedAnswerIds?.length > 0) {
                          selectedAnswerIds = userAnswer.selectedAnswerIds.map(String);
                        } else if (userAnswer.selectedAnswerId) {
                          selectedAnswerIds = [String(userAnswer.selectedAnswerId)];
                        }

                        // Get correct answer IDs
                        const correctOptions = (question.options || question.answers || [])
                          .filter((opt: any) => opt.isCorrect)
                          .map((opt: any) => String(opt.id));

                        if (correctOptions.length > 0 && selectedAnswerIds.length > 0) {
                          // For multiple choice: all selected must be correct and all correct must be selected
                          const selectedSet = new Set(selectedAnswerIds);
                          const correctSet = new Set(correctOptions);
                          isCorrect = selectedSet.size === correctSet.size &&
                            [...selectedSet].every(id => correctSet.has(id));
                        }
                      }
                    }
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        goToQuestion(index);
                        // Auto-close sidebar on mobile after selection
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between",
                        isCurrentQuestion
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : hasUserInteraction
                            ? isCorrect === true
                              ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20"
                              : isCorrect === false
                                ? "bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
                                : "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span>Question {index + 1}</span>
                      {hasUserInteraction && !isCurrentQuestion && (
                        <div className="flex items-center ml-2">
                          {isCorrect === true ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : isCorrect === false ? (
                            <XIcon className="h-4 w-4 text-red-600" />
                          ) : (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {state.sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={toggleSidebar}
          />
        )}

        {/* Question Area - Enable scrolling */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/10 min-w-0">
          {/* Question Content - Allow scrolling */}
          <div className="flex-1 overflow-hidden">
            <QuestionDisplay />
          </div>

          {/* Enhanced Navigation Footer */}
          <EnhancedQuizFooter
            currentQuestionIndex={currentQuestionIndex}
            totalQuestions={totalQuestions}
            answeredQuestions={answeredQuestions}
            onPrevious={previousQuestion}
            onNext={() => {
              // Allow navigation to next question without requiring an answer
              nextQuestion();
            }}
            onSubmit={async () => {
              // Prevent duplicate submissions
              if (isFinishing) {
                console.log('⚠️ Finish button: Already finishing, ignoring duplicate click');
                return;
              }

              setIsFinishing(true);

              try {
                // Use the EXACT same logic as the "Show Results" button in Exit dialog
                const currentApiSessionId = apiState?.apiSessionId;

                if (!currentApiSessionId) {
                  // For non-API sessions, just navigate to results
                  const sessionId = session?.id;
                  if (sessionId) {
                    router.push(`/session/${sessionId}/results`);
                  } else {
                    router.push('/student/practice');
                  }
                  return;
                }

                // Step 1: Use the EXACT same answer collection logic as pause button
                console.log('🔄 Finish button: Collecting all answers using pause logic...');

                // CRITICAL FIX: Use the same comprehensive answer collection as pause
                // Start with userAnswers (same as pause logic)
                const userAnswers = session?.userAnswers || {};
                let allAnswers: Record<string, any> = { ...userAnswers };

                // Also merge localAnswers from API context
                Object.entries(apiState.localAnswers || {}).forEach(([questionId, localAnswer]) => {
                  if (!allAnswers[questionId] || !allAnswers[questionId].selectedOptions?.length) {
                    allAnswers[questionId] = {
                      questionId,
                      selectedOptions: localAnswer.selectedOptions || (localAnswer.selectedAnswerId ? [String(localAnswer.selectedAnswerId)] : []),
                      selectedAnswerId: localAnswer.selectedAnswerId,
                      selectedAnswerIds: localAnswer.selectedAnswerIds,
                      textAnswer: localAnswer.textAnswer,
                      timeSpent: localAnswer.timeSpent || 0,
                      isCorrect: localAnswer.isCorrect
                    };
                    console.log(`📥 Added answer from localAnswers for question ${questionId}`);
                  }
                });

                // Step 2: Filter answers that have actual selections (same as pause logic)
                const answersToSubmit = Object.keys(allAnswers).filter(
                  questionId => {
                    const answer = allAnswers[questionId];
                    return answer && (answer.selectedOptions?.length || answer.textAnswer);
                  }
                );

                console.log(`📤 Finish button: Found ${answersToSubmit.length} answers to submit (using pause logic)`);
                console.log('🔍 Finish button: Answers found:', answersToSubmit.map(qId => ({
                  questionId: qId,
                  hasSelectedOptions: !!allAnswers[qId]?.selectedOptions?.length,
                  hasTextAnswer: !!allAnswers[qId]?.textAnswer
                })));

                // Step 3: Convert to API format using the EXACT same logic as pause
                if (answersToSubmit.length > 0) {
                  console.log(`📤 Submitting ${answersToSubmit.length} answers using pause logic...`);

                  // Convert answers to API format (EXACT same logic as pause)
                  const answersForSubmission = answersToSubmit.map(questionId => {
                    const answer = allAnswers[questionId];
                    return {
                      questionId: Number(questionId),
                      selectedAnswerId: answer.selectedOptions?.[0],
                      selectedAnswerIds: answer.selectedOptions,
                      textAnswer: answer.textAnswer,
                      timeSpent: answer.timeSpent || 0
                    };
                  });

                  // Build question type lookup (same as pause)
                  const questionTypeById: Record<number, string> = {};
                  (session.questions || []).forEach((q: any) => {
                    const qt = (q.questionType || q.type || '').toString().toUpperCase();
                    questionTypeById[Number(q.id)] = qt || 'SINGLE_CHOICE';
                  });

                  // Convert to API format (EXACT same logic as pause)
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
                      timeSpent: answer.timeSpent,
                    };
                  }).filter(entry => (
                    (entry.selectedAnswerId !== undefined && entry.selectedAnswerId !== null) ||
                    (Array.isArray(entry.selectedAnswerIds) && entry.selectedAnswerIds.length > 0) ||
                    (entry.textAnswer && String(entry.textAnswer).trim().length > 0)
                  ));

                  if (apiAnswers.length === 0) {
                    console.log('No answers to submit');
                  } else {
                    console.log(`📤 Submitting ${apiAnswers.length} answers for session ${currentApiSessionId}...`);
                    const totalTimeSpent = timer?.totalTime || 0;
                    const response = await QuizService.submitAnswersBulk(currentApiSessionId, apiAnswers, totalTimeSpent);

                    if (!response.success) {
                      throw new Error(response.error || 'Failed to submit answers');
                    }

                    console.log('✅ Successfully submitted all answers:', response.data);
                  }
                } else {
                  console.log('No answers to submit - no questions answered');
                }

                // Step 2: Update session status to COMPLETED
                console.log('🔄 Finish button: Updating session status to COMPLETED...');
                const statusUpdateSuccess = await SessionStatusManager.setCompleted(currentApiSessionId, {
                  showToast: false,
                  silent: true
                });

                if (!statusUpdateSuccess) {
                  console.warn('Failed to update session status to COMPLETED, but continuing to results');
                }

                // Step 3: Navigate to results page
                console.log('✅ Finish button: Successfully submitted answers and updated status, navigating to results...');
                router.push(`/session/${currentApiSessionId}/results`);

              } catch (error) {
                console.error('❌ Finish button: Failed to submit answers for results:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to submit answers';

                // Show error message with retry option
                toast.error(`Failed to submit quiz: ${errorMessage}`, {
                  description: 'Please try again or continue without submitting.',
                  action: {
                    label: 'Retry',
                    onClick: () => {
                      setIsFinishing(false);
                      setTimeout(() => {
                        const finishButton = document.querySelector('[data-finish-button]') as HTMLButtonElement;
                        if (finishButton && !finishButton.disabled) {
                          finishButton.click();
                        }
                      }, 100);
                    }
                  },
                  duration: 10000
                });
              } finally {
                setIsFinishing(false);
              }
            }}
            canGoBack={currentQuestionIndex > 0}
            canGoForward={currentQuestionIndex < totalQuestions - 1}
            isLastQuestion={currentQuestionIndex === totalQuestions - 1}
            hideSubmit
            isSubmitting={isFinishing}
          />
        </div>
      </div>

      {/* Pause Overlay (disabled in review mode) */}
      {timer.isPaused && !(session.status === 'COMPLETED' || session.status === 'completed') && (
        <div className="fixed inset-0 bg-background lg:bg-background/90 backdrop-blur-md z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse-soft">
                    <PauseCircle size={40} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Quiz Paused</h2>
                </div>
              </div>

              {/* Statistics Display */}
              <QuizStatisticsDisplay
                session={session}
                timer={timer}
                localAnswers={state.localAnswers}
                showTitle={false}
                className="max-w-3xl mx-auto"
                apiSessionResults={apiSessionResults}
                statsError={statsError}
              />

              {/* Resume Button */}
              <div className="text-center">
                <Button
                  onClick={resumeQuiz}
                  size="lg"
                  className="gap-3 btn-modern focus-ring bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
                >
                  <Play className="h-5 w-5" />
                  Resume Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overlay (similar to pause overlay) */}
      {showStatsOverlay && !(session.status === 'COMPLETED' || session.status === 'completed') && (
        <div className="fixed inset-0 bg-background lg:bg-background/90 backdrop-blur-md z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-4xl space-y-8 animate-fade-in-up">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-pulse-soft">
                    <span className="text-4xl">📊</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Quiz Statistics</h2>
                </div>
              </div>

              {/* Statistics Display */}
              <QuizStatisticsDisplay
                session={session}
                timer={timer}
                localAnswers={state.localAnswers}
                showTitle={false}
                className="max-w-3xl mx-auto"
                apiSessionResults={apiSessionResults}
                statsError={statsError}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleCloseStatsOverlay}
                  variant="outline"
                  size="lg"
                  className="gap-3 btn-modern focus-ring px-8 py-3 text-lg"
                >
                  <X className="h-5 w-5" />
                  Close Stats
                </Button>
                <Button
                  onClick={() => {
                    handleCloseStatsOverlay();
                    setShowExitDialog(true);
                  }}
                  variant="outline"
                  size="lg"
                  className="gap-3 btn-modern focus-ring px-8 py-3 text-lg"
                >
                  <Home className="h-5 w-5" />
                  Exit Options
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Exit Dialog */}
      <EnhancedExitDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        session={session}
        timer={timer}
        localAnswers={state.localAnswers}
        apiSessionId={apiState?.apiSessionId || state.apiSessionId}
        apiSessionResults={apiSessionResults}
        onShowStats={handleShowStatsOverlay}
        statsError={statsError}
      />


    </div>
  );
}
