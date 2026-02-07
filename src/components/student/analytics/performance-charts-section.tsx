// @ts-nocheck
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Target,
  Clock,
  Award,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsOverview } from '@/types/api';

interface PerformanceChartsSectionProps {
  data: AnalyticsOverview;
  showDetailed?: boolean;
}

export function PerformanceChartsSection({ data, showDetailed = false }: PerformanceChartsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  // Calculate trend indicators
  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4" />; // Neutral
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600 dark:text-green-400';
    if (current < previous) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Weekly Trends Chart */}
      {data.weeklyTrends && data.weeklyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Performance Trends
            </CardTitle>
            <CardDescription>Your performance over the last few weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="grid gap-4">
                {data.weeklyTrends.slice(-8).map((week, index) => {
                  const maxScore = Math.max(
                    ...data.weeklyTrends.map(w => (typeof w.averageScore === 'number' ? w.averageScore : 0))
                  );
                  const weekAvg = typeof week.averageScore === 'number' ? week.averageScore : 0;
                  const barWidth = maxScore > 0 ? (weekAvg / maxScore) * 100 : 0;

                  return (
                    <div key={week.week} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Week {week.week}</span>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{week.sessionsCount} sessions</span>
                          <span>{(typeof week.averageScore === 'number' ? week.averageScore : 0).toFixed(1)}%</span>
                          <span>{formatTime(week.totalTime)}</span>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-muted rounded-full h-3">
                          <div
                            className="bg-primary rounded-full h-3 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {(typeof week.averageScore === 'number' ? week.averageScore : 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Progress Overview */}
      {data.subjectProgress && data.subjectProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Subject Performance
            </CardTitle>
            <CardDescription>Your progress across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.subjectProgress.map((subject, index) => (
                <div key={subject.subjectId} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{subject.subjectName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {subject.completedQuestions}/{subject.totalQuestions} questions completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {(typeof subject.accuracy === 'number' ? subject.accuracy : 0).toFixed(1)}%
                      </div>
                      <Badge variant={(typeof subject.accuracy === 'number' ? subject.accuracy : 0) >= 70 ? "default" : "secondary"} className="text-xs">
                        {subject.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>{(typeof subject.progressPercentage === 'number' ? subject.progressPercentage : 0).toFixed(1)}%</span>
                    </div>
                    <Progress value={typeof subject.progressPercentage === 'number' ? subject.progressPercentage : 0} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Accuracy</span>
                    <span>{(typeof subject.accuracy === 'number' ? subject.accuracy : 0).toFixed(1)}%</span>
                  </div>
                  <Progress value={typeof subject.accuracy === 'number' ? subject.accuracy : 0} className="h-2" />
                  {showDetailed && (
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Avg. Time: {subject.averageTime}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Last: {formatDate(subject.lastActivity)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Progress */}
      {data.monthlyProgress && data.monthlyProgress.length > 0 && showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Progress
            </CardTitle>
            <CardDescription>Your learning progress over recent months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.monthlyProgress.slice(-6).map((month, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Month {index + 1}</h4>
                      <Badge variant="outline">{month.sessionsCompleted} sessions</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Average Score</span>
                        <span className="font-medium">{(typeof month.averageScore === 'number' ? month.averageScore : 0).toFixed(1)}%</span>
                      </div>
                      <Progress value={month.averageScore || 0} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {month.totalTimeSpent && `${formatTime(month.totalTimeSpent)} studied`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Patterns */}
      {data.studyPatterns && data.studyPatterns.length > 0 && showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Study Patterns
            </CardTitle>
            <CardDescription>Insights into your learning habits and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {data.studyPatterns.map((pattern, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-2">
                    <h4 className="font-medium">{pattern.title || `Pattern ${index + 1}`}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pattern.description || 'Study pattern analysis'}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-primary" />
                      <span>Frequency: {pattern.frequency || 'Regular'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {typeof data.completionRate === 'number' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {(typeof data.completionRate === 'number' ? data.completionRate : 0).toFixed(1)}%
              </div>
              <Progress value={typeof data.completionRate === 'number' ? data.completionRate : 0} className="h-2" />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {data.currentStreak} days
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {data.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {formatTime(data.timeSpent)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {data.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {(typeof data.averageScore === 'number' ? data.averageScore : 0).toFixed(1)}%
            </div>
            <Progress value={typeof data.averageScore === 'number' ? data.averageScore : 0} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}