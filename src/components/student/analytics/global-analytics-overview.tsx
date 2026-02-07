// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Award,
  BookOpen,
  Users,
  Zap,
  TrendingDown,
  Minus,
  Calendar,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsOverview as AnalyticsOverviewType } from '@/types/api';
import { useQuizSessions } from '@/hooks/use-quiz-api';
import { useSessionResults } from '@/hooks/use-session-analysis';

// Import sub-components
import { PerformanceSummaryCards } from './performance-summary-cards';

interface AnalyticsOverviewProps {
  data: AnalyticsOverviewType;
  className?: string;
}

// Export both the new component and keep the old one for backward compatibility
export function AnalyticsOverview({ data, className }: AnalyticsOverviewProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {data.completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        {/* Average Score */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageScore.toFixed(1)}%</div>
            <Progress value={data.averageScore} className="mt-2" />
          </CardContent>
        </Card>

        {/* Time Spent */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(data.timeSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Total study time
            </p>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Longest: {data.longestStreak} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest quiz and exam sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.type === 'EXAM' ? 'bg-chart-3/20' : 'bg-primary/20'
                    )}>
                      {activity.type === 'EXAM' ? (
                        <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.completedAt)} • {activity.questionsCount} questions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={activity.accuracy && activity.accuracy >= 70 ? "default" : "secondary"}>
                      {activity.accuracy ? `${activity.accuracy.toFixed(1)}%` : 'N/A'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {data.achievements.slice(0, 4).map((achievement, index) => (
                <div key={achievement.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(achievement.unlockedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface GlobalAnalyticsOverviewProps {
  className?: string;
}

export function GlobalAnalyticsOverview({ className }: GlobalAnalyticsOverviewProps) {
  const {
    sessions: completedSessions,
    loading: sessionsLoading,
    error: sessionsError
  } = useQuizSessions({
    status: 'COMPLETED',
    limit: 50, // Get more sessions for better analytics
    // Add cache busting to ensure fresh data
    _t: Date.now()
  });

  const {
    data: sessionResults,
    loading: resultsLoading,
    error: resultsError
  } = useSessionResults({
    page: 1,
    limit: 50
  });

  const [analyticsData, setAnalyticsData] = useState({
    totalSessions: 0,
    averageScore: 0,
    totalTimeSpent: 0,
    improvementTrend: 0,
    weeklyGoalProgress: 0,
    strongestSubject: '',
    weakestSubject: '',
    currentStreak: 0
  });

  // Process analytics data
  useEffect(() => {
    if (completedSessions && sessionResults) {
      const allSessions = Array.isArray(completedSessions) ? completedSessions : [];

      // Debug: Log session data in GlobalAnalyticsOverview (uncomment for debugging)
      // if (allSessions.length > 0) {
      //   console.log('🔍 GlobalAnalytics Debug - Raw sessions:', allSessions.slice(0, 3));
      // }

      // Ensure we only process completed sessions - filter client-side as backup
      const sessions = allSessions.filter(session => {
        // Be very strict about what constitutes a completed session
        const hasCompletedStatus = session.status === 'COMPLETED' || session.status === 'completed';
        const hasValidScore = session.score !== undefined && session.score !== null && session.score >= 0;
        const hasValidPercentage = session.percentage !== undefined && session.percentage !== null && session.percentage >= 0;
        const hasCompletedAt = session.completedAt !== undefined && session.completedAt !== null;

        // A session is considered completed if:
        // 1. It has a COMPLETED status, AND
        // 2. It has either a valid score OR percentage, AND
        // 3. It has a completion timestamp
        return hasCompletedStatus && (hasValidScore || hasValidPercentage) && hasCompletedAt;
      });

      // Debug: Log filtered results (uncomment for debugging)
      // console.log('🔍 GlobalAnalytics Debug - Filtered sessions:', sessions.length, 'out of', allSessions.length);

      const results = Array.isArray(sessionResults) ? sessionResults : [];
      
      // Calculate basic metrics
      const totalSessions = sessions.length;
      const totalScore = sessions.reduce((sum, session) => sum + (session.percentage || 0), 0);
      const averageScore = totalSessions > 0 ? totalScore / totalSessions : 0;
      
      // Calculate total time spent from real session data
      const totalTimeSpent = sessions.reduce((sum, session) => {
        const sessionTime = session.duration ? Math.round(session.duration / 60) : // Convert seconds to minutes
                           session.timeSpent ? Math.round(session.timeSpent / 60) : // Convert seconds to minutes
                           0; // No time data available
        return sum + sessionTime;
      }, 0);
      
      // Calculate improvement trend (compare recent vs older sessions)
      let improvementTrend = 0;
      if (sessions.length >= 4) {
        const recentSessions = sessions.slice(-2);
        const olderSessions = sessions.slice(0, 2);
        
        const recentAvg = recentSessions.reduce((sum, s) => sum + (s.percentage || 0), 0) / recentSessions.length;
        const olderAvg = olderSessions.reduce((sum, s) => sum + (s.percentage || 0), 0) / olderSessions.length;
        
        improvementTrend = recentAvg - olderAvg;
      }
      
      // Calculate weekly goal progress from real data
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const sessionsThisWeek = sessions.filter(session => {
        const sessionDate = new Date(session.completedAt || session.createdAt);
        return sessionDate >= weekAgo;
      }).length;
      const weeklyGoalProgress = Math.min((sessionsThisWeek / 5) * 100, 100); // Assume goal of 5 sessions per week

      // Get subjects from real data if available
      const strongestSubject = sessions[0]?.strongestSubject || null;
      const weakestSubject = sessions[0]?.weakestSubject || null;

      // Calculate current streak from real data
      const currentStreak = sessions[0]?.currentStreak || 0;
      
      setAnalyticsData({
        totalSessions,
        averageScore: Math.round(averageScore),
        totalTimeSpent,
        improvementTrend: Math.round(improvementTrend * 10) / 10,
        weeklyGoalProgress: Math.round(weeklyGoalProgress),
        strongestSubject,
        weakestSubject,
        currentStreak
      });
    }
  }, [completedSessions, sessionResults]);

  const isLoading = sessionsLoading || resultsLoading;
  const hasError = sessionsError || resultsError;

  // Error state
  if (hasError && !isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Performance Overview
          </h2>
          <p className="text-muted-foreground">
            Your learning progress and key performance indicators
          </p>
        </div>

        <Card className="border-destructive/20">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">
              <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
            <p className="text-muted-foreground mb-4">
              {sessionsError || resultsError || 'There was an error loading your performance data.'}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="btn-modern"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Performance Overview
        </h2>
        <p className="text-muted-foreground">
          Your learning progress and key performance indicators
        </p>
      </div>

      {/* Performance Summary Cards */}
      <PerformanceSummaryCards data={analyticsData} />
      

    </div>
  );
}
