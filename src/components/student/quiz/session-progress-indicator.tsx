/**
 * Session Progress Indicator
 * 
 * Visual component that shows when a session has been restored from saved progress
 * and provides options to reset or continue.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sessionProgressManager } from '@/lib/session-progress-manager';

interface SessionProgressIndicatorProps {
  sessionId: number;
  isRestored?: boolean;
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timeSpent: number;
  onReset?: () => void;
  className?: string;
}

export function SessionProgressIndicator({
  sessionId,
  isRestored = false,
  currentQuestion,
  totalQuestions,
  answeredCount,
  timeSpent,
  onReset,
  className
}: SessionProgressIndicatorProps) {
  const [isVisible, setIsVisible] = useState(isRestored);
  const [isResetting, setIsResetting] = useState(false);

  // Auto-hide after 15 seconds if not interacted with (extended for mobile safety)
  useEffect(() => {
    if (isRestored) {
      // Detect mobile devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Use longer timeout on mobile to avoid conflicts with theme initialization
      const timeout = isMobile ? 15000 : 10000;
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isRestored]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleReset = async () => {
    if (isResetting) return;
    
    setIsResetting(true);
    try {
      if (onReset) {
        onReset();
      } else {
        sessionProgressManager.resetProgress(sessionId);
      }
    } catch (error) {
      console.error('Failed to reset progress:', error);
    } finally {
      setIsResetting(false);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className={cn(
      "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
      "animate-in slide-in-from-top-2 duration-300",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Session Restored
                </h4>
                <Badge variant="secondary" className="text-xs">
                  Continued
                </Badge>
              </div>
              
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Resumed where you left off at Question {currentQuestion} of {totalQuestions}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{answeredCount} answer{answeredCount !== 1 ? 's' : ''} saved</span>
                </div>
                
                {timeSpent > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(timeSpent)} elapsed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
              className="text-xs h-8 px-3"
            >
              <RotateCcw className={cn(
                "h-3 w-3 mr-1",
                isResetting && "animate-spin"
              )} />
              Start Over
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-xs h-8 px-2"
            >
              ×
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Session Progress Toast
 * 
 * Lightweight toast notification for session restoration
 */
interface SessionProgressToastProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  timeSpent: number;
  onReset: () => void;
}

export function SessionProgressToast({
  currentQuestion,
  totalQuestions,
  answeredCount,
  timeSpent,
  onReset
}: SessionProgressToastProps) {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="flex items-center justify-between gap-4 min-w-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="font-medium text-sm">Session Restored</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Question {currentQuestion}/{totalQuestions}
          {answeredCount > 0 && ` • ${answeredCount} saved`}
          {timeSpent > 0 && ` • ${formatTime(timeSpent)}`}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="text-xs h-7 px-2 flex-shrink-0"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        Reset
      </Button>
    </div>
  );
}

/**
 * Session Status Badge
 * 
 * Small badge indicator for session status
 */
interface SessionStatusBadgeProps {
  status: 'fresh' | 'restored' | 'in_progress' | 'completed';
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'fresh':
        return {
          label: 'New Session',
          variant: 'secondary' as const,
          icon: null
        };
      case 'restored':
        return {
          label: 'Restored',
          variant: 'default' as const,
          icon: <CheckCircle className="h-3 w-3" />
        };
      case 'in_progress':
        return {
          label: 'In Progress',
          variant: 'default' as const,
          icon: <Clock className="h-3 w-3" />
        };
      case 'completed':
        return {
          label: 'Completed',
          variant: 'secondary' as const,
          icon: <CheckCircle className="h-3 w-3" />
        };
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          icon: <AlertCircle className="h-3 w-3" />
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={cn("text-xs", className)}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
