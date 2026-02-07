// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Home,
  BookOpen,
  Star,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useApiQuiz } from './quiz-api-context';
import { useQuizSessions } from '@/hooks/use-quiz-api';
import { cn } from '@/lib/utils';

// Enhanced Quiz Results Component with API Integration
export function ApiQuizResults() {
  const router = useRouter();
  const { state } = useApiQuiz();
  const { session, timer } = state;
  
  // Fetch recent quiz sessions for comparison
  const { sessions: recentSessions, loading: sessionsLoading } = useQuizSessions({
    status: 'COMPLETED',
    limit: 5,
  });

  // Calculate results
  const totalQuestions = session.totalQuestions;
  const answeredQuestions = Object.keys(session.userAnswers).length;
  const correctAnswers = Object.values(session.userAnswers).filter(
    (answer: any) => answer.isCorrect === true
  ).length;
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
  // Prefer API-provided timing from session.answers[].timeSpent, fallback to client timer
  const apiAnswers: any[] = Array.isArray(session.answers)
    ? session.answers
    : (Array.isArray(session?.data?.answers) ? session.data.answers : []);
  const apiTotalTime = apiAnswers.reduce((sum, a) => sum + (typeof a?.timeSpent === 'number' ? a.timeSpent : 0), 0);
  const timeSpent = apiTotalTime > 0 ? apiTotalTime : timer.totalTime;
  const averageTimePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

  // Performance analysis
  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (accuracy >= 80) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (accuracy >= 70) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (accuracy >= 60) return { level: 'Below Average', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const performance = getPerformanceLevel(accuracy);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  // Calculate improvement from recent sessions
  const getImprovementTrend = () => {
    if (!recentSessions || recentSessions.length < 2) return null;
    
    // This would be calculated based on actual API data
    // For now, we'll simulate it
    const previousAccuracy = 75; // Would come from API
    const improvement = accuracy - previousAccuracy;
    
    return {
      improvement,
      isImproving: improvement > 0,
      previousAccuracy,
    };
  };

  const trend = getImprovementTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-muted-foreground">
            {session.title} • {session.subject}
          </p>
        </div>

        {/* Main Results Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Results
            </CardTitle>
            <CardDescription>
              Performance summary for this quiz session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Accuracy */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round(accuracy)}%
                </div>
                <div className="text-sm text-muted-foreground mb-3">Accuracy</div>
                <Badge className={cn('text-xs', performance.bgColor, performance.color)}>
                  {performance.level}
                </Badge>
              </div>

              {/* Score */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground mb-3">Correct Answers</div>
                <div className="flex justify-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600">{correctAnswers} correct</span>
                </div>
              </div>

              {/* Time */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatTime(timeSpent)}
                </div>
                <div className="text-sm text-muted-foreground mb-3">Total Time</div>
                <div className="flex justify-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-blue-600">
                    Avg per question: {formatTime(averageTimePerQuestion)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(accuracy)}%</span>
              </div>
              <Progress value={accuracy} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Strengths & Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {accuracy >= 80 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-700">Strong Performance</div>
                    <div className="text-sm text-muted-foreground">
                      Excellent accuracy rate of {Math.round(accuracy)}%
                    </div>
                  </div>
                </div>
              )}

              {averageTimePerQuestion <= 60 && (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-700">Good Time Management</div>
                    <div className="text-sm text-muted-foreground">
                      Efficient answering with {Math.round(averageTimePerQuestion)}s per question
                    </div>
                  </div>
                </div>
              )}

              {accuracy < 70 && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-700">Focus Area</div>
                    <div className="text-sm text-muted-foreground">
                      Consider reviewing {session.subject} concepts
                    </div>
                  </div>
                </div>
              )}

              {averageTimePerQuestion > 120 && (
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-orange-700">Time Management</div>
                    <div className="text-sm text-muted-foreground">
                      Try to answer more quickly to improve efficiency
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trend ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Previous Session</span>
                    <span className="font-medium">{Math.round(trend.previousAccuracy)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Session</span>
                    <span className="font-medium">{Math.round(accuracy)}%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    {trend.isImproving ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 font-medium">
                          +{Math.round(trend.improvement)}% improvement
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                        <span className="text-red-600 font-medium">
                          {Math.round(trend.improvement)}% change
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Complete more quizzes to see your progress trend</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        {accuracy >= 90 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Achievement Unlocked!
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Excellence Award - Scored 90% or higher
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Review: go to detailed results page */}
          <Button
            onClick={() => router.push(`/session/${state.apiSessionId}/results`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Review Results
          </Button>

          {/* Review: detailed review of answers and explanations */}
          <Button
            onClick={() => router.push(`/session/${state.apiSessionId}/review`)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Review Answers
          </Button>

          {/* Practice More or Exam Create based on session type */}
          <Button
            variant="outline"
            onClick={() => {
              const t = (session?.type || session?.sessionType || '').toString().toUpperCase();
              if (t === 'EXAM') router.push('/student/exams/create');
              else router.push('/student/practice/create');
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {((session?.type || session?.sessionType || '').toString().toUpperCase() === 'EXAM') ? 'New Exam' : 'Practice More'}
          </Button>

          {/* View All Sessions: route per type */}
          <Button
            variant="outline"
            onClick={() => {
              const t = (session?.type || session?.sessionType || '').toString().toUpperCase();
              if (t === 'EXAM') router.push('/student/exams');
              else router.push('/student/practice');
            }}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            View All Sessions
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/student/dashboard')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* API Sync Status */}
        {state.apiSessionId && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Results synced to your account
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
