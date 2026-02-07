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
import {
  Clock,
  Target,
  BookOpen,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trophy,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuizHistoryParams, QuizHistoryItem } from '@/types/api';

export function QuizHistorySection() {
  const { isAuthenticated } = useStudentAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<QuizHistoryParams>({
    page: 1,
    limit: 10,
    type: undefined,
    sortBy: 'completedAt',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch quiz history data
  const {
    data: historyData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['student-quiz-history', filters],
    queryFn: () => StudentService.getQuizHistory(filters),
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleFilterChange = (key: keyof QuizHistoryParams, value: any) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutesInput?: number) => {
    const minutes = typeof minutesInput === 'number' && isFinite(minutesInput) && minutesInput >= 0 ? minutesInput : 0;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'default';
      case 'IN_PROGRESS': return 'secondary';
      case 'ABANDONED': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EXAM': return 'bg-chart-3/10 text-chart-3';
      case 'PRACTICE': return 'bg-primary/10 text-primary';
      case 'REMEDIAL': return 'bg-chart-4/10 text-chart-4';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-success';
      case 'MEDIUM': return 'text-warning';
      case 'HARD': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-48" />
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
          Failed to load quiz history. Please try again.
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const container = historyData?.data?.data || historyData?.data;
  const history = Array.isArray(container?.sessions)
    ? container.sessions
    : (Array.isArray(container) ? container : []);
  const pagination = container?.pagination || historyData?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Quiz History</h2>
        <p className="text-muted-foreground">
          Review your completed quizzes and exams with detailed performance metrics
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quiz history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="PRACTICE">Practice</SelectItem>
            <SelectItem value="EXAM">Exam</SelectItem>
            <SelectItem value="REMEDIAL">Remedial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sortOrder || 'desc'} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quiz History List */}
      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quiz History Found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.type ? 'No quizzes found for the selected filters.' : 'Complete some quizzes to see your history here.'}
            </p>
            {filters.type && (
              <Button variant="outline" onClick={() => handleFilterChange('type', undefined)}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((quiz: QuizHistoryItem) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{quiz.title}</h3>
                      <Badge variant={getStatusColor(quiz.status) as any}>
                        {quiz.status}
                      </Badge>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getTypeColor(quiz.type))}>
                        {quiz.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {quiz.completedAt ? formatDate(quiz.completedAt) : formatDate(quiz.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(quiz.timeSpent)}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {(quiz.answeredQuestions ?? quiz.answersCount ?? 0)}/{(quiz.totalQuestions ?? quiz.questionsCount ?? 0)} questions
                      </div>
                      <div className={cn("flex items-center gap-1 font-medium", getDifficultyColor(quiz.difficulty))}>
                        <Target className="h-4 w-4" />
                        {quiz.difficulty}
                      </div>
                    </div>
                    {quiz.subjects && quiz.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {quiz.subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {quiz.status === 'COMPLETED' && quiz.accuracy !== undefined && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {quiz.accuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {quiz.correctAnswers}/{quiz.totalQuestions} correct
                        </div>
                      </div>
                    )}
                    {quiz.score !== undefined && (
                      <Badge variant="secondary" className="text-sm">
                        Score: {quiz.score}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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