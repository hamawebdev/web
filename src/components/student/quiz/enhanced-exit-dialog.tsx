// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trophy,
  Home,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { QuizStatisticsDisplay } from './quiz-statistics-display';
import { useApiQuiz } from './quiz-api-context';
import { SessionStatusManager } from '@/lib/session-status-manager';
import { QuizService } from '@/lib/api-services';
import { collectSubmitPayloads } from '@/lib/session-answers';
import { toast } from 'sonner';

interface EnhancedExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: any;
  timer: any;
  localAnswers?: Record<number, any>;
  apiSessionId?: number;
  apiSessionResults?: {
    scoreOutOf20?: number;
    percentageScore?: number;
    timeSpent?: number;
    answeredQuestions?: number;
    totalQuestions?: number;
    status?: string;
    sessionId?: number;
  };
  onShowStats?: () => void;
  statsError?: string | null;
}

export function EnhancedExitDialog({
  open,
  onOpenChange,
  session,
  timer,
  localAnswers,
  apiSessionId,
  apiSessionResults,
  onShowStats,
  statsError
}: EnhancedExitDialogProps) {
  const router = useRouter();
  const { flushPendingAnswers } = useApiQuiz();
  const [showStats, setShowStats] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const handleShowStats = () => {
    if (onShowStats) {
      onShowStats();
    } else {
      // Fallback to showing stats in dialog if no callback provided
      setShowStats(true);
    }
  };

  /**
   * Submit all current answers to the API
   * Returns the submission response data for parsing scores and stats
   */
  const submitAllAnswers = async (): Promise<any> => {
    if (!apiSessionId) {
      throw new Error('No session ID available for submission');
    }

    // Every answer the runner holds, after the saves still in flight
    await flushPendingAnswers();
    const apiAnswers = collectSubmitPayloads(session?.questions, session?.userAnswers, localAnswers);

    if (apiAnswers.length === 0) {
      console.log('Exit dialog: No answers to submit');
      return null;
    }

    console.log(`📤 Exit dialog: Submitting ${apiAnswers.length} answers for session ${apiSessionId}...`);
    const totalTimeSpent = timer?.totalTime || 0;
    const response = await QuizService.submitAnswersBulk(apiSessionId, apiAnswers, totalTimeSpent);

    if (!response.success) {
      throw new Error(response.error || 'Failed to submit answers');
    }

    console.log('✅ Exit dialog: Successfully submitted all answers:', response.data);
    return response.data;
  };

  const handleShowResults = async () => {
    if (!apiSessionId) {
      // For non-API sessions, just navigate to results
      const sessionId = session.id;
      if (sessionId) {
        router.push(`/session/${sessionId}/results?from=exit`);
      } else {
        router.push('/student/practice');
      }
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Step 1: Submit all current answers
      console.log('🔄 Submitting answers before showing results...');
      const submissionData = await submitAllAnswers();

      // Step 2: Update session status to COMPLETED
      console.log('🔄 Updating session status to COMPLETED...');
      const statusUpdateSuccess = await SessionStatusManager.setCompleted(apiSessionId, {
        showToast: false,
        silent: true
      });

      // The session only ends here (answering never completes it), so a failure is reported
      if (!statusUpdateSuccess) {
        throw new Error('The session could not be marked as finished');
      }

      // Step 3: Store submission data in sessionStorage for results page
      if (submissionData) {
        try {
          sessionStorage.setItem(
            `quiz-submission-result-${apiSessionId}`,
            JSON.stringify(submissionData)
          );
          console.log('💾 Stored submission data in sessionStorage for results page:', submissionData);
        } catch (e) {
          console.warn('Failed to store submission data in sessionStorage:', e);
        }
      }

      // Step 4: Navigate to results page
      console.log('✅ Successfully submitted answers and updated status, navigating to results...');
      onOpenChange(false);
      router.push(`/session/${apiSessionId}/results`);

    } catch (error) {
      // Already finished (in another tab): its results are the saved answers
      if (await SessionStatusManager.isCompletedOnServer(apiSessionId)) {
        onOpenChange(false);
        router.push(`/session/${apiSessionId}/results`);
        return;
      }
      console.error('❌ Failed to submit answers for results:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to submit answers');

      // Don't navigate to results if submission failed
      toast.error('Failed to submit answers. Please try again or continue without submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitToDashboard = async () => {
    if (!apiSessionId) {
      // For non-API sessions, just navigate to dashboard
      onOpenChange(false);
      router.push('/student/dashboard');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Step 1: Submit all current answers
      console.log('🔄 Submitting answers before exiting to dashboard...');
      const submissionData = await submitAllAnswers();

      // Step 2: Update session status to IN_PROGRESS (since user is exiting before completion)
      console.log('🔄 Updating session status to IN_PROGRESS...');
      const statusUpdateSuccess = await SessionStatusManager.setInProgress(apiSessionId, {
        showToast: false,
        silent: true
      });

      if (!statusUpdateSuccess) {
        console.warn('Failed to update session status to IN_PROGRESS, but continuing to dashboard');
      }

      // Step 3: Navigate to dashboard
      console.log('✅ Successfully submitted answers and updated status, navigating to dashboard...');
      onOpenChange(false);
      router.push('/student/dashboard');

    } catch (error) {
      // Already finished (in another tab): nothing is left to save
      if (await SessionStatusManager.isCompletedOnServer(apiSessionId)) {
        onOpenChange(false);
        router.push('/student/dashboard');
        return;
      }
      console.error('❌ Failed to submit answers for dashboard exit:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to submit answers');

      // Don't navigate to dashboard if submission failed
      toast.error('Failed to submit answers. Please try again or continue without submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToOptions = () => {
    setShowStats(false);
    setSubmissionError(null);
  };

  const handleContinueQuiz = () => {
    onOpenChange(false);
    setSubmissionError(null);
  };

  const handleRetrySubmission = () => {
    setSubmissionError(null);
  };

  const handleForceExit = (destination: 'dashboard' | 'results') => {
    console.log(`⚠️ User chose to force exit to ${destination} without submitting answers`);
    onOpenChange(false);

    if (destination === 'dashboard') {
      router.push('/student/dashboard');
    } else {
      const sessionId = apiSessionId || session.id;
      router.push(`/session/${sessionId}/results?from=exit`);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {!showStats ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl flex items-center gap-2">
                <Home className="h-6 w-6 text-primary" />
                Exit Quiz Session?
              </AlertDialogTitle>
            </AlertDialogHeader>

            {/* Error Message */}
            {submissionError && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-1">Submission Failed</h4>
                      <p className="text-sm text-muted-foreground mb-3">{submissionError}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={handleRetrySubmission}
                          size="sm"
                          variant="outline"
                          className="border-destructive/30 hover:bg-destructive/10"
                        >
                          Try Again
                        </Button>
                        <Button
                          onClick={() => handleForceExit('dashboard')}
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Continue to Dashboard
                        </Button>
                        <Button
                          onClick={() => handleForceExit('results')}
                          size="sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Continue to Results
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleShowResults}
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-chart-1/5 hover:border-chart-1/30"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 text-chart-1 animate-spin" />
                  ) : (
                    <Trophy className="h-6 w-6 text-chart-1" />
                  )}
                  <div className="text-center">
                    <div className="font-semibold">
                      {isSubmitting ? 'Submitting...' : 'Show Results'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isSubmitting ? 'Please wait' : 'View full results page'}
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={handleExitToDashboard}
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-chart-2/5 hover:border-chart-2/30"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 text-chart-2 animate-spin" />
                  ) : (
                    <Home className="h-6 w-6 text-chart-2" />
                  )}
                  <div className="text-center">
                    <div className="font-semibold">
                      {isSubmitting ? 'Submitting...' : 'Exit to Dashboard'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isSubmitting ? 'Please wait' : 'Return to main menu'}
                    </div>
                  </div>
                </Button>
              </div>

              {/* Continue Quiz Button */}
              <div className="flex justify-center pt-4 border-t">
                <Button
                  onClick={handleContinueQuiz}
                  disabled={isSubmitting}
                  className="px-8"
                >
                  Continue Quiz
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="relative">
            <Button
              onClick={handleBackToOptions}
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <QuizStatisticsDisplay
              session={session}
              timer={timer}
              localAnswers={localAnswers}
            />
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
