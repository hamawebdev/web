// @ts-nocheck
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuizSession } from '@/hooks/use-quiz-api';
import { FullPageLoading } from '@/components/loading-states';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RetakeDialog, RetakeType } from '@/components/student/quiz/retake-dialog';
import { QuizService, StudentService } from '@/lib/api-services';
import { toast } from 'sonner';
import { extractSessionId, validateRetakeParams } from '@/lib/utils/session-utils';
import {
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  BookOpen,
  RotateCcw,
  ArrowLeft,
  Award,
  Target,
  TrendingUp,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toPlainText } from '@/lib/question-localization';
import { NewSessionResults } from '@/components/student/quiz/new-session-results';
import { readCache, writeCache } from '@/lib/cached-resource';

// Results of a finished session do not change: a cached copy shows at once on later
// visits. Copies of a session still in progress are not used here.
const isFinishedSession = (session: any) => session?.status === 'COMPLETED';

// Utility function to format time in mm:ss format
const formatTimeMMSS = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Interface for completion data using backend response fields
interface CompletionData {
  sessionId: number;
  title: string;
  type: string;
  totalQuestions: number;
  answeredQuestions?: number; // From submit-answer response
  correctCount: number; // From backend: correctAnswersCount
  incorrectCount: number; // From backend: incorrectAnswersCount
  unansweredCount: number; // From backend: unansweredQuestionsCount
  percentage: number; // percentageScore from submit-answer response
  scoreOutOf20?: number; // From submit-answer response
  timeSpent: number; // From submit-answer response
  completedAt: string;
  questionSummary: any[];
  canRetake: boolean;
  status?: string; // From submit-answer response
}

function QuizCompletionContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(params.sessionId as string);
  const fromExit = searchParams.get('from') === 'exit';

  // Handle invalid sessionId
  useEffect(() => {
    if (isNaN(sessionId) || sessionId <= 0) {
      console.error('Invalid session ID:', params.sessionId);
      toast.error('Invalid session ID. Redirecting to dashboard.');
      router.push('/student/practice');
    }
  }, [sessionId, router, params.sessionId]);

  const { session: apiSession, loading, error, refresh } = useQuizSession(sessionId, { acceptCached: isFinishedSession });
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [retakeDialogOpen, setRetakeDialogOpen] = useState(false);
  const [sessionResults, setSessionResults] = useState<any>(null);
  const [resultsLoading, setResultsLoading] = useState(true);

  // Fetch session results from dedicated endpoint
  useEffect(() => {
    if (sessionId && !isNaN(sessionId)) {
      const cacheKey = `session-results:${sessionId}`;
      const cached = readCache<any>(cacheKey)?.value;
      const cachedText = cached && isFinishedSession(cached) ? JSON.stringify(cached) : null;
      if (cachedText) {
        setSessionResults(cached);
        setResultsLoading(false);
      }
      const fetchSessionResults = async () => {
        try {
          if (!cachedText) setResultsLoading(true);
          const res = await QuizService.getSessionResults(sessionId);
          if (res.success && res.data) {
            // Unchanged since the cached copy: keep it (no second render)
            if (JSON.stringify(res.data) !== cachedText) setSessionResults(res.data);
            if (isFinishedSession(res.data)) writeCache(cacheKey, res.data);
          } else {
            console.error('Failed to fetch session results:', res.error);
          }
        } catch (err) {
          console.error('Error fetching session results:', err);
        } finally {
          setResultsLoading(false);
        }
      };
      fetchSessionResults();
    }
  }, [sessionId]);


  // Process completion data when session results are available
  useEffect(() => {
    if (sessionResults && apiSession) {
      const sessionData = apiSession.data?.data || apiSession.data || apiSession;

      console.log('📊 Processing session results from dedicated endpoint:', sessionResults);

      // Allow viewing results if coming from exit dialog, otherwise only show for completed sessions
      const isCompleted = sessionResults.status === 'COMPLETED' || sessionData.status === 'COMPLETED';
      if (!isCompleted && !fromExit) {
        router.push(`/session/${sessionId}`);
        return;
      }

      // If coming from exit dialog but session isn't completed, show a warning
      if (!isCompleted && fromExit) {
        console.log('📊 Showing results for incomplete session from exit dialog');
        toast.info('Showing current progress. Complete the quiz to finalize your results.', {
          duration: 5000,
        });
      }

      // Use data directly from the dedicated results endpoint
      const totalQuestions = sessionResults.totalQuestions || 0;
      const backendCorrectCount = sessionResults.correctAnswersCount || 0;
      const backendIncorrectCount = sessionResults.incorrectAnswersCount || 0;
      const backendUnansweredCount = sessionResults.unansweredCount || 0;
      const scoreOutOf20 = sessionResults.totalScore20 || 0;
      const percentageScore = sessionResults.score || 0;

      console.log('📊 Using session results data:', {
        correctAnswersCount: backendCorrectCount,
        incorrectAnswersCount: backendIncorrectCount,
        unansweredCount: backendUnansweredCount,
        totalQuestions,
        scoreOutOf20,
        percentageScore
      });

      const answersArr = Array.isArray(sessionData.answers) ? sessionData.answers : (Array.isArray(sessionData.results) ? sessionData.results : []);
      const questionsArr = Array.isArray(sessionData.questions) ? sessionData.questions : [];

      // Build question summary for review purposes
      const questionSummary = questionsArr.map((question: any, index: number) => {
        const userAnswer = answersArr.find((a: any) => String(a.questionId) === String(question.id)) || {};

        const selectedIdsFromArray = Array.isArray(userAnswer.selectedAnswerIds)
          ? userAnswer.selectedAnswerIds
          : (Array.isArray(userAnswer.userAnswerIds) ? userAnswer.userAnswerIds : []);
        const selectedIds: string[] = selectedIdsFromArray.length > 0
          ? selectedIdsFromArray.map((id: any) => String(id))
          : (userAnswer.selectedAnswerId !== undefined && userAnswer.selectedAnswerId !== null
            ? [String(userAnswer.selectedAnswerId)]
            : []);

        const answers = question.questionAnswers || question.answers || question.options || [];
        const hasTextAnswer = typeof userAnswer.textAnswer === 'string' && userAnswer.textAnswer.trim().length > 0;
        const isAnswered = selectedIds.length > 0 || hasTextAnswer;
        const isCorrect = typeof userAnswer.isCorrect === 'boolean' ? userAnswer.isCorrect : false;

        const selectedAnswers = answers.filter((a: any) => selectedIds.includes(String(a.id)));
        const correctAnswers = answers.filter((a: any) => a?.isCorrect);

        return {
          questionNumber: index + 1,
          question: toPlainText(question.questionText || question.text || question.content),
          studentAnswer: selectedAnswers.map((a: any) => toPlainText(a.answerText || a.text)).join(', ') || (hasTextAnswer ? String(userAnswer.textAnswer) : 'No answer'),
          correctAnswer: correctAnswers.map((a: any) => toPlainText(a.answerText || a.text)).join(', '),
          isCorrect,
          isAnswered
        };
      });

      const answeredCount = backendCorrectCount + backendIncorrectCount;

      setCompletionData({
        sessionId: sessionResults.sessionId,
        title: sessionResults.title || 'Quiz Session',
        type: sessionResults.type || 'PRACTICE',
        totalQuestions,
        answeredQuestions: answeredCount,
        correctCount: backendCorrectCount,
        incorrectCount: backendIncorrectCount,
        unansweredCount: backendUnansweredCount,
        percentage: percentageScore,
        scoreOutOf20,
        timeSpent: 0, // Time spent is not included in the new endpoint yet
        completedAt: sessionResults.completedAt || new Date().toISOString(),
        questionSummary,
        canRetake: true,
        status: sessionResults.status
      });

      // Trigger celebration for good scores
      if (percentageScore >= 70) {
        setShowCelebration(true);
      }
    }
  }, [sessionResults, apiSession, sessionId, router, fromExit]);

  const handleOpenRetake = () => {
    setRetakeDialogOpen(true);
  };

  const handleConfirmRetake = async ({ retakeType }: { retakeType: RetakeType }) => {
    try {
      // Validate parameters before making the API call
      const validation = validateRetakeParams({
        originalSessionId: sessionId,
        retakeType
      });

      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid retake parameters');
        return;
      }

      console.log('🔄 [Retake] Starting retake session creation:', {
        originalSessionId: sessionId,
        retakeType
      });

      const res = await QuizService.retakeQuizSession({
        originalSessionId: sessionId,
        retakeType
      });

      if (res.success) {
        const newId = extractSessionId(res);

        if (newId) {
          console.log('✅ [Retake] Successfully created retake session:', newId);
          toast.success('Retake session created successfully!');
          router.push(`/session/${newId}`);
        } else {
          console.error('❌ [Retake] Session created but ID not found in response:', res.data);
          toast.error('Session created but ID not found. Please check the session list.');
        }
      } else {
        console.error('❌ [Retake] API returned error:', res.error);
        toast.error(res.error || 'Failed to create retake session');
      }
    } catch (error: any) {
      console.error('💥 [Retake] Exception during retake creation:', error);

      // Provide more specific error messages
      if (error.message?.includes('404')) {
        toast.error('Original session not found. Please try again.');
      } else if (error.message?.includes('403')) {
        toast.error('You do not have permission to retake this session.');
      } else if (error.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error(error?.message || 'Failed to create retake session');
      }
    } finally {
      setRetakeDialogOpen(false);
    }
  };

  if (loading) {
    return <FullPageLoading message="Loading completion results..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">
              Failed to load quiz results
              {fromExit && (
                <span className="block text-sm text-muted-foreground mt-2">
                  The session may not have been submitted properly.
                </span>
              )}
            </p>
            <div className="flex flex-col gap-2">
              {fromExit && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/session/${sessionId}`)}
                >
                  Return to Quiz
                </Button>
              )}
              <Button onClick={() => router.push('/student/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resultsLoading || !completionData) {
    return <FullPageLoading message="Loading results..." />;
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', icon: Trophy, color: 'text-chart-1' };
    if (percentage >= 80) return { level: 'Great', icon: Award, color: 'text-chart-5' };
    if (percentage >= 70) return { level: 'Good', icon: Target, color: 'text-chart-2' };
    if (percentage >= 60) return { level: 'Fair', icon: TrendingUp, color: 'text-chart-4' };
    return { level: 'Needs Improvement', icon: BookOpen, color: 'text-destructive' };
  };

  const performance = getPerformanceLevel(completionData.percentage);
  const PerformanceIcon = performance.icon;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/student/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Performance Overview */}
          <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl mx-auto">

            {/* New Results Component */}
            <div className="w-full">
              <NewSessionResults
                data={{
                  correctAnswersCount: completionData.correctCount,
                  incorrectAnswersCount: completionData.incorrectCount,
                  unansweredCount: completionData.unansweredCount,
                  totalScore20: completionData.scoreOutOf20 ?? 0
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => router.push(`/session/${sessionId}/review`)}
              className="gap-2 px-6 py-3 text-lg"
            >
              <BookOpen className="h-5 w-5" />
              Review Answers
            </Button>

            {completionData.canRetake && (
              <Button
                variant="outline"
                onClick={handleOpenRetake}
                className="gap-2 px-6 py-3 text-lg"
              >
                <RotateCcw className="h-5 w-5" />
                Retake Quiz
              </Button>
            )}
          </div>


        </div>
      </div>

      {/* Retake Dialog */}
      <RetakeDialog
        open={retakeDialogOpen}
        onOpenChange={setRetakeDialogOpen}
        onConfirm={handleConfirmRetake}
      />
    </ErrorBoundary>
  );
}

export default function QuizCompletionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <QuizCompletionContent />
    </Suspense>
  );
}
