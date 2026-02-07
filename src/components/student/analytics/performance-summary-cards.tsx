// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock, 
  Award, 
  BookOpen,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalSessions: number;
  averageScore: number;
  totalTimeSpent: number;
  improvementTrend: number;
  weeklyGoalProgress: number;
  strongestSubject: string;
  weakestSubject: string;
  currentStreak: number;
}

interface PerformanceSummaryCardsProps {
  data: AnalyticsData;
  className?: string;
}

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

function CircularProgress({ 
  value, 
  size = 80, 
  strokeWidth = 8, 
  className,
  children 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Content in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function PerformanceSummaryCards({ data, className }: PerformanceSummaryCardsProps) {
  // Helper function to get trend icon and color
  const getTrendIndicator = (trend: number) => {
    if (trend > 0) {
      return {
        icon: TrendingUp,
        color: 'text-chart-2',
        bgColor: 'bg-chart-2/10',
        borderColor: 'border-chart-2/20',
        text: `+${trend}%`
      };
    } else if (trend < 0) {
      return {
        icon: TrendingDown,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        text: `${trend}%`
      };
    } else {
      return {
        icon: Minus,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        borderColor: 'border-muted/20',
        text: '0%'
      };
    }
  };

  const trendIndicator = getTrendIndicator(data.improvementTrend);
  const TrendIcon = trendIndicator.icon;

  // Calculate how many cards we'll show
  const hasTimeData = data.totalTimeSpent > 0;
  const cardCount = hasTimeData ? 4 : 3;

  return (
    <div className={cn(
      "grid gap-4 sm:gap-6",
      cardCount === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {/* Total Sessions Card */}
      <Card className="card-enhanced group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-chart-1" />
            Total Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-chart-1 animate-counter-up">
                {data.totalSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                sessions completed
              </p>
            </div>
            <CircularProgress value={Math.min((data.totalSessions / 50) * 100, 100)} size={60} strokeWidth={6}>
              <BookOpen className="h-5 w-5 text-chart-1" />
            </CircularProgress>
          </div>
        </CardContent>
      </Card>

      {/* Average Score Card */}
      <Card className="card-enhanced group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-chart-2" />
            Average Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-chart-2 animate-counter-up">
                {data.averageScore}%
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    trendIndicator.bgColor,
                    trendIndicator.color,
                    trendIndicator.borderColor
                  )}
                >
                  <TrendIcon className="h-3 w-3 mr-1" />
                  {trendIndicator.text}
                </Badge>
              </div>
            </div>
            <CircularProgress value={data.averageScore} size={60} strokeWidth={6}>
              <span className="text-sm font-bold text-chart-2">
                {data.averageScore}%
              </span>
            </CircularProgress>
          </div>
        </CardContent>
      </Card>

      {/* Time Spent Card - Only show if we have real time data */}
      {data.totalTimeSpent > 0 && (
        <Card className="card-enhanced group">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-chart-3" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-chart-3 animate-counter-up">
                  {Math.round(data.totalTimeSpent / 60)}h
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totalTimeSpent} minutes total
                </p>
              </div>
              <CircularProgress
                value={Math.min((data.totalTimeSpent / 1800) * 100, 100)}
                size={60}
                strokeWidth={6}
              >
                <Clock className="h-5 w-5 text-chart-3" />
              </CircularProgress>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Rating Card */}
      <Card className="card-enhanced group">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-chart-4" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-chart-4 animate-counter-up">
                {data.averageScore >= 80 ? 'Excellent' : 
                 data.averageScore >= 70 ? 'Good' : 
                 data.averageScore >= 60 ? 'Fair' : 'Needs Work'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                overall rating
              </p>
            </div>
            <CircularProgress value={data.averageScore} size={60} strokeWidth={6}>
              <Award className="h-5 w-5 text-chart-4" />
            </CircularProgress>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
