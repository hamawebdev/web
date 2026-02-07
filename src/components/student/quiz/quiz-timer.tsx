// @ts-nocheck
'use client';

import { Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  totalTime: number; // in seconds
  timeLimit?: number; // in minutes
  isRunning: boolean;
  isPaused: boolean;
  className?: string;
}

export function QuizTimer({ totalTime, timeLimit, isRunning, isPaused, className }: Props) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!timeLimit) return null;
    const totalLimitSeconds = timeLimit * 60;
    return Math.max(0, totalLimitSeconds - totalTime);
  };

  const timeRemaining = getTimeRemaining();
  const isNearEnd = timeRemaining !== null && timeRemaining < 300; // 5 minutes
  const isOvertime = timeRemaining !== null && timeRemaining === 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className={cn(
        "h-4 w-4",
        isPaused && "text-accent-foreground",
        isNearEnd && "text-destructive",
        !isPaused && !isNearEnd && "text-muted-foreground"
      )} />

      <div className="font-sans text-sm">
        {timeLimit ? (
          <div className="flex items-center gap-2">
            <span className={cn(
              isOvertime && "text-destructive font-bold",
              isNearEnd && !isOvertime && "text-accent-foreground",
              !isNearEnd && "text-foreground"
            )}>
              {timeRemaining !== null ? formatTime(timeRemaining) : formatTime(totalTime)}
            </span>
            {timeLimit && (
              <span className="text-xs text-muted-foreground">
                / {formatTime(timeLimit * 60)}
              </span>
            )}
          </div>
        ) : (
          <span>{formatTime(totalTime)}</span>
        )}
      </div>

      {isPaused && (
        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
          Pausé
        </Badge>
      )}

      {isNearEnd && !isPaused && (
        <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Temps limité
        </Badge>
      )}
    </div>
  );
}
