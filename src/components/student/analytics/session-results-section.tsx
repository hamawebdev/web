// @ts-nocheck
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StudentService } from '@/lib/api-services';
import { useStudentAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Clock,
  Target,
  BookOpen,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionResultsParams, DetailedSessionResult } from '@/types/api';

export function SessionResultsSection() {
  const { isAuthenticated } = useStudentAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<SessionResultsParams>({
    page: 1,
    limit: 20,
    answerType: undefined,
    sessionType: undefined,
    completedAfter: undefined,
    completedBefore: undefined
  });

  // Fetch session results data
  const {
    data: resultsData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-session-results', filters],
    queryFn: () => StudentService.getSessionResults(filters),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleFilterChange = (key: keyof SessionResultsParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  };

  const toggleQuestionExpansion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getAnswerIcon = (isCorrect: boolean, userAnswer?: string | string[]) => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
    return isCorrect ?
      <CheckCircle className="h-4 w-4 text-chart-1" /> :
      <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getAnswerColor = (isCorrect: boolean, userAnswer?: string | string[]) => {
    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      return 'text-muted-foreground';
    }
    return isCorrect ? 'text-chart-1' : 'text-destructive';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-chart-1';
      case 'MEDIUM': return 'text-chart-4';
      case 'HARD': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'EXAM': return 'bg-destructive/10 text-destructive';
      case 'PRACTICE': return 'bg-primary/10 text-primary';
      case 'REMEDIAL': return 'bg-chart-4/10 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load session results. Please try again.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const container = resultsData?.data?.data || resultsData?.data;
  const payload = container?.data || container;
  const rawResults = payload?.questions || payload?.data || payload;

  // Normalize to include user's selected answers text for both QCS and QCM
  const results = Array.isArray(rawResults) ? rawResults.map((r: any) => {
    const options = r.options || r.answers || [];
    const correctOptions = options.filter((o: any) => o.isCorrect).map((o: any) => o.answerText || o.text);
    const selectedIds = Array.isArray(r.selectedAnswerIds) ? r.selectedAnswerIds
      : (typeof r.selectedAnswerId !== 'undefined' ? [r.selectedAnswerId] : (r.userAnswerIds || []));
    const userSelectedTexts = options
      .filter((o: any) => selectedIds?.map(String).includes(String(o.id)))
      .map((o: any) => o.answerText || o.text);
    return {
      ...r,
      correctAnswer: correctOptions.length > 1 ? correctOptions : (correctOptions[0] || ''),
      userAnswer: userSelectedTexts.length > 1 ? userSelectedTexts : (userSelectedTexts[0] || ''),
    } as DetailedSessionResult;
  }) : [];

  const pagination = payload?.pagination || container?.pagination || resultsData?.data?.pagination;

  // Group results by session (defensive)
  const groupedResults = results.reduce((acc: Record<number, DetailedSessionResult[]>, result: DetailedSessionResult) => {
    const sessionId = (result && typeof result.sessionId === 'number') ? result.sessionId : -1;
    if (!acc[sessionId]) {
      acc[sessionId] = [];
    }
    if (result) acc[sessionId].push(result);
    return acc;
  }, {} as Record<number, DetailedSessionResult[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Detailed Session Results</h2>
        <p className="text-muted-foreground">
          Analyze your performance on individual questions with detailed explanations
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filters.answerType || 'all'} onValueChange={(value) => handleFilterChange('answerType', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Answer Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Answers</SelectItem>
            <SelectItem value="CORRECT">Correct Only</SelectItem>
            <SelectItem value="INCORRECT">Incorrect Only</SelectItem>
            <SelectItem value="UNANSWERED">Unanswered Only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sessionType || 'all'} onValueChange={(value) => handleFilterChange('sessionType', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Session Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PRACTICE">Practice</SelectItem>
            <SelectItem value="EXAM">Exam</SelectItem>
            <SelectItem value="REMEDIAL">Remedial</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 20 })}>
          <Filter className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      {/* Results List */}
      {Object.keys(groupedResults).length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Session Results Found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.answerType || filters.sessionType ?
                'No results found for the selected filters.' :
                'Complete some quizzes to see detailed results here.'}
            </p>
            {(filters.answerType || filters.sessionType) && (
              <Button variant="outline" onClick={() => setFilters({ page: 1, limit: 20 })}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedResults).map(([sessionId, sessionResults]) => {
            const firstResult = sessionResults[0];
            const correctCount = sessionResults.filter(r => r.isCorrect).length;
            const totalCount = sessionResults.length;
            const accuracy = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

            return (
              <Card key={sessionId} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-3">
                        {firstResult.sessionTitle}
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getSessionTypeColor(firstResult.sessionType))}>
                          {firstResult.sessionType}
                        </span>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Session ID: {sessionId} • {totalCount} questions
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {accuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {correctCount}/{totalCount} correct
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {sessionResults.map((result: DetailedSessionResult) => (
                      <Collapsible key={result.questionId}>
                        <CollapsibleTrigger
                          onClick={() => toggleQuestionExpansion(result.questionId)}
                          className="w-full"
                        >
                          <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 text-left">
                              {getAnswerIcon(result.isCorrect, result.userAnswer)}
                              <div>
                                <p className="font-medium text-sm line-clamp-2">
                                  {result.questionText}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{result.subject}</span>
                                  <span>{result.topic}</span>
                                  <span className={getDifficultyColor(result.difficulty)}>
                                    {result.difficulty}
                                  </span>
                                  <span>{formatTime(result.timeSpent)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={result.isCorrect ? "default" : "destructive"} className="text-xs">
                                {result.isCorrect ? 'Correct' : 'Incorrect'}
                              </Badge>
                              {expandedQuestions.has(result.questionId) ?
                                <ChevronUp className="h-4 w-4" /> :
                                <ChevronDown className="h-4 w-4" />
                              }
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            {/* Question Options */}
                            {result.options && result.options.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">Options:</h4>
                                <div className="space-y-1">
                                  {result.options.map((option, index) => {
                                    const isCorrectOption = Array.isArray(result.correctAnswer) ?
                                      result.correctAnswer.includes(option) :
                                      result.correctAnswer === option;
                                    const isUserAnswer = Array.isArray(result.userAnswer) ?
                                      result.userAnswer?.includes(option) :
                                      result.userAnswer === option;

                                    return (
                                      <div key={index} className={cn(
                                        "p-2 rounded text-sm",
                                        isCorrectOption && "bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800",
                                        isUserAnswer && !isCorrectOption && "bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800",
                                        !isCorrectOption && !isUserAnswer && "bg-muted/50"
                                      )}>
                                        <div className="flex items-center gap-2">
                                          {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                          {isUserAnswer && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                          <span>{option}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* User Answer vs Correct Answer */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Your Answer:</h4>
                                <div className={cn("p-3 rounded-lg border", getAnswerColor(result.isCorrect, result.userAnswer))}>
                                  {result.userAnswer ?
                                    (Array.isArray(result.userAnswer) ? result.userAnswer.join(', ') : result.userAnswer) :
                                    'Not answered'
                                  }
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm mb-2">Correct Answer:</h4>
                                <div className="p-3 rounded-lg border bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                                  {Array.isArray(result.correctAnswer) ? result.correctAnswer.join(', ') : result.correctAnswer}
                                </div>
                              </div>
                            </div>

                            {/* Explanation */}
                            {result.explanation && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Explanation:</h4>
                                <div className="p-3 rounded-lg bg-primary/10 text-primary-foreground dark:bg-primary/20 dark:text-primary-foreground text-sm">
                                  {result.explanation}
                                </div>
                              </div>
                            )}

                            {/* Question Metadata */}
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                              <span>Question Type: {result.questionType}</span>
                              <span>Time Spent: {formatTime(result.timeSpent)}</span>
                              {result.answeredAt && <span>Answered: {formatDate(result.answeredAt)}</span>}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}