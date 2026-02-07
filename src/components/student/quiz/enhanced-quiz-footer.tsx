// @ts-nocheck
'use client';

import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  BookOpen, 
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedQuizFooterProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onFinish?: () => void; // called when user clicks Finish on last question
  canGoBack: boolean;
  canGoForward: boolean;
  isLastQuestion: boolean;
  className?: string;
  hideSubmit?: boolean;
  isSubmitting?: boolean; // external submission state
}

export function EnhancedQuizFooter({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  onPrevious,
  onNext,
  onSubmit,
  canGoBack,
  canGoForward,
  isLastQuestion,
  className,
  hideSubmit = false,
  isSubmitting: externalIsSubmitting = false,
}: EnhancedQuizFooterProps) {
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);

  // Use external submission state if provided, otherwise use internal state
  const isSubmitting = externalIsSubmitting || internalIsSubmitting;

  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const currentProgress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const isAllAnswered = answeredQuestions === totalQuestions && totalQuestions > 0;
  const hasAnswers = answeredQuestions > 0;

  const handleSubmit = async () => {
    // Only use internal state if no external state is provided
    if (!externalIsSubmitting) {
      setInternalIsSubmitting(true);
    }
    try {
      await onSubmit();
    } finally {
      if (!externalIsSubmitting) {
        setInternalIsSubmitting(false);
      }
    }
  };

  const getProgressStatus = () => {
    if (isAllAnswered) return { color: 'text-primary', bg: 'bg-primary/10', icon: CheckCircle2 };
    if (hasAnswers) return { color: 'text-primary-foreground', bg: 'bg-primary/20', icon: Target };
    return { color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Circle };
  };

  const progressStatus = getProgressStatus();
  const ProgressIcon = progressStatus.icon;

  return (
    <footer 
      className={cn(
        "border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/95 shadow-lg flex-shrink-0",
        className
      )}
      role="contentinfo"
      aria-label="Quiz navigation and progress"
    >
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-1 rounded-none border-0"
          aria-label={`Quiz progress: ${answeredQuestions} of ${totalQuestions} questions answered`}
        />
        {/* Current position indicator */}
        <div 
          className="absolute top-0 h-1 w-1 bg-primary/60 transition-all duration-300"
          style={{ left: `${currentProgress}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Mobile Layout */}
        <div className="flex sm:hidden items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!canGoBack}
            className="flex-shrink-0"
            aria-label="Go to previous question"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ProgressIcon className={cn("h-4 w-4", progressStatus.color)} />
              <span className="text-sm font-medium">
                {currentQuestionIndex + 1}/{totalQuestions}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {answeredQuestions} answered
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hideSubmit && hasAnswers && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="text-primary border-primary/20 hover:bg-primary/5"
                    aria-label={`Submit quiz with ${answeredQuestions} answers`}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Submit ({answeredQuestions} answers)</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Button
              onClick={() => (isLastQuestion ? (typeof onSubmit === 'function' ? onSubmit() : undefined) : onNext())}
              disabled={isLastQuestion ? isSubmitting : !canGoForward}
              size="sm"
              className="flex-shrink-0"
              aria-label={isLastQuestion ? "Finish quiz" : "Go to next question"}
            >
              {isLastQuestion ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between gap-6">
          {/* Left: Previous Button */}
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoBack}
            className="gap-2 min-w-[100px]"
            aria-label="Go to previous question"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Center: Progress Information */}
          <div className="flex-1 flex items-center justify-center gap-6">
            {/* Progress Stats */}
            <div className="flex items-center gap-3">

            </div>

          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3">
            {!hideSubmit && hasAnswers && (
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 text-primary border-primary/20 hover:bg-primary/5 min-w-[120px]"
                aria-label={`Submit quiz with ${answeredQuestions} answers`}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Submitting...' : `Submit (${answeredQuestions})`}
              </Button>
            )}

            <Button
              onClick={() => (isLastQuestion ? (typeof onSubmit === 'function' ? onSubmit() : undefined) : onNext())}
              disabled={isLastQuestion ? isSubmitting : !canGoForward}
              className="gap-2 min-w-[100px]"
              aria-label={isLastQuestion ? "Finish quiz" : "Go to next question"}
              data-finish-button={isLastQuestion ? "true" : undefined}
            >
              {isLastQuestion ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? 'Finishing...' : 'Finish'}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
