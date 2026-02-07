// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useQuizSessions } from '@/hooks/use-quiz-api';
import { useSessionResults } from '@/hooks/use-session-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Filter,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  TrendingUp,
  Clock,
  Target,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import sub-components
import { SessionFilters } from './session-filters';
import { SessionCard } from './session-card';

interface SessionAnalyticsListProps {
  className?: string;
}

interface FilterState {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sessionType: 'all' | 'PRACTICE' | 'EXAM';
  sortBy: 'date' | 'score' | 'duration';
  sortOrder: 'asc' | 'desc';
}

export function SessionAnalyticsList({ className }: SessionAnalyticsListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: null, to: null },
    sessionType: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Fetch sessions based on filters - only completed sessions
  const {
    sessions,
    pagination,
    loading: sessionsLoading,
    error: sessionsError
  } = useQuizSessions({
    status: 'COMPLETED', // Always show only completed sessions
    type: filters.sessionType !== 'all' ? filters.sessionType : undefined,
    page: currentPage,
    limit: 10,
    // Add cache busting to ensure fresh data
    _t: Date.now()
  });

  const { 
    data: sessionResults, 
    loading: resultsLoading 
  } = useSessionResults({
    page: currentPage,
    limit: 10
  });

  const isLoading = sessionsLoading || resultsLoading;
  const hasError = sessionsError;

  // Ensure we only show completed sessions - filter client-side as backup
  const allSessions = Array.isArray(sessions) ? sessions : [];

  // Debug: Log session data to understand the structure (uncomment for debugging)
  // useEffect(() => {
  //   if (allSessions.length > 0) {
  //     console.log('🔍 Analytics Debug - Raw sessions:', allSessions.slice(0, 3));
  //     console.log('🔍 Analytics Debug - Session statuses:', allSessions.map(s => ({ id: s.id, status: s.status, score: s.score, percentage: s.percentage })));
  //   }
  // }, [allSessions]);

  const sessionsList = allSessions.filter(session => {
    // Be very strict about what constitutes a completed session
    const hasCompletedStatus = session.status === 'COMPLETED' || session.status === 'completed';
    const hasValidScore = session.score !== undefined && session.score !== null && session.score >= 0;
    const hasValidPercentage = session.percentage !== undefined && session.percentage !== null && session.percentage >= 0;
    const hasCompletedAt = session.completedAt !== undefined && session.completedAt !== null;

    // A session is considered completed if:
    // 1. It has a COMPLETED status, AND
    // 2. It has either a valid score OR percentage, AND
    // 3. It has a completion timestamp
    const isCompleted = hasCompletedStatus && (hasValidScore || hasValidPercentage) && hasCompletedAt;

    // Debug: Log filtered sessions (uncomment for debugging)
    // if (!isCompleted) {
    //   console.log('🚫 Analytics Debug - Filtering out session:', {
    //     id: session.id,
    //     status: session.status,
    //     score: session.score,
    //     percentage: session.percentage,
    //     completedAt: session.completedAt,
    //     hasCompletedStatus,
    //     hasValidScore,
    //     hasValidPercentage,
    //     hasCompletedAt
    //   });
    // }

    return isCompleted;
  });

  // Debug: Log filtered results (uncomment for debugging)
  // console.log('🔍 SessionAnalytics Debug - Filtered sessions:', sessionsList.length, 'out of', allSessions.length);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle load more
  const handleLoadMore = () => {
    if (pagination && pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Error state
  if (hasError && !isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Session Analytics
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Detailed breakdown of your completed quiz and exam sessions
            </p>
          </div>
        </div>

        <Card className="border-destructive/20">
          <CardContent className="p-8 text-center">
            <div className="text-destructive mb-4">
              <BookOpen className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unable to Load Completed Sessions</h3>
            <p className="text-muted-foreground mb-4">
              {sessionsError || 'There was an error loading your completed session data.'}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="btn-modern"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && sessionsList.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Session Cards Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Session Analytics
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Detailed breakdown of your completed quiz and exam sessions
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="btn-modern w-full sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? (
            <ChevronUp className="h-4 w-4 ml-2" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-2" />
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <SessionFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
        />
      )}



      {/* Sessions List */}
      <div className="space-y-4">
        {sessionsList.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed sessions found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.sessionType !== 'all'
                  ? 'Try adjusting your filters to see more completed sessions.'
                  : 'Complete some quizzes to see your analytics here.'}
              </p>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                <Filter className="h-4 w-4 mr-2" />
                Adjust Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {sessionsList.map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                index={index}
              />
            ))}
          </>
        )}
      </div>

      {/* Load More / Pagination */}
      {pagination && pagination.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="btn-modern"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Loading...
              </>
            ) : (
              <>
                Load More Sessions
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
