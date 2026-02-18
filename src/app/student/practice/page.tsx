// @ts-nocheck
'use client';

import React from 'react';
import { AddCircle, FileText } from '@solar-icons/react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { FullPageLoading } from '@/components/loading-states';
import { useStudentAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { SessionList } from '@/components/student/shared/session-list';
import { useSessionHistory } from '@/hooks/use-session-history';

export default function PracticePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useStudentAuth();

  // Fetch all practice sessions directly
  const {
    sessions: practiceSessions,
    loading: sessionsLoading,
    error: sessionsError,
    pagination,
    refetch: refetchSessions,
    setPage
  } = useSessionHistory('PRACTICE');

  if (loading) {
    return <FullPageLoading message="Loading your account..." />;
  }

  if (!isAuthenticated) return null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold practice-history-gradient-text">
                  Practice History
                </h1>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">View your past practice series</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                onClick={() => router.push('/student/practice/create')}
                className="gap-2 bg-primary hover:bg-primary/90 min-h-[44px] touch-target text-sm sm:text-base"
              >
                <AddCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Create Practice</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>

          {/* Practice History Content */}
          <SessionList
            sessions={practiceSessions || []}
            loading={sessionsLoading}
            error={sessionsError}
            variant="practice"
            pagination={pagination}
            onPageChange={setPage}
            onRefresh={refetchSessions}
            hideHeader
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
