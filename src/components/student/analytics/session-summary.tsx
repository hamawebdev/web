// @ts-nocheck
'use client';

import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

// Circular Progress Component
interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  color?: string;
}

function CircularProgress({
  value,
  size = 60,
  strokeWidth = 6,
  className,
  children,
  color = "hsl(var(--primary))"
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
          stroke={color}
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
import { 
  Target,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionSummaryProps {
  session: any; // Quiz session data
  questionsCount: number;
  estimatedDuration: number | null;
  className?: string;
}

export function SessionSummary({
  session,
  questionsCount,
  estimatedDuration,
  className
}: SessionSummaryProps) {

  // Get real duration from session data
  const duration = session.duration ? Math.round(session.duration / 60) : // Convert seconds to minutes
                   session.timeSpent ? Math.round(session.timeSpent / 60) : // Convert seconds to minutes
                   estimatedDuration; // Fallback to passed duration (can be null)
  
  // Get score color based on percentage
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-chart-2';
    if (percentage >= 70) return 'text-chart-3';
    if (percentage >= 60) return 'text-chart-5';
    return 'text-destructive';
  };

  // Get performance badge
  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) {
      return {
        text: 'Excellent',
        className: 'bg-chart-2/10 text-chart-2 border-chart-2/20'
      };
    } else if (percentage >= 80) {
      return {
        text: 'Good',
        className: 'bg-chart-3/10 text-chart-3 border-chart-3/20'
      };
    } else if (percentage >= 70) {
      return {
        text: 'Fair',
        className: 'bg-chart-5/10 text-chart-5 border-chart-5/20'
      };
    } else if (percentage >= 60) {
      return {
        text: 'Needs Work',
        className: 'bg-destructive/10 text-destructive border-destructive/20'
      };
    } else {
      return {
        text: 'Poor',
        className: 'bg-destructive/10 text-destructive border-destructive/20'
      };
    }
  };

  // Get improvement trend from API data only - no calculations
  const getTrendFromAPI = () => {
    // Only show trend if we have real trend data from the API
    if (session.improvementTrend !== undefined && session.improvementTrend !== null) {
      const trend = session.improvementTrend;
      if (trend > 2) {
        return {
          icon: TrendingUp,
          color: 'text-chart-2',
          text: `+${trend}%`,
          label: 'Improving'
        };
      } else if (trend < -2) {
        return {
          icon: TrendingDown,
          color: 'text-destructive',
          text: `${trend}%`,
          label: 'Declining'
        };
      } else {
        return {
          icon: Minus,
          color: 'text-muted-foreground',
          text: `${trend}%`,
          label: 'Stable'
        };
      }
    }

    // No trend data available - don't show trend
    return null;
  };

  const performanceBadge = getPerformanceBadge(session.percentage || 0);
  const trend = getTrendFromAPI();
  const TrendIcon = trend?.icon;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Key Metrics Row - Circular Progress Indicators */}
      <div className={cn(
        "grid gap-4 sm:gap-6",
        // Adjust grid columns based on available data
        duration && trend ? "grid-cols-2 sm:grid-cols-4" :
        duration || trend ? "grid-cols-2 sm:grid-cols-3" :
        "grid-cols-2"
      )}>
        {/* Score Circle */}
        <div className="flex flex-col items-center space-y-2">
          <CircularProgress
            value={session.percentage || 0}
            size={70}
            strokeWidth={5}
            color={session.percentage >= 80 ? "#10b981" : // Green
                   session.percentage >= 70 ? "#3b82f6" : // Blue
                   session.percentage >= 60 ? "#f59e0b" : // Amber
                   "#ef4444"} // Red
          >
            <div className="text-center">
              <div className="text-sm font-bold" style={{
                color: session.percentage >= 80 ? "#10b981" : // Green
                       session.percentage >= 70 ? "#3b82f6" : // Blue
                       session.percentage >= 60 ? "#f59e0b" : // Amber
                       "#ef4444" // Red
              }}>
                {session.percentage || 0}%
              </div>
            </div>
          </CircularProgress>
          <div className="text-xs text-muted-foreground text-center">
            <Target className="h-3 w-3 inline mr-1" />
            Score
          </div>
          <div className="text-xs text-muted-foreground">
            {session.score || 0}/{questionsCount}
          </div>
        </div>

        {/* Duration Circle - Only show if we have real duration data */}
        {duration && (
          <div className="flex flex-col items-center space-y-2">
            <CircularProgress
              value={Math.min((duration / 60) * 100, 100)} // Normalize to 60 minutes max
              size={70}
              strokeWidth={5}
              color="#06b6d4" // Cyan
            >
              <div className="text-center">
                <div className="text-sm font-bold" style={{ color: "#06b6d4" }}>
                  {duration}m
                </div>
              </div>
            </CircularProgress>
            <div className="text-xs text-muted-foreground text-center">
              <Clock className="h-3 w-3 inline mr-1" />
              Duration
            </div>
            <div className="text-xs text-muted-foreground">
              {questionsCount > 0 ? Math.round(duration / questionsCount * 10) / 10 : 0}m/q
            </div>
          </div>
        )}

        {/* Questions Circle */}
        <div className="flex flex-col items-center space-y-2">
          <CircularProgress
            value={questionsCount > 0 ? ((session.score || 0) / questionsCount) * 100 : 0}
            size={70}
            strokeWidth={5}
            color="#8b5cf6" // Purple
          >
            <div className="text-center">
              <div className="text-sm font-bold" style={{ color: "#8b5cf6" }}>
                {session.score || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                /{questionsCount}
              </div>
            </div>
          </CircularProgress>
          <div className="text-xs text-muted-foreground text-center">
            <BookOpen className="h-3 w-3 inline mr-1" />
            Questions
          </div>
        </div>

        {/* Trend Circle - Only show if we have real trend data */}
        {trend && (
          <div className="flex flex-col items-center space-y-2">
            <CircularProgress
              value={Math.abs(parseFloat(trend.text.replace('%', '').replace('+', '')))}
              size={70}
              strokeWidth={5}
              color={trend.text.includes('+') ? "#10b981" : // Green for positive
                     trend.text.includes('-') ? "#ef4444" : // Red for negative
                     "#6b7280"} // Gray for neutral
            >
              <div className="text-center">
                <TrendIcon className="h-4 w-4" style={{
                  color: trend.text.includes('+') ? "#10b981" : // Green for positive
                         trend.text.includes('-') ? "#ef4444" : // Red for negative
                         "#6b7280" // Gray for neutral
                }} />
              </div>
            </CircularProgress>
            <div className="text-xs text-muted-foreground text-center">
              Trend
            </div>
            <div className="text-sm font-bold" style={{
              color: trend.text.includes('+') ? "#10b981" : // Green for positive
                     trend.text.includes('-') ? "#ef4444" : // Red for negative
                     "#6b7280" // Gray for neutral
            }}>
              {trend.text}
            </div>
            <div className="text-xs text-muted-foreground">
              {trend.label}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar and Performance Badge */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Performance</span>
          <Badge variant="outline" className={performanceBadge.className}>
            <Award className="h-3 w-3 mr-1" />
            {performanceBadge.text}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <Progress 
            value={session.percentage || 0} 
            className="h-3 transition-all duration-1000"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="font-medium">
              {session.percentage || 0}% ({session.score || 0}/{questionsCount})
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chart-2"></div>
            <span className="text-muted-foreground">Correct: {session.score || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <span className="text-muted-foreground">
              Incorrect: {questionsCount - (session.score || 0)}
            </span>
          </div>
        </div>
        
        <div className="text-muted-foreground">
          Accuracy: <span className={cn("font-medium", getScoreColor(session.percentage || 0))}>
            {session.percentage || 0}%
          </span>
        </div>
      </div>
    </div>
  );
}
