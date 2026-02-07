// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useStudentAuth } from '@/hooks/use-auth';
import { useStudentDashboardStats } from '@/hooks/use-student-dashboard-stats';
import { ErrorBoundary, ApiError } from '@/components/error-boundary';

// Import dashboard components
import StudentWelcome from '@/components/mvpblocks/student-welcome';
import { PerformanceOverview } from '@/components/student/performance-overview';
import { WeeklyPerformanceChart } from '@/components/student/weekly-performance-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Icons are imported by individual components as needed

// Helper function to get year number from year string
function getYearNumber(yearString: string): number {
  const yearMap: { [key: string]: number } = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
    'SIX': 6,
    'SEVEN': 7,
    'FIRST_YEAR': 1,
    'SECOND_YEAR': 2,
    'THIRD_YEAR': 3,
    'FOURTH_YEAR': 4,
    'FIFTH_YEAR': 5,
    'SIXTH_YEAR': 6,
    'SEVENTH_YEAR': 7
  };
  return yearMap[yearString] || 1;
}

export default function StudentDashboard() {
  // Use the student auth hook for proper authentication
  const { isAuthenticated, user, loading, checkAndRedirect } = useStudentAuth();

  // Use the new API hook for dashboard stats data
  const {
    derivedData,
    loading: apiLoading,
    error: apiError,
    refresh: refreshDashboard,
  } = useStudentDashboardStats();

  // Check authentication and redirect if needed
  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect, isAuthenticated, user, loading]);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen text-lg' style={{ background: 'var(--background)' }}>
        <div className='container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 max-w-7xl'>
          <div className='space-y-8'>


            {/* Welcome Section */}
            <div className="flex justify-center">
              <StudentWelcome />
            </div>





            {/* API Loading Indicator */}
            {apiLoading && (
              <div className='bg-primary/10 border border-primary/20 rounded-lg p-[calc(var(--spacing)*4)]'>
                <div className='flex items-center gap-[calc(var(--spacing)*3)]'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
                  <p className='text-sm text-primary-foreground'>
                    Loading latest performance data...
                  </p>
                </div>
              </div>
            )}

            {/* API Error Indicator */}
            <ApiError
              error={apiError}
              onRetry={refreshDashboard}
              onDismiss={() => { }} // Could implement error dismissal if needed
            />



            {/* Dashboard Content - Only show when data is available */}
            {derivedData ? (
              <>


                {/* Weekly Performance Chart - Full Width */}
                <WeeklyPerformanceChart
                  weeklyPerformance={derivedData.weeklyPerformance || []}
                  loading={apiLoading}
                />

              </>
            ) : !apiLoading && !apiError ? (
              /* Show loading skeleton when no data and not loading/error */
              <DashboardLoadingSkeleton />
            ) : null}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// Loading skeleton component
function DashboardLoadingSkeleton() {
  return (
    <div className='space-y-8'>
      {/* Welcome Header Skeleton */}
      <Card className='bg-card border-border shadow-sm'>
        <CardContent className='p-[calc(var(--spacing)*6)]'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-[calc(var(--spacing)*4)]'>
              <div className='h-12 w-12 bg-muted rounded-full animate-pulse'></div>
              <div className='space-y-[calc(var(--spacing)*2)]'>
                <div className='h-6 w-48 bg-muted rounded animate-pulse'></div>
                <div className='h-4 w-32 bg-muted rounded animate-pulse'></div>
              </div>
            </div>
            <div className='h-10 w-32 bg-muted rounded animate-pulse'></div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview Skeleton */}
      <Card className='bg-card border-border shadow-sm'>
        <CardHeader className='pb-[calc(var(--spacing)*4)]'>
          <div className='flex items-center justify-between'>
            <div className='space-y-[calc(var(--spacing)*2)]'>
              <div className='h-6 w-48 bg-muted rounded animate-pulse'></div>
              <div className='h-4 w-32 bg-muted rounded animate-pulse'></div>
            </div>
            <div className='h-6 w-20 bg-muted rounded animate-pulse'></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-[calc(var(--spacing)*4)]'>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className='bg-muted/50 rounded-lg p-[calc(var(--spacing)*4)] animate-pulse'>
                <div className='h-4 bg-muted rounded mb-[calc(var(--spacing)*2)]'></div>
                <div className='h-8 bg-muted rounded mb-[calc(var(--spacing)*1)]'></div>
                <div className='h-3 bg-muted rounded'></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Skeleton - Full Width Layout */}
      <div className='space-y-8'>
        {/* Recent Activity Skeleton - Full Width */}
        <Card className='bg-card border-border shadow-sm'>
          <CardHeader className='pb-[calc(var(--spacing)*4)]'>
            <div className='h-6 w-32 bg-muted rounded animate-pulse'></div>
          </CardHeader>
          <CardContent className='space-y-[calc(var(--spacing)*4)]'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='flex items-center gap-[calc(var(--spacing)*3)] p-[calc(var(--spacing)*3)] bg-card/50 rounded-lg'>
                <div className='h-8 w-8 bg-muted rounded-full animate-pulse'></div>
                <div className='flex-1 space-y-[calc(var(--spacing)*2)]'>
                  <div className='h-4 w-3/4 bg-muted rounded animate-pulse'></div>
                  <div className='h-3 w-1/2 bg-muted rounded animate-pulse'></div>
                </div>
                <div className='h-6 w-12 bg-muted rounded animate-pulse'></div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Analytics & Actions Section Skeleton */}
        <section className='space-y-[calc(var(--spacing)*8)]'>
          {/* Section Header Skeleton */}
          <div className='text-center space-y-[calc(var(--spacing)*2)]'>
            <div className='h-8 w-64 bg-muted rounded animate-pulse mx-auto'></div>
            <div className='h-4 w-96 bg-muted rounded animate-pulse mx-auto'></div>
          </div>

          {/* Enhanced Content Grid Skeleton */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-[calc(var(--spacing)*8)] lg:gap-[calc(var(--spacing)*10)]'>
            {/* Primary Analytics Column Skeleton */}
            <div className='lg:col-span-2 space-y-[calc(var(--spacing)*8)]'>
              {/* Performance Analytics Section Skeleton */}
              <div className='space-y-[calc(var(--spacing)*4)]'>
                <div className='flex items-center gap-[calc(var(--spacing)*3)]'>
                  <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1'></div>
                  <div className='h-6 w-32 bg-muted rounded animate-pulse'></div>
                  <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1'></div>
                </div>
                <Card className='bg-card border-border shadow-sm'>
                  <CardHeader className='pb-[calc(var(--spacing)*4)]'>
                    <div className='h-6 w-48 bg-muted rounded animate-pulse'></div>
                  </CardHeader>
                  <CardContent>
                    <div className='h-64 bg-muted rounded animate-pulse'></div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Hub Section Skeleton */}
              <div className='space-y-[calc(var(--spacing)*4)]'>
                <div className='flex items-center gap-[calc(var(--spacing)*3)]'>
                  <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1'></div>
                  <div className='h-6 w-24 bg-muted rounded animate-pulse'></div>
                  <div className='h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1'></div>
                </div>
                <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/80 via-accent/5 to-muted/10 border border-border/50 shadow-lg'>
                  <div className='relative p-[calc(var(--spacing)*6)]'>
                    <div className='h-6 w-32 bg-muted rounded animate-pulse mb-[calc(var(--spacing)*4)]'></div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[calc(var(--spacing)*4)]'>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className='h-32 bg-muted rounded-lg animate-pulse'></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Progress Sidebar Skeleton */}
            <div className='space-y-[calc(var(--spacing)*6)]'>
              {/* Sidebar Header Skeleton */}
              <div className='text-center lg:text-left space-y-[calc(var(--spacing)*2)]'>
                <div className='h-6 w-32 bg-muted rounded animate-pulse'></div>
                <div className='h-4 w-48 bg-muted rounded animate-pulse'></div>
              </div>

              {/* Progress Cards Skeleton */}
              <div className='space-y-[calc(var(--spacing)*6)]'>
                {/* Study Streak Skeleton */}
                <Card className='bg-card border-border shadow-sm'>
                  <CardHeader className='pb-[calc(var(--spacing)*4)]'>
                    <div className='h-6 w-32 bg-muted rounded animate-pulse'></div>
                  </CardHeader>
                  <CardContent className='space-y-[calc(var(--spacing)*4)]'>
                    <div className='h-12 w-12 bg-muted rounded-full mx-auto animate-pulse'></div>
                    <div className='grid grid-cols-2 gap-[calc(var(--spacing)*3)]'>
                      <div className='h-16 bg-muted rounded animate-pulse'></div>
                      <div className='h-16 bg-muted rounded animate-pulse'></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Status Skeleton */}
                <Card className='bg-card border-border shadow-sm'>
                  <CardHeader className='pb-[calc(var(--spacing)*4)]'>
                    <div className='h-6 w-32 bg-muted rounded animate-pulse'></div>
                  </CardHeader>
                  <CardContent className='space-y-[calc(var(--spacing)*4)]'>
                    <div className='h-4 w-full bg-muted rounded animate-pulse'></div>
                    <div className='h-8 w-24 bg-muted rounded animate-pulse'></div>
                  </CardContent>
                </Card>

                {/* Quick Stats Skeleton */}
                <div className='bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-[calc(var(--spacing)*4)] border border-border/30'>
                  <div className='h-4 w-24 bg-muted rounded animate-pulse mb-[calc(var(--spacing)*3)]'></div>
                  <div className='space-y-[calc(var(--spacing)*2)]'>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className='flex items-center justify-between'>
                        <div className='h-3 w-16 bg-muted rounded animate-pulse'></div>
                        <div className='h-4 w-8 bg-muted rounded animate-pulse'></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



