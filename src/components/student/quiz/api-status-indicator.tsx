// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff,
  Loader2,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useApiQuiz } from './quiz-api-context';
import { cn } from '@/lib/utils';

// API Status Indicator Component (simplified, no network monitoring)
export function ApiStatusIndicator() {
  const { state, setAutoSave, clearSubmissionError } = useApiQuiz();
  const isOnline = true; // Always assume online, no monitoring

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        status: 'Offline',
        description: 'Working offline - answers saved locally',
      };
    }

    if (state.submittingAnswer) {
      return {
        icon: Loader2,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        status: 'Syncing',
        description: 'Submitting answer to server...',
        animate: true,
      };
    }

    if (state.lastSubmissionError) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        status: 'Sync Error',
        description: state.lastSubmissionError,
      };
    }

    if (state.apiSessionId && state.autoSave) {
      return {
        icon: Cloud,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        status: 'Online',
        description: 'Auto-save enabled - answers synced automatically',
      };
    }

    return {
      icon: CloudOff,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/20',
      status: 'Local Only',
      description: 'Answers saved locally only',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return null;
}

// Answer Submission Status Component
interface AnswerSubmissionStatusProps {
  questionId: string;
  className?: string;
}

export function AnswerSubmissionStatus({ questionId, className = '' }: AnswerSubmissionStatusProps) {
  const { state } = useApiQuiz();
  const userAnswer = state.session.userAnswers[questionId];
  const isCurrentQuestion = state.currentQuestion?.id === questionId;

  if (!userAnswer) return null;

  const getSubmissionStatus = () => {
    if (isCurrentQuestion && state.submittingAnswer) {
      return {
        icon: Loader2,
        color: 'text-primary',
        label: 'Submitting...',
        animate: true,
      };
    }

    if (state.lastSubmissionError && isCurrentQuestion) {
      return {
        icon: AlertCircle,
        color: 'text-destructive',
        label: 'Sync failed',
      };
    }

    if (state.apiSessionId && state.autoSave) {
      return {
        icon: CheckCircle,
        color: 'text-primary',
        label: 'Synced',
      };
    }

    return {
      icon: CloudOff,
      color: 'text-muted-foreground',
      label: 'Local only',
    };
  };

  const status = getSubmissionStatus();
  const StatusIcon = status.icon;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <StatusIcon 
        className={cn(
          'h-3 w-3',
          status.color,
          status.animate && 'animate-spin'
        )} 
      />
      <span className={cn('text-xs', status.color)}>
        {status.label}
      </span>
    </div>
  );
}

// Quiz Progress Sync Indicator
export function QuizProgressSyncIndicator() {
  const { state } = useApiQuiz();
  
  const answeredQuestions = Object.keys(state.session.userAnswers).length;
  const totalQuestions = state.session.totalQuestions;
  const syncedQuestions = state.apiSessionId && state.autoSave ? answeredQuestions : 0;

  return (
    <div className="text-xs text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>Progress:</span>
        <span>{answeredQuestions}/{totalQuestions} answered</span>
      </div>
      {state.apiSessionId && (
        <div className="flex items-center justify-between">
          <span>Synced:</span>
          <span className={cn(
            syncedQuestions === answeredQuestions ? 'text-green-600' : 'text-yellow-600'
          )}>
            {syncedQuestions}/{answeredQuestions}
          </span>
        </div>
      )}
    </div>
  );
}
