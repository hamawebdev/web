/**
 * Session Continuation Dialog
 * 
 * Dialog that appears when a user returns to a session with saved progress,
 * offering options to continue or start over.
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, RotateCcw, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionContinuationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timeSpent: number;
  lastUpdated: Date;
  onContinue: () => void;
  onStartOver: () => void;
  isLoading?: boolean;
}

export function SessionContinuationDialog({
  open,
  onOpenChange,
  sessionTitle,
  currentQuestion,
  totalQuestions,
  answeredCount,
  timeSpent,
  lastUpdated,
  onContinue,
  onStartOver,
  isLoading = false
}: SessionContinuationDialogProps) {
  const [isStartingOver, setIsStartingOver] = useState(false);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  const handleStartOver = async () => {
    setIsStartingOver(true);
    try {
      await onStartOver();
    } finally {
      setIsStartingOver(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Session Found
          </DialogTitle>
          <DialogDescription>
            We found your previous progress for this session. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{sessionTitle}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated {formatLastUpdated(lastUpdated)}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {progressPercentage}% Complete
              </Badge>
            </div>

            <Separator className="my-3" />

            {/* Progress Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Current Question</span>
                </div>
                <p className="font-medium ml-4">
                  {currentQuestion} of {totalQuestions}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">Answered</span>
                </div>
                <p className="font-medium ml-6">
                  {answeredCount} question{answeredCount !== 1 ? 's' : ''}
                </p>
              </div>

              {timeSpent > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-muted-foreground">Time Spent</span>
                    </div>
                    <p className="font-medium ml-6">{formatTime(timeSpent)}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{answeredCount}/{totalQuestions} questions</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleStartOver}
            disabled={isLoading || isStartingOver}
            className="w-full sm:w-auto"
          >
            <RotateCcw className={cn(
              "w-4 h-4 mr-2",
              isStartingOver && "animate-spin"
            )} />
            Start Over
          </Button>
          
          <Button
            onClick={onContinue}
            disabled={isLoading || isStartingOver}
            className="w-full sm:w-auto"
          >
            <Play className="w-4 h-4 mr-2" />
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick Session Continuation Banner
 * 
 * Compact banner for session continuation without dialog
 */
interface SessionContinuationBannerProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  onContinue: () => void;
  onStartOver: () => void;
  onDismiss: () => void;
  className?: string;
}

export function SessionContinuationBanner({
  currentQuestion,
  totalQuestions,
  answeredCount,
  onContinue,
  onStartOver,
  onDismiss,
  className
}: SessionContinuationBannerProps) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Previous session found
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Question {currentQuestion}/{totalQuestions} • {answeredCount} answered
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartOver}
          className="text-xs h-8 px-3 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
        >
          Start Over
        </Button>
        
        <Button
          size="sm"
          onClick={onContinue}
          className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700"
        >
          Continue
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-xs h-8 px-2 text-blue-700 hover:text-blue-900 hover:bg-blue-100"
        >
          ×
        </Button>
      </div>
    </div>
  );
}
