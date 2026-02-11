// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuizSession } from '@/hooks/use-quiz-api';
import { FullPageLoading } from '@/components/loading-states';
import { ErrorBoundary } from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageGallery } from '@/components/student/quiz/image-gallery';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function SessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.sessionId as string);

  const { session: apiSession, loading, error } = useQuizSession(sessionId);

  const [reviewData, setReviewData] = useState<any>(null);

  // Process review data when session is available
  useEffect(() => {
    if (apiSession) {
      const sessionData = apiSession.data?.data || apiSession.data || apiSession;

      // Only show for completed sessions
      if (sessionData.status !== 'COMPLETED' && sessionData.status !== 'completed') {
        router.push(`/session/${sessionId}`);
        return;
      }

      const questions = sessionData.questions || [];
      const answers = Array.isArray(sessionData.answers) ? sessionData.answers : [];

      // Build detailed question data
      const questionsWithAnswers = questions.map((question: any, index: number) => {
        const userAnswer = answers.find((a: any) => String(a.questionId) === String(question.id));

        // Handle both single and multiple choice answers
        const selectedAnswerIds = userAnswer?.selectedAnswerIds ||
          (userAnswer?.selectedAnswerId ? [userAnswer.selectedAnswerId] : []);

        const selectedAnswers = question.questionAnswers?.filter((a: any) =>
          selectedAnswerIds.includes(a.id)
        ) || [];

        const correctAnswers = question.questionAnswers?.filter((a: any) => a.isCorrect) || [];
        const isCorrect = userAnswer?.isCorrect || false;

        return {
          ...question,
          questionNumber: index + 1,
          userAnswer,
          selectedAnswerIds,
          selectedAnswers,
          correctAnswers,
          isCorrect,
          questionType: question.questionType || question.type || (correctAnswers.length > 1 ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE'),
          // Ensure we have the answer options in the expected format
          answers: question.questionAnswers || question.answers || []
        };
      });

      setReviewData({
        sessionId: sessionData.id,
        title: sessionData.title || 'Quiz Session',
        type: sessionData.type || 'PRACTICE',
        questions: questionsWithAnswers
      });
    }
  }, [apiSession, sessionId, router]);

  if (loading) {
    return <FullPageLoading message="Loading answer review..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">Failed to load answer review</p>
            <Button onClick={() => router.push('/student/dashboard')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reviewData) {
    return <FullPageLoading message="Processing answers..." />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push(`/session/${sessionId}/results`)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Results
            </Button>

            <div className="text-right">
              <h1 className="text-2xl font-bold">Session Review</h1>
              <p className="text-muted-foreground">{reviewData.title}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {reviewData.questions.map((question: any) => {
              return (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {question.questionNumber}</Badge>
                          <Badge variant={question.isCorrect ? 'default' : 'destructive'}>
                            {question.isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          {question.questionType === 'MULTIPLE_CHOICE' && (
                            <Badge variant="secondary">Multiple Choice</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg leading-relaxed">
                          {question.questionText || question.text || question.content}
                        </CardTitle>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Review Mode
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Question Images */}
                    {question.questionImages && question.questionImages.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Question Images</h4>
                        <ImageGallery
                          images={question.questionImages.map((img: any, idx: number) => ({
                            id: img.id || idx,
                            imagePath: img.imagePath || img.url,
                            altText: img.altText || `Question image ${idx + 1}`
                          }))}
                          title="Question Images"
                          maxHeight="max-h-64"
                          gridCols="auto"
                          showZoom={true}
                          compact={false}
                        />
                      </div>
                    )}

                    {/* Answer Options */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Answer Options</h4>
                      {question.answers?.map((answer: any) => {
                        const isSelected = question.selectedAnswerIds.includes(answer.id);
                        const isCorrect = answer.isCorrect;
                        const showAsCorrect = isCorrect;
                        const showAsIncorrect = isSelected && !isCorrect;

                        return (
                          <div
                            key={answer.id}
                            className={cn(
                              "flex items-start gap-3 p-4 rounded-lg border-2 transition-all",
                              showAsCorrect && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30",
                              showAsIncorrect && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30",
                              !showAsCorrect && !showAsIncorrect && "border-border"
                            )}
                          >
                            {/* Selection Indicator */}
                            <div className="flex-shrink-0 mt-0.5">
                              {question.questionType === 'MULTIPLE_CHOICE' ? (
                                <div className={cn(
                                  "w-4 h-4 rounded border-2 flex items-center justify-center",
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                                )}>
                                  {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                                </div>
                              ) : (
                                <div className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                                )}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                              )}
                            </div>

                            {/* Answer Text */}
                            <div className="flex-1">
                              <p className="text-sm leading-relaxed">
                                {answer.answerText || answer.text}
                              </p>

                              {/* Status Labels */}
                              <div className="flex gap-2 mt-2">
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800/30">
                                    Your Answer
                                  </Badge>
                                )}
                                {isCorrect && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/30">
                                    Correct Answer
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Status Icons */}
                            <div className="flex-shrink-0">
                              {showAsCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {showAsIncorrect && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Section */}
                    {question.explanation && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <h4 className="text-sm font-medium text-primary">Explanation</h4>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 prose prose-sm max-w-none text-foreground prose-p:text-foreground prose-strong:text-foreground prose-headings:text-foreground">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                              ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                            }}
                          >
                            {question.explanation || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Explanation Images */}
                    {question.questionExplanationImages && question.questionExplanationImages.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Explanation Images</h4>
                        <ImageGallery
                          images={question.questionExplanationImages.map((img: any, idx: number) => ({
                            id: img.id || idx,
                            imagePath: img.imagePath || img.url,
                            altText: img.altText || `Explanation image ${idx + 1}`
                          }))}
                          title="Explanation Images"
                          maxHeight="max-h-64"
                          gridCols="auto"
                          showZoom={true}
                          compact={false}
                        />
                      </div>
                    )}

                    {/* Answer-specific explanation images */}
                    {question.answers?.some((answer: any) => answer.explanationImages && answer.explanationImages.length > 0) && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Answer Explanation Images</h4>
                        <div className="space-y-4">
                          {question.answers.filter((answer: any) => answer.explanationImages && answer.explanationImages.length > 0).map((answer: any) => (
                            <div key={answer.id} className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                For answer: "{answer.answerText || answer.text}"
                              </p>
                              <ImageGallery
                                images={answer.explanationImages.map((img: any, idx: number) => ({
                                  id: img.id || idx,
                                  imagePath: img.imagePath || img.url,
                                  altText: img.altText || `Answer explanation image ${idx + 1}`
                                }))}
                                title={`Answer Explanation Images for: "${answer.answerText || answer.text}"`}
                                maxHeight="max-h-64"
                                gridCols="auto"
                                showZoom={true}
                                compact={false}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
