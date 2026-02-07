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
  Eye,
  Search,
  SortAsc,
  SortDesc,
  Play,
  BarChart3,
  Trophy,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { DateRangePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/loading-states';
import { EmptyState } from '@/components/ui/empty-state';
import { useQuizHistory, QuizHistoryFilters } from '@/hooks/use-quiz-history';
import { useStudentAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface EnhancedSessionHistorySectionProps {
  defaultFilters?: {
    status?: 'COMPLETED' | 'IN_PROGRESS' | 'ABANDONED';
    type?: 'PRACTICE' | 'EXAM';
  };
  hideActionButtons?: boolean;
  allowedTypes?: string[];
}

export function EnhancedSessionHistorySection({
  defaultFilters = {},
  hideActionButtons = false,
  allowedTypes = ['PRACTICE', 'EXAM']
}: EnhancedSessionHistorySectionProps = {}) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Check authentication first
  const { isAuthenticated, loading: authLoading } = useStudentAuth();

  // Local search state for immediate UI feedback
  const [searchValue, setSearchValue] = useState('');

  // Use the new quiz history hook only when authenticated
  const {
    sessions,
    pagination,
    loading,
    error,
    summary,
    filters,
    updateFilters
  } = useQuizHistory(defaultFilters);

  // Debug logging
  console.log('🔍 Enhanced Session History State:', {
    sessions,
    sessionsType: typeof sessions,
    sessionsIsArray: Array.isArray(sessions),
    sessionsLength: sessions?.length,
    pagination,
    loading,
    error,
    summary,
    filters,
    defaultFilters,
    allowedTypes
  });

  // Filter sessions by allowed types (this is the only filtering we need to do here)
  const filteredSessions = sessions ? sessions.filter(session => {
    // Filter by allowed types
    return allowedTypes.includes(session.type);
  }) : null;

  console.log('🔍 Type-filtered Sessions Debug:', {
    originalSessions: sessions,
    originalLength: sessions?.length,
    filteredSessions,
    filteredLength: filteredSessions?.length,
    allowedTypes,
    sessionTypes: sessions?.map(s => s.type)
  });

  // Use the summary from the hook, but adjust for allowed types if needed
  const customSummary = filteredSessions && summary ? {
    totalSessions: filteredSessions.length,
    completedSessions: filteredSessions.filter(s => s.status === 'COMPLETED').length,
    averageScore: filteredSessions.length > 0
      ? Math.round(filteredSessions.reduce((sum, session) => sum + (session.percentage || 0), 0) / filteredSessions.length)
      : 0,
    practiceCount: filteredSessions.filter(s => s.type === 'PRACTICE').length,
    examCount: filteredSessions.filter(s => s.type === 'EXAM').length
  } : summary;

  // Handle filter updates - now purely client-side
  const handleFilterChange = (key: keyof QuizHistoryFilters, value: any) => {
    updateFilters({ [key]: value, page: 1 }); // Reset to page 1 when filtering
  };

  // Handle search updates - purely client-side
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    updateFilters({ search: value, page: 1 });
  };

  // Update filters when date range changes - purely client-side
  useEffect(() => {
    const dateFromStr = dateFrom ? dateFrom.toISOString().split('T')[0] : undefined;
    const dateToStr = dateTo ? dateTo.toISOString().split('T')[0] : undefined;

    updateFilters({
      dateFrom: dateFromStr,
      dateTo: dateToStr,
      page: 1
    });
  }, [dateFrom, dateTo, updateFilters]);

  // Date change handlers
  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleSortChange = (sortBy: string) => {
    const newOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    updateFilters({ sortBy, sortOrder: newOrder });
  };

  // Utility functions
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': 'default',
      'IN_PROGRESS': 'secondary',
      'ABANDONED': 'destructive',
      'NOT_STARTED': 'outline'
    };
    return variants[status] || 'outline';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewSession = (sessionId: number) => {
    router.push(`/student/quiz/results/${sessionId}`);
  };

  const handleRetakeSession = (sessionId: number) => {
    // Navigate to create a new session based on the same quiz/exam
    router.push(`/student/practice?retake=${sessionId}`);
  };

  // Show loading while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2">
          {authLoading ? 'Authenticating...' : 'Loading quiz history...'}
        </span>
      </div>
    );
  }

  // If not authenticated, don't render anything (auth hook will handle redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load quiz history: {error}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-[calc(var(--spacing)*8)]">
      {/* Enhanced Summary Statistics */}
      {customSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[calc(var(--spacing)*4)] lg:gap-[calc(var(--spacing)*6)]">
          <Card className="card-hover-lift bg-gradient-to-br from-card via-card to-muted/10 border-0 shadow-lg">
            <CardContent className="p-[calc(var(--spacing)*4)] sm:p-[calc(var(--spacing)*6)]">
              <div className="flex items-center gap-[calc(var(--spacing)*3)]">
                <div className="p-[calc(var(--spacing)*2)] bg-chart-1/10 rounded-lg animate-pulse-soft">
                  <History className="h-5 w-5 text-chart-1" />
                </div>
                <div className="space-y-[calc(var(--spacing)*1)]">
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold tracking-tight animate-counter-up">{customSummary.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-lift bg-gradient-to-br from-card via-card to-muted/10 border-0 shadow-lg">
            <CardContent className="p-[calc(var(--spacing)*4)] sm:p-[calc(var(--spacing)*6)]">
              <div className="flex items-center gap-[calc(var(--spacing)*3)]">
                <div className="p-[calc(var(--spacing)*2)] bg-chart-2/10 rounded-lg animate-pulse-soft">
                  <CheckCircle className="h-5 w-5 text-chart-2" />
                </div>
                <div className="space-y-[calc(var(--spacing)*1)]">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold tracking-tight animate-counter-up">{customSummary.completedSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-lift bg-gradient-to-br from-card via-card to-muted/10 border-0 shadow-lg">
            <CardContent className="p-[calc(var(--spacing)*4)] sm:p-[calc(var(--spacing)*6)]">
              <div className="flex items-center gap-[calc(var(--spacing)*3)]">
                <div className="p-[calc(var(--spacing)*2)] bg-chart-5/10 rounded-lg animate-pulse-soft">
                  <TrendingUp className="h-5 w-5 text-chart-5" />
                </div>
                <div className="space-y-[calc(var(--spacing)*1)]">
                  <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold tracking-tight animate-counter-up">{customSummary.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover-lift bg-gradient-to-br from-card via-card to-muted/10 border-0 shadow-lg">
            <CardContent className="p-[calc(var(--spacing)*4)] sm:p-[calc(var(--spacing)*6)]">
              <div className="flex items-center gap-[calc(var(--spacing)*3)]">
                <div className="p-[calc(var(--spacing)*2)] bg-chart-3/10 rounded-lg animate-pulse-soft">
                  <Target className="h-5 w-5 text-chart-3" />
                </div>
                <div className="space-y-[calc(var(--spacing)*1)]">
                  <p className="text-sm font-medium text-muted-foreground">Practice Sessions</p>
                  <p className="text-2xl font-bold tracking-tight animate-counter-up">{customSummary.practiceCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Search and Filters Section with Improved Design */}
      <Card className="group relative overflow-hidden bg-gradient-to-br from-card via-card/98 to-accent/8 border border-border/30 shadow-xl hover:shadow-2xl transition-all duration-500 ease-out hover:border-primary/20">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        <CardHeader className="relative pb-[calc(var(--spacing)*6)] pt-[calc(var(--spacing)*8)] px-[calc(var(--spacing)*8)]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-[calc(var(--spacing)*6)]">
            <div className="space-y-[calc(var(--spacing)*3)] flex-1">
              <CardTitle className="flex items-center gap-[calc(var(--spacing)*4)] text-2xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">
                <div className="relative">
                  <div className="p-[calc(var(--spacing)*3)] bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300 group-hover:scale-110 shadow-lg">
                    <History className="h-6 w-6 text-primary transition-transform duration-300 group-hover:rotate-12" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-chart-2 rounded-full animate-ping opacity-60"></div>
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Session History
                </span>
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground text-pretty leading-relaxed max-w-2xl">
                View and manage your quiz and exam session history with advanced filtering and search capabilities
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[calc(var(--spacing)*3)]">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "group/btn relative overflow-hidden flex items-center gap-[calc(var(--spacing)*3)] px-6 py-3 border-border/50 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl",
                  showFilters && "bg-primary/10 border-primary/30 text-primary shadow-lg scale-105"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></div>
                <Filter className={cn(
                  "h-5 w-5 transition-all duration-200 group-hover/btn:rotate-180",
                  showFilters && "rotate-180"
                )} />
                <span className="font-semibold">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-[calc(var(--spacing)*8)] px-[calc(var(--spacing)*8)] pb-[calc(var(--spacing)*8)]">
          {/* Enhanced Search Bar with Modern Design */}
          <div className="relative group/search">
            <div className="absolute left-[calc(var(--spacing)*4)] top-1/2 transform -translate-y-1/2 transition-all duration-200 group-focus-within/search:text-primary group-focus-within/search:scale-110">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              placeholder="Search sessions by title or type..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-[calc(var(--spacing)*12)] pr-[calc(var(--spacing)*12)] h-14 text-base bg-gradient-to-r from-background/80 to-background/60 border-border/30 focus:border-primary/50 focus:ring-primary/20 focus:bg-background transition-all duration-300 rounded-xl shadow-inner hover:shadow-lg focus:shadow-xl"
            />
            {searchValue && (
              <div className="absolute right-[calc(var(--spacing)*4)] top-1/2 transform -translate-y-1/2">
                <div className="flex items-center gap-[calc(var(--spacing)*2)]">
                  <div className="h-5 w-5 text-chart-2 animate-pulse">
                    <Search className="h-5 w-5" />
                  </div>
                  <button
                    onClick={() => handleSearchChange('')}
                    className="p-1 hover:bg-muted/50 rounded-full transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Quick Filter Chips with Better Design */}
          <div className="flex flex-wrap gap-[calc(var(--spacing)*3)] sm:gap-[calc(var(--spacing)*4)]">
            <Button
              variant={!filters.type ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ type: undefined, page: 1 })}
              className="group/chip relative overflow-hidden px-4 py-2 transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/chip:translate-x-full transition-transform duration-500"></div>
              <span className="relative font-semibold">All Types</span>
            </Button>
            <Button
              variant={filters.type === 'PRACTICE' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ type: 'PRACTICE', page: 1 })}
              className="group/chip relative overflow-hidden px-4 py-2 practice-button transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-chart-1/10 to-transparent -translate-x-full group-hover/chip:translate-x-full transition-transform duration-500"></div>
              <Target className="h-4 w-4 mr-[calc(var(--spacing)*2)] transition-transform duration-200 group-hover/chip:rotate-12" />
              <span className="relative font-semibold">Practice Only</span>
            </Button>
            <Button
              variant={filters.type === 'EXAM' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ type: 'EXAM', page: 1 })}
              className="group/chip relative overflow-hidden px-4 py-2 exam-button transition-all duration-300 hover:scale-105 hover:shadow-lg rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-chart-5/10 to-transparent -translate-x-full group-hover/chip:translate-x-full transition-transform duration-500"></div>
              <Trophy className="h-4 w-4 mr-[calc(var(--spacing)*2)] transition-transform duration-200 group-hover/chip:rotate-12" />
              <span className="relative font-semibold">Exams Only</span>
            </Button>
          </div>

          {/* Enhanced Collapsible Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-[calc(var(--spacing)*6)] pt-[calc(var(--spacing)*2)] border-t border-border/50">
              {/* Enhanced Date Range Filter */}
              <div className="space-y-[calc(var(--spacing)*3)]">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-[calc(var(--spacing)*2)]">
                    <Calendar className="h-4 w-4 text-primary" />
                    Date Range
                  </label>
                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="h-auto p-[calc(var(--spacing)*1)] text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="bg-muted/30 p-[calc(var(--spacing)*3)] rounded-lg">
                  <DateRangePicker
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                    onDateFromChange={handleDateFromChange}
                    onDateToChange={handleDateToChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[calc(var(--spacing)*4)] lg:gap-[calc(var(--spacing)*6)]">
                {/* Enhanced Type Filter */}
                <div className="space-y-[calc(var(--spacing)*3)]">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-[calc(var(--spacing)*2)]">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Type
                  </label>
                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="PRACTICE">Practice</SelectItem>
                      <SelectItem value="EXAM">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={filters.sortBy || 'completedAt'}
                    onValueChange={(value) => handleFilterChange('sortBy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completedAt">Completion Date</SelectItem>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Order</label>
                  <Select
                    value={filters.sortOrder || 'desc'}
                    onValueChange={(value) => handleFilterChange('sortOrder', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        <div className="flex items-center gap-2">
                          <SortDesc className="h-4 w-4" />
                          Descending
                        </div>
                      </SelectItem>
                      <SelectItem value="asc">
                        <div className="flex items-center gap-2">
                          <SortAsc className="h-4 w-4" />
                          Ascending
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Enhanced Session List */}
      {!filteredSessions || filteredSessions.length === 0 ? (
        <div className="animate-fade-in-up">
          <EmptyState
            icon={History}
            title="No Session History"
            description="Complete some practice or exam sessions to see your history here."
          />
        </div>
      ) : (
        <div className="space-y-[calc(var(--spacing)*4)] lg:space-y-[calc(var(--spacing)*6)]">
          {filteredSessions.map((session, index) => (
            <Card
              key={session.id}
              onClick={() => handleViewSession(session.id)}
              className={cn(
                "group relative overflow-hidden bg-gradient-to-br from-card via-card/95 to-accent/5 border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out animate-fade-in-up cursor-pointer",
                "hover:scale-[1.02] hover:border-primary/20 hover:bg-gradient-to-br hover:from-card hover:via-accent/10 hover:to-primary/5",
                "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:translate-x-[-100%] before:transition-transform before:duration-700 hover:before:translate-x-[100%]",
                `animate-delay-${Math.min(index * 100, 300)}`
              )}
            >
              <CardContent className="relative p-[calc(var(--spacing)*8)] space-y-[calc(var(--spacing)*6)]">
                {/* Status Indicator Line */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1 transition-all duration-300",
                  session.status === 'COMPLETED' && "bg-gradient-to-r from-chart-2 to-chart-4",
                  session.status === 'IN_PROGRESS' && "bg-gradient-to-r from-chart-3 to-chart-1",
                  session.status === 'ABANDONED' && "bg-gradient-to-r from-muted to-muted-foreground"
                )} />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-[calc(var(--spacing)*6)] lg:gap-[calc(var(--spacing)*8)]">
                  <div className="space-y-[calc(var(--spacing)*5)] flex-1">
                    {/* Enhanced Session Header with Better Hierarchy */}
                    <div className="space-y-[calc(var(--spacing)*3)]">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-[calc(var(--spacing)*3)]">
                        <h3 className="font-bold text-xl sm:text-2xl tracking-tight text-balance leading-tight group-hover:text-primary transition-colors duration-300">
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-[calc(var(--spacing)*2)] flex-shrink-0">
                          <Badge
                            variant={getStatusBadge(session.status)}
                            className="font-semibold px-3 py-1 transition-all duration-200 hover:scale-105"
                          >
                            {session.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-semibold px-3 py-1 transition-all duration-200 hover:scale-105",
                              session.type === 'PRACTICE' && "practice-badge border-chart-1/30 bg-chart-1/10 text-chart-1 hover:bg-chart-1/20",
                              session.type === 'EXAM' && "exam-badge border-chart-5/30 bg-chart-5/10 text-chart-5 hover:bg-chart-5/20"
                            )}
                          >
                            {session.type}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Session Metadata with Modern UX Spacing */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[calc(var(--spacing)*6)] lg:gap-[calc(var(--spacing)*8)] text-sm">
                      <div className="flex items-start gap-[calc(var(--spacing)*4)] group/meta p-[calc(var(--spacing)*3)] rounded-xl hover:bg-muted/20 transition-all duration-200">
                        <div className="p-[calc(var(--spacing)*3)] bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl group-hover/meta:from-chart-1/20 group-hover/meta:to-chart-1/10 transition-all duration-200 group-hover/meta:scale-110 flex-shrink-0">
                          <Calendar className="h-5 w-5 text-muted-foreground group-hover/meta:text-chart-1 transition-colors duration-200" />
                        </div>
                        <div className="space-y-[calc(var(--spacing)*1)] min-w-0 flex-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Date</span>
                          <span className="font-bold text-foreground text-base leading-tight block">
                            {session.completedAt ? formatDate(session.completedAt) : formatDate(session.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-[calc(var(--spacing)*4)] group/meta p-[calc(var(--spacing)*3)] rounded-xl hover:bg-muted/20 transition-all duration-200">
                        <div className="p-[calc(var(--spacing)*3)] bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl group-hover/meta:from-chart-2/20 group-hover/meta:to-chart-2/10 transition-all duration-200 group-hover/meta:scale-110 flex-shrink-0">
                          <BookOpen className="h-5 w-5 text-muted-foreground group-hover/meta:text-chart-2 transition-colors duration-200" />
                        </div>
                        <div className="space-y-[calc(var(--spacing)*1)] min-w-0 flex-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Questions</span>
                          <span className="font-bold text-foreground text-base leading-tight block">{session.questionsCount}</span>
                        </div>
                      </div>

                      {session.status === 'COMPLETED' && (
                        <div className="flex items-start gap-[calc(var(--spacing)*4)] group/meta p-[calc(var(--spacing)*3)] rounded-xl hover:bg-muted/20 transition-all duration-200">
                          <div className="p-[calc(var(--spacing)*3)] bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl group-hover/meta:from-chart-3/20 group-hover/meta:to-chart-3/10 transition-all duration-200 group-hover/meta:scale-110 flex-shrink-0">
                            <Target className="h-5 w-5 text-muted-foreground group-hover/meta:text-chart-3 transition-colors duration-200" />
                          </div>
                          <div className="space-y-[calc(var(--spacing)*1)] min-w-0 flex-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Answered</span>
                            <span className="font-bold text-foreground text-base leading-tight block">{session.answersCount}/{session.questionsCount}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Progress Bar for In Progress Sessions */}
                    {session.status === 'IN_PROGRESS' && (
                      <div className="space-y-[calc(var(--spacing)*3)] p-[calc(var(--spacing)*4)] bg-gradient-to-br from-chart-3/10 to-chart-3/5 rounded-xl border border-chart-3/20">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-foreground">Progress</span>
                          <span className="text-sm font-bold text-chart-3 bg-chart-3/10 px-2 py-1 rounded-full">
                            {session.answersCount}/{session.questionsCount}
                          </span>
                        </div>
                        <Progress
                          value={(session.answersCount / session.questionsCount) * 100}
                          className="h-4 progress-animated bg-chart-3/20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Enhanced Score and Actions Section */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-[calc(var(--spacing)*6)] lg:gap-[calc(var(--spacing)*8)]">
                    {/* Enhanced Score Display with Improved Large Screen Layout */}
                    {session.status === 'COMPLETED' && (
                      <div className="relative group/score lg:min-w-[280px] xl:min-w-[320px]">
                        <div className="text-center lg:text-left bg-gradient-to-br from-muted/20 via-muted/10 to-accent/5 p-[calc(var(--spacing)*6)] lg:p-[calc(var(--spacing)*8)] rounded-2xl border border-border/30 group-hover/score:border-primary/30 transition-all duration-300 group-hover/score:shadow-xl">
                          <div className="space-y-[calc(var(--spacing)*4)] lg:space-y-[calc(var(--spacing)*6)]">
                            {/* Score Header */}
                            <div className="flex items-center justify-center lg:justify-start gap-[calc(var(--spacing)*2)]">
                              <div className="w-3 h-3 bg-gradient-to-r from-primary to-chart-1 rounded-full animate-pulse"></div>
                              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Performance Score</span>
                            </div>

                            {/* Main Score Display */}
                            <div className="space-y-[calc(var(--spacing)*3)]">
                              <div className="relative">
                                <p className={cn(
                                  "text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter leading-none animate-counter-up tabular-nums transition-all duration-300 group-hover/score:scale-105",
                                  getScoreColor(session.percentage)
                                )}>
                                  {Math.round(session.percentage)}%
                                </p>
                                {/* Score indicator line */}
                                <div className={cn(
                                  "absolute -bottom-2 left-0 lg:left-0 right-0 lg:right-auto lg:w-16 h-1 rounded-full transition-all duration-300",
                                  session.percentage >= 80 ? "bg-gradient-to-r from-chart-2 to-chart-4" :
                                  session.percentage >= 60 ? "bg-gradient-to-r from-chart-3 to-chart-1" :
                                  "bg-gradient-to-r from-destructive to-chart-5"
                                )}></div>
                              </div>

                              {/* Detailed Score Info */}
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[calc(var(--spacing)*3)] lg:gap-[calc(var(--spacing)*4)]">
                                <div className="flex items-center justify-center lg:justify-start gap-[calc(var(--spacing)*2)]">
                                  <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                                  <p className="text-base font-bold text-muted-foreground">
                                    {session.score}/{session.questionsCount} correct
                                  </p>
                                </div>

                                {/* Performance Badge */}
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                                  session.percentage >= 80 ? "bg-chart-2/20 text-chart-2" :
                                  session.percentage >= 60 ? "bg-chart-3/20 text-chart-3" :
                                  "bg-destructive/20 text-destructive"
                                )}>
                                  {session.percentage >= 80 ? "Excellent" :
                                   session.percentage >= 60 ? "Good" : "Needs Work"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Action Buttons with Improved Design */}
                    {!hideActionButtons && (
                      <div className="flex flex-col gap-[calc(var(--spacing)*3)] lg:flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {session.status === 'COMPLETED' ? (
                          <div className="flex flex-col sm:flex-row gap-[calc(var(--spacing)*2)]">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewSession(session.id);
                              }}
                              className="group/btn relative overflow-hidden flex items-center gap-[calc(var(--spacing)*2)] px-4 py-2 border-border/50 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></div>
                              <Eye className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" />
                              <span className="font-semibold">View Results</span>
                            </Button>
                            {session.type === 'PRACTICE' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetakeSession(session.id);
                                }}
                                className="group/btn relative overflow-hidden flex items-center gap-[calc(var(--spacing)*2)] px-4 py-2 hover:bg-chart-2/10 hover:text-chart-2 transition-all duration-300 hover:scale-105"
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-chart-2/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></div>
                                <Play className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110 group-hover/btn:rotate-12" />
                                <span className="font-semibold">Retake</span>
                              </Button>
                            )}
                          </div>
                        ) : session.status === 'IN_PROGRESS' ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/quiz/${session.id}`);
                            }}
                            className="group/btn relative overflow-hidden flex items-center gap-[calc(var(--spacing)*2)] px-6 py-3 bg-gradient-to-r from-primary to-chart-1 hover:from-primary/90 hover:to-chart-1/90 text-primary-foreground shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            <Play className="h-5 w-5 transition-transform duration-200 group-hover/btn:scale-110 group-hover/btn:translate-x-1" />
                            <span className="font-bold">Continue</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/quiz/${session.id}`);
                            }}
                            className="group/btn relative overflow-hidden flex items-center gap-[calc(var(--spacing)*2)] px-4 py-2 border-border/50 hover:border-primary/50 bg-background/50 hover:bg-primary/5 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500"></div>
                            <Play className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" />
                            <span className="font-semibold">Start</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * (filters.limit || 20)) + 1} to{' '}
                    {Math.min(pagination.currentPage * (filters.limit || 20), pagination.totalItems || 0)} of{' '}
                    {pagination.totalItems || 0} sessions
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.currentPage <= 1}
                      onClick={() => updateFilters({ page: (filters.page || 1) - 1 })}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() => updateFilters({ page: (filters.page || 1) + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
