// @ts-nocheck
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lightbulb,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubjectAnalytics } from '@/types/api';

interface SubjectAnalyticsSectionProps {
  data: SubjectAnalytics[];
  loading?: boolean;
  error?: any;
}

export function SubjectAnalyticsSection({ data, loading, error }: SubjectAnalyticsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />; // Neutral
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600 dark:text-green-400';
    if (improvement < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 90) return { level: 'Excellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (accuracy >= 80) return { level: 'Good', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    if (accuracy >= 70) return { level: 'Average', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { level: 'Needs Work', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load subject analytics. Please try again.
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Subject Data Available</h3>
          <p className="text-muted-foreground mb-4">
            Complete some quizzes to see subject-specific analytics here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Subject Analytics</h2>
        <p className="text-muted-foreground">
          Detailed performance analysis across all subjects with personalized recommendations
        </p>
      </div>

      {/* Subject Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {data.map((subject) => {
          const performance = getPerformanceLevel(subject.accuracy);

          return (
            <Card key={subject.subjectId} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {subject.subjectName}
                  </CardTitle>
                  <Badge className={cn("text-xs", performance.bgColor, performance.color)}>
                    {performance.level}
                  </Badge>
                </div>
                <CardDescription>
                  {subject.totalSessions} sessions • Last activity: {formatDate(subject.lastActivity)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      Accuracy
                    </div>
                    <div className="text-2xl font-bold">
                      {subject.accuracy.toFixed(1)}%
                    </div>
                    <Progress value={subject.accuracy} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4" />
                      Average Score
                    </div>
                    <div className="text-2xl font-bold">
                      {subject.averageScore.toFixed(1)}%
                    </div>
                    <Progress value={subject.averageScore} className="h-2" />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {formatTime(subject.timeSpent)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time Spent
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {subject.questionsAnswered}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Questions
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={cn("text-lg font-semibold flex items-center justify-center gap-1", getImprovementColor(subject.improvement))}>
                      {getImprovementIcon(subject.improvement)}
                      {subject.improvement > 0 ? '+' : ''}{subject.improvement.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Improvement
                    </div>
                  </div>
                </div>

                {/* Strengths and Weaknesses */}
                {(subject.strengths?.length > 0 || subject.weaknesses?.length > 0) && (
                  <div className="space-y-4">
                    {subject.strengths && subject.strengths.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Strengths
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {subject.strengths.map((strength, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {subject.weaknesses && subject.weaknesses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          Areas for Improvement
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {subject.weaknesses.map((weakness, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                              {weakness}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {subject.recommendations && subject.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {subject.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            {recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Correct Answers: {subject.correctAnswers}/{subject.questionsAnswered}</span>
                    <span>Sessions: {subject.totalSessions}</span>
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Overall Subject Performance
          </CardTitle>
          <CardDescription>Summary of your performance across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {data.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Subjects Studied
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {(data.reduce((sum, subject) => sum + subject.averageScore, 0) / data.length).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Overall Average
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {data.reduce((sum, subject) => sum + subject.totalSessions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Sessions
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold">
                {formatTime(data.reduce((sum, subject) => sum + subject.timeSpent, 0))}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}