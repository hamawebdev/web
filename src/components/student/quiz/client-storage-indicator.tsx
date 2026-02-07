/**
 * Client Storage Indicator Component
 * 
 * Shows the status of client-side answer storage and provides
 * information about stored answers and submission status.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useApiQuiz } from './quiz-api-context';
import { cn } from '@/lib/utils';

export function ClientStorageIndicator() {
  const { state, retrySubmission, getStorageStats } = useApiQuiz();
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Update storage stats periodically
  useEffect(() => {
    const updateStats = () => {
      const stats = getStorageStats();
      setStorageStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getStorageStats]);

  const handleRetrySubmission = async () => {
    setIsRetrying(true);
    try {
      await retrySubmission();
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusInfo = () => {
    const answersCount = Object.keys(state.localAnswers).length;
    const totalQuestions = state.session.totalQuestions || state.session.questions?.length || 0;

    if (state.pendingSubmission) {
      return {
        icon: Upload,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        status: 'Submitting',
        description: 'Submitting answers to server...',
        animate: true,
      };
    }

    if (state.session.status === 'COMPLETED' && answersCount > 0) {
      return {
        icon: AlertCircle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        status: 'Ready to Submit',
        description: `${answersCount} answers ready for manual submission`,
      };
    }

    if (answersCount > 0) {
      const allAnswered = answersCount === totalQuestions && totalQuestions > 0;
      return {
        icon: Save,
        color: allAnswered ? 'text-primary' : 'text-success',
        bgColor: allAnswered ? 'bg-primary/10' : 'bg-success/10',
        borderColor: allAnswered ? 'border-primary/20' : 'border-success/20',
        status: allAnswered ? 'Ready to Submit' : 'Saved Locally',
        description: allAnswered
          ? `All ${answersCount} questions answered - ready to submit`
          : `${answersCount} of ${totalQuestions} answers saved`,
      };
    }

    return {
      icon: Database,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
      borderColor: 'border-muted/20',
      status: 'Ready',
      description: 'Answers will be saved locally until submission',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const answersCount = Object.keys(state.localAnswers).length;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
      </div>
    </TooltipProvider>
  );
}

// Compact version for mobile/small spaces
export function ClientStorageIndicatorCompact() {
  const { state } = useApiQuiz();
  const answersCount = Object.keys(state.localAnswers).length;
  
  const getStatusColor = () => {
    if (state.pendingSubmission) return 'text-primary';
    if (state.session.status === 'COMPLETED' && answersCount > 0) return 'text-warning';
    if (answersCount > 0) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Save className={cn('h-4 w-4', getStatusColor())} />
            {answersCount > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-1">
                {answersCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{answersCount} answers saved locally</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
