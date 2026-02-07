// @ts-nocheck
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  Calendar,
  Award,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

// No longer needed - removed expand functionality

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
  size = 80,
  strokeWidth = 8,
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

interface SessionCardProps {
  session: any; // Quiz session data
  index: number;
  className?: string;
}

export function SessionCard({ session, index, className }: SessionCardProps) {
  const router = useRouter();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get session type styling
  const getSessionTypeStyle = (type: string) => {
    switch (type) {
      case 'PRACTICE':
        return {
          badge: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
          icon: BookOpen,
          color: 'text-chart-1'
        };
      case 'EXAM':
        return {
          badge: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
          icon: Award,
          color: 'text-chart-4'
        };
      default:
        return {
          badge: 'bg-muted/10 text-muted-foreground border-muted/20',
          icon: BookOpen,
          color: 'text-muted-foreground'
        };
    }
  };

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          badge: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
          text: 'Completed'
        };
      case 'IN_PROGRESS':
        return {
          badge: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
          text: 'In Progress'
        };
      case 'ABANDONED':
        return {
          badge: 'bg-destructive/10 text-destructive border-destructive/20',
          text: 'Abandoned'
        };
      default:
        return {
          badge: 'bg-muted/10 text-muted-foreground border-muted/20',
          text: status
        };
    }
  };

  // Get score color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-chart-2';
    if (percentage >= 70) return 'text-chart-3';
    if (percentage >= 60) return 'text-chart-5';
    return 'text-destructive';
  };

  const sessionTypeStyle = getSessionTypeStyle(session.type);
  const statusStyle = getStatusStyle(session.status);
  const TypeIcon = sessionTypeStyle.icon;

  // Get session details from API data only - no calculations or estimations
  const questionsCount = session.questions?.length || session.questionsCount || session.totalQuestions || 0;
  const duration = session.duration ? Math.round(session.duration / 60) : // Convert seconds to minutes
                   session.timeSpent ? Math.round(session.timeSpent / 60) : // Convert seconds to minutes
                   null; // No duration data available

  return (
    <Card
      className={cn(
        "card-enhanced transition-all duration-300 hover:shadow-lg group cursor-pointer",
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TypeIcon className={cn("h-4 w-4", sessionTypeStyle.color)} />
            <CardTitle className="text-sm font-medium line-clamp-1">
              {session.title || `${session.type} #${session.id}`}
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {session.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(session.createdAt)}</span>
          {duration && (
            <>
              <Clock className="h-3 w-3 ml-2" />
              <span>{duration} min</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Circular Progress Indicators Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Accuracy Circle */}
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
              Accuracy
            </div>
          </div>

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
              Questions
            </div>
          </div>
        </div>

        {/* Duration Circle - Only show if we have real duration data */}
        {duration && (
          <div className="flex justify-center mb-4">
            <div className="flex flex-col items-center space-y-2">
              <CircularProgress
                value={Math.min((duration / 60) * 100, 100)} // Normalize to 60 minutes max
                size={60}
                strokeWidth={4}
                color="#06b6d4" // Cyan
              >
                <div className="text-center">
                  <div className="text-xs font-bold" style={{ color: "#06b6d4" }}>
                    {duration}m
                  </div>
                </div>
              </CircularProgress>
              <div className="text-xs text-muted-foreground text-center">
                Duration
              </div>
            </div>
          </div>
        )}

        {/* Performance Badge */}
        <div className="flex justify-center">
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              backgroundColor: session.percentage >= 90 ? "#10b98110" : // Green with opacity
                              session.percentage >= 80 ? "#3b82f610" : // Blue with opacity
                              session.percentage >= 70 ? "#f59e0b10" : // Amber with opacity
                              "#ef444410", // Red with opacity
              color: session.percentage >= 90 ? "#10b981" : // Green
                     session.percentage >= 80 ? "#3b82f6" : // Blue
                     session.percentage >= 70 ? "#f59e0b" : // Amber
                     "#ef4444", // Red
              borderColor: session.percentage >= 90 ? "#10b98120" : // Green with opacity
                           session.percentage >= 80 ? "#3b82f620" : // Blue with opacity
                           session.percentage >= 70 ? "#f59e0b20" : // Amber with opacity
                           "#ef444420" // Red with opacity
            }}
          >
            <Award className="h-3 w-3 mr-1" />
            {session.percentage >= 90 ? 'Excellent' :
             session.percentage >= 80 ? 'Very Good' :
             session.percentage >= 70 ? 'Good' :
             session.percentage >= 60 ? 'Fair' : 'Needs Work'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
