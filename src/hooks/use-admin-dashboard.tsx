'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminService, UniversityService } from '@/lib/api-services';
import { DashboardStats } from '@/types/api';
import { toast } from 'sonner';

// Interface for admin dashboard state
interface AdminDashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Hook for managing admin dashboard data
export function useAdminDashboard() {
  const [state, setState] = useState<AdminDashboardState>({
    stats: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔍 Fetching dashboard stats...');
      const response = await AdminService.getDashboardStats();

      console.log('📊 Raw API response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);

      if (response.success) {
        // Try different response structure patterns
        let statsData = null;

        // Cast response to any to handle unknown nested structure
        const responseAny = response as any;

        // Pattern 1: response.data.data.data (nested)
        if (responseAny.data?.data?.data) {
          statsData = responseAny.data.data.data;
          console.log('✅ Using pattern 1 (nested): response.data.data.data');
        }
        // Pattern 2: response.data.data
        else if (responseAny.data?.data) {
          statsData = responseAny.data.data;
          console.log('✅ Using pattern 2: response.data.data');
        }
        // Pattern 3: response.data
        else if (response.data) {
          statsData = response.data;
          console.log('✅ Using pattern 3: response.data');
        }
        // Pattern 4: direct response (if API returns data directly)
        else {
          statsData = response;
          console.log('✅ Using pattern 4: direct response');
        }

        console.log('📈 Final stats data:', statsData);
        console.log('🔍 All available properties:', Object.keys(statsData || {}));

        // Transform the flat API response to our expected structure
        const transformedStats: DashboardStats = {
          users: {
            total: statsData?.totalUsers || 0,
            students: statsData?.totalStudents || 0,
            employees: statsData?.totalEmployees || 0,
            admins: statsData?.totalAdmins || 0,
            newThisMonth: statsData?.newUsersThisMonth || 0,
          },
          content: {
            totalQuizzes: statsData?.totalQuizzes || 0,
            totalExams: statsData?.totalExams || 0,
            totalQuestions: statsData?.totalQuestions || 0,
            totalSessions: statsData?.totalSessions || 0,
          },
          activity: {
            activeUsers: statsData?.activeUsers || 0,
            sessionsToday: statsData?.sessionsToday || 0,
            averageSessionScore: statsData?.averageSessionScore || 0,
          },
          subscriptions: {
            active: statsData?.activeSubscriptions || 0,
            expired: statsData?.expiredSubscriptions || 0,
            revenue: statsData?.totalRevenue || 0,
          },
        };

        console.log('✅ Transformed stats:', transformedStats);
        console.log('👥 Users data:', transformedStats.users);
        console.log('📚 Content data:', transformedStats.content);
        console.log('🎯 Activity data:', transformedStats.activity);
        console.log('💰 Subscriptions data:', transformedStats.subscriptions);

        // Use the transformed data instead of raw statsData
        statsData = transformedStats;

        setState(prev => ({
          ...prev,
          stats: statsData,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        }));
      } else {
        console.error('❌ API response not successful:', response);
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to fetch dashboard statistics';
        throw new Error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard statistics';

      console.error('❌ Dashboard stats fetch error:', error);
      console.error('❌ Error message:', errorMessage);

      setState(prev => ({
        ...prev,
        stats: null,
        loading: false,
        error: errorMessage,
        lastUpdated: null,
      }));

      // Show error toast
      toast.error('Dashboard Error', {
        description: errorMessage,
      });
    }
  }, []);

  // Refresh dashboard data
  const refreshDashboard = useCallback(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardStats]);

  return {
    // Data
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Actions
    refresh: refreshDashboard,
    
    // Computed values for easy access
    userStats: state.stats?.users || null,
    contentStats: state.stats?.content || null,
    activityStats: state.stats?.activity || null,
    subscriptionStats: state.stats?.subscriptions || null,
    
    // Helper flags
    hasData: !!state.stats,
    hasError: !!state.error,
    isRefreshing: state.loading && !!state.stats, // Loading but has existing data
  };
}

// Export types for use in components
export type { AdminDashboardState };
