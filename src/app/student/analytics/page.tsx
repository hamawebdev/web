// @ts-nocheck
'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import { AnalyticsSessionsTable } from '@/components/student/analytics/analytics-sessions-table';
import { AnalyticsChartsGrid } from '@/components/student/analytics/analytics-charts-grid';
import { SessionTypeFilter } from '@/components/student/analytics/session-type-filter';
import { ViewToggle, useViewToggle } from '@/components/student/analytics/view-toggle';
import { useAnalyticsSessions, useSessionTypeState } from '@/hooks/use-analytics-sessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';

export default function StudentAnalyticsPage() {
  const { sessionType, setSessionType } = useSessionTypeState();
  const { sessions, loading, error, refetch } = useAnalyticsSessions({ sessionType });
  const { viewMode, setViewMode, isInitialized } = useViewToggle('table');

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    Statistiques de vos sessions
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                    Suivez vos performances et votre progression
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refetch}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
              <SessionTypeFilter
                value={sessionType}
                onChange={setSessionType}
                disabled={loading}
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Analytics Table */}
          <AnalyticsSessionsTable
            sessions={sessions}
            loading={loading}
            className="mb-6"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
