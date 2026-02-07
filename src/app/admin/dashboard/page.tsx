'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdminDashboard } from '@/hooks/use-admin-dashboard';
import { StatsCards } from '@/components/admin/dashboard/stats-cards';
import { SpecialtyManagement } from '@/components/admin/specialties/specialty-management';

/**
 * Admin Dashboard Overview Page
 *
 * Simplified dashboard showing only key metrics for admin users.
 * Displays essential statistics: users, content, activity, and revenue.
 */
export default function AdminDashboardPage() {
  const {
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    hasError,
    isRefreshing
  } = useAdminDashboard();

  return (
    <div className="flex-1 p-6 space-y-6 text-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of your trusted medical education platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics Only */}
      <StatsCards stats={stats} loading={loading} error={error} />

      {/* Specialty Management Section */}
      <SpecialtyManagement />
    </div>
  );
}
