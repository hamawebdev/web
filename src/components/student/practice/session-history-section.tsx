// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  History, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen, 
  Target,
  Filter,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/loading-states';
import { EmptyState } from '@/components/ui/empty-state';
import { useSessionResults } from '@/hooks/use-session-results';

export function SessionHistorySection() {
  const router = useRouter();
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  // Use real API data
  const { results, loading, error, updateFilters } = useSessionResults({
    answerType: 'all',
    page: 1,
    limit: 20
  });

  // Extract data from API response structure
  const historyData = results?.data?.data || {
    questions: [],
    summary: {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      unansweredQuestions: 0,
      sessionsIncluded: 0,
      averageScore: 0
    },
    pagination: {
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 20
    }
  };

  // Group questions by session
  const groupedSessions = historyData.questions?.reduce((acc, question) => {
    const sessionId = question.sessionId;
    if (!acc[sessionId]) {
      acc[sessionId] = {
        id: sessionId,
        title: question.sessionTitle,
        type: question.sessionType,
        completedAt: question.completedAt,
        questions: []
      };
    }
    acc[sessionId].questions.push(question);
    return acc;
  }, {}) || {};

  const sessions = Object.values(groupedSessions);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const getSessionScore = (questions) => {
    const correct = questions.filter(q => q.isCorrect).length;
    return Math.round((correct / questions.length) * 100);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-accent-foreground';
    return 'text-destructive';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewSession = (sessionId) => {
    router.push(`/student/quiz/results/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session History</h2>
          <p className="text-muted-foreground">
            Review your past practice sessions and track progress
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={(value) => {
            setFilterType(value);
            handleFilterChange({
              sessionType: value === 'all' ? undefined : value,
              page: 1
            });
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PRACTICE">Practice</SelectItem>
              <SelectItem value="EXAM">Exams</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPeriod} onValueChange={(value) => {
            setFilterPeriod(value);
            const now = new Date();
            let completedAfter;

            if (value === 'week') {
              completedAfter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            } else if (value === 'month') {
              completedAfter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            }

            handleFilterChange({
              completedAfter,
              page: 1
            });
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <History className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{historyData.summary.sessionsIncluded}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
                <p className="text-2xl font-bold">{historyData.summary.correctAnswers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Incorrect Answers</p>
                <p className="text-2xl font-bold">{historyData.summary.incorrectAnswers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{historyData.summary.averageScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Session History"
          description="Complete some practice sessions to see your history here."
          action={
            <Button onClick={() => router.push('/student/practice?tab=create')}>
              Start Practicing
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const score = getSessionScore(session.questions);
            return (
              <Card
                key={session.id}
                onClick={() => handleViewSession(session.id)}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <Badge variant="outline">{session.type}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.completedAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {session.questions.length} questions
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.questions.filter(q => q.isCorrect).length}/{session.questions.length} correct
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSession(session.id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
