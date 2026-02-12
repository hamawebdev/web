// @ts-nocheck
'use client';

import React from 'react';
import { cn } from '@/lib/utils';


interface QuizStatisticsProps {
  session: any;
  timer: any;
  localAnswers?: Record<number, any>;
  className?: string;
  showTitle?: boolean;
  apiSessionResults?: {
    scoreOutOf20?: number;
    percentageScore?: number;
    timeSpent?: number;
    answeredQuestions?: number;
    totalQuestions?: number;
    status?: string;
    sessionId?: number;
    correctAnswersCount?: number;
    incorrectAnswersCount?: number;
    unansweredQuestionsCount?: number;
    unansweredCount?: number;
  };
  statsError?: string | null;
}

export function QuizStatisticsDisplay({
  session,
  timer,
  localAnswers,
  className = '',
  showTitle = true,
  apiSessionResults,
  statsError
}: QuizStatisticsProps) {
  // Calculate statistics - prioritize API response data when available, with fallbacks for errors
  const totalQuestions = apiSessionResults?.totalQuestions || session.totalQuestions || session.questions?.length || 0;

  // Use API response data first, then fall back to local calculations
  const answeredQuestions = apiSessionResults?.answeredQuestions ?? (
    session.questions?.filter((question: any) => {
      const answerId = Number(question.id);
      const answer = localAnswers?.[answerId] || session.userAnswers?.[String(question.id)];
      return answer && (answer.selectedOptions?.length || answer.selectedAnswerId || answer.selectedAnswerIds?.length || answer.textAnswer);
    }).length || 0
  );

  const unansweredQuestions = totalQuestions - answeredQuestions;
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Calculate time spent - prioritize API response data
  const totalTimeSpent = (apiSessionResults?.timeSpent ?? timer?.totalTime) || 0;
  const averageTimePerQuestion = answeredQuestions > 0 ? Math.round(totalTimeSpent / answeredQuestions) : 0;

  // API-specific data with fallbacks
  const scoreOutOf20 = apiSessionResults?.scoreOutOf20;
  const percentageScore = apiSessionResults?.percentageScore;
  const sessionStatus = apiSessionResults?.status;

  // Check if we have valid API data or if there was an error
  const hasValidApiData = apiSessionResults && (
    scoreOutOf20 !== undefined ||
    percentageScore !== undefined ||
    apiSessionResults.answeredQuestions !== undefined
  );
  const showApiError = statsError && !hasValidApiData;

  // Use backend count fields directly - no client-side calculations
  // Prioritize unansweredCount from /submit-answer response
  const correct = apiSessionResults?.correctAnswersCount ?? session.correctAnswersCount ?? 0;
  const incorrect = apiSessionResults?.incorrectAnswersCount ?? session.incorrectAnswersCount ?? 0;
  const unansweredFromBackend = apiSessionResults?.unansweredCount ?? apiSessionResults?.unansweredQuestionsCount ?? session.unansweredCount ?? session.unansweredQuestionsCount ?? 0;

  console.log('📊 Using backend count data in stats display:', {
    correctAnswersCount: correct,
    incorrectAnswersCount: incorrect,
    unansweredCount: unansweredFromBackend,
    source: apiSessionResults ? 'apiSessionResults' : 'session'
  });

  // Prepare data for SessionStatsChart - pass backend count fields directly
  const chartData = totalQuestions > 0 ? {
    totalQuestions,
    answeredQuestions,
    // Pass backend count fields directly (preferred)
    correctAnswersCount: correct,
    incorrectAnswersCount: incorrect,
    unansweredQuestionsCount: unansweredFromBackend,
    // Legacy fields for fallback
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    scoreOutOf20,
    percentageScore,
    timeSpent: totalTimeSpent,
    status: sessionStatus
  } : null;

  // Format time helper
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get performance level
  const getPerformanceLevel = () => {
    if (progressPercentage >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/20' };
    if (progressPercentage >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/20' };
    if (progressPercentage >= 40) return { level: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/20' };
    return { level: 'Getting Started', color: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-950/20' };
  };

  const performance = getPerformanceLevel();

  return (
    <div className={cn('space-y-6', className)}>
      {showTitle && (
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">Quiz Statistics</h3>
          <p className="text-muted-foreground">Your current progress and performance</p>
        </div>
      )}

      {/* Circular Chart - Show when we have data */}
      {/* Chart removed as component is missing */}

      {/* Error Display - Show when submission failed */}
      {/* Error Display - Show when submission failed */}
      {showApiError && (
        <div className="p-4 text-center border rounded-lg border-destructive/50 bg-destructive/10">
          <p className="font-semibold text-destructive">Session Statistics Error</p>
          <p className="text-sm text-destructive-foreground">{statsError || 'Failed to load current statistics.'}</p>
        </div>
      )}



    </div>
  );
}
