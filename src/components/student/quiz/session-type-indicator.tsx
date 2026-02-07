/**
 * Session Type Indicator Component
 * 
 * Displays the type of session (Practice, Exam, Remedial) with appropriate
 * styling and icons to help users understand the context.
 */

'use client';

import React from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  RefreshCw, 
  Clock,
  Target,
  Award
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SessionTypeIndicatorProps {
  type: 'PRACTICE' | 'EXAM' | 'REMEDIAL' | string;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  className?: string;
}

export function SessionTypeIndicator({ 
  type, 
  variant = 'default',
  showIcon = true,
  className 
}: SessionTypeIndicatorProps) {
  const getTypeConfig = (sessionType: string) => {
    const normalizedType = sessionType.toUpperCase();
    
    switch (normalizedType) {
      case 'PRACTICE':
        return {
          label: 'Practice Session',
          shortLabel: 'Practice',
          icon: BookOpen,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          badgeVariant: 'default' as const,
          description: 'Practice questions to improve your knowledge',
        };
      case 'EXAM':
        return {
          label: 'Exam Session',
          shortLabel: 'Exam',
          icon: GraduationCap,
          color: 'text-chart-2',
          bgColor: 'bg-chart-2/10',
          borderColor: 'border-chart-2/20',
          badgeVariant: 'secondary' as const,
          description: 'Formal examination with time limits and scoring',
        };
      case 'REMEDIAL':
        return {
          label: 'Remedial Session',
          shortLabel: 'Remedial',
          icon: RefreshCw,
          color: 'text-chart-4',
          bgColor: 'bg-chart-4/10',
          borderColor: 'border-chart-4/20',
          badgeVariant: 'secondary' as const,
          description: 'Review and practice for areas needing improvement',
        };
      default:
        return {
          label: 'Quiz Session',
          shortLabel: 'Quiz',
          icon: Target,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          borderColor: 'border-muted/20',
          badgeVariant: 'outline' as const,
          description: 'General quiz session',
        };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge variant={config.badgeVariant} className={cn('gap-1', className)}>
        {showIcon && <Icon className="h-3 w-3" />}
        {config.shortLabel}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          config.bgColor,
          config.borderColor,
          className
        )}
      >
        {showIcon && (
          <div className={cn('p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm')}>
            <Icon className={cn('h-5 w-5', config.color)} />
          </div>
        )}
        <div className="flex-1">
          <div className={cn('font-medium', config.color)}>
            {config.label}
          </div>
          <div className="text-sm text-muted-foreground">
            {config.description}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showIcon && <Icon className={cn('h-4 w-4', config.color)} />}
      <Badge variant={config.badgeVariant}>
        {config.shortLabel}
      </Badge>
    </div>
  );
}

// Specialized components for specific contexts
export function SessionTypeHeader({ type, title, className }: {
  type: string;
  title?: string;
  className?: string;
}) {
  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('p-2 rounded-lg', config.bgColor, config.borderColor, 'border')}>
        <Icon className={cn('h-6 w-6', config.color)} />
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          {title || config.label}
        </h1>
        <p className="text-muted-foreground">
          {config.description}
        </p>
      </div>
    </div>
  );
}

export function SessionTypeStats({ type, stats, className }: {
  type: string;
  stats: {
    totalQuestions?: number;
    timeLimit?: number;
    score?: number;
    percentage?: number;
  };
  className?: string;
}) {
  const config = getTypeConfig(type);

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {stats.totalQuestions && (
        <div className="text-center">
          <div className={cn('text-2xl font-bold', config.color)}>
            {stats.totalQuestions}
          </div>
          <div className="text-sm text-muted-foreground">Questions</div>
        </div>
      )}
      
      {stats.timeLimit && (
        <div className="text-center">
          <div className={cn('text-2xl font-bold', config.color)}>
            {Math.round(stats.timeLimit / 60)}m
          </div>
          <div className="text-sm text-muted-foreground">Time Limit</div>
        </div>
      )}
      
      {stats.score !== undefined && (
        <div className="text-center">
          <div className={cn('text-2xl font-bold', config.color)}>
            {stats.score}
          </div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
      )}
      
      {stats.percentage !== undefined && (
        <div className="text-center">
          <div className={cn('text-2xl font-bold', config.color)}>
            {stats.percentage}%
          </div>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </div>
      )}
    </div>
  );
}

// Helper function to get type configuration (exported for use in other components)
export function getSessionTypeConfig(type: string) {
  const normalizedType = type.toUpperCase();
  
  switch (normalizedType) {
    case 'PRACTICE':
      return {
        label: 'Practice Session',
        shortLabel: 'Practice',
        icon: BookOpen,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        badgeVariant: 'default' as const,
        description: 'Practice questions to improve your knowledge',
      };
    case 'EXAM':
      return {
        label: 'Exam Session',
        shortLabel: 'Exam',
        icon: GraduationCap,
        color: 'text-chart-3',
        bgColor: 'bg-chart-3/10',
        borderColor: 'border-chart-3/20',
        badgeVariant: 'secondary' as const,
        description: 'Formal examination with time limits and scoring',
      };
    case 'REMEDIAL':
      return {
        label: 'Remedial Session',
        shortLabel: 'Remedial',
        icon: RefreshCw,
        color: 'text-accent-foreground',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/20',
        badgeVariant: 'secondary' as const,
        description: 'Review and practice for areas needing improvement',
      };
    default:
      return {
        label: 'Quiz Session',
        shortLabel: 'Quiz',
        icon: Target,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/10',
        borderColor: 'border-muted/20',
        badgeVariant: 'outline' as const,
        description: 'General quiz session',
      };
  }
}

// Utility function to determine if a session type requires special handling
export function isExamSession(type: string): boolean {
  return type.toUpperCase() === 'EXAM';
}

export function isPracticeSession(type: string): boolean {
  return type.toUpperCase() === 'PRACTICE';
}

export function isRemedialSession(type: string): boolean {
  return type.toUpperCase() === 'REMEDIAL';
}
