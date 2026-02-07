// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { TimeBasedAnalytics } from '@/types/api';
import { toast } from 'sonner';

interface TimeBasedAnalyticsState {
  analytics: TimeBasedAnalytics | null;
  dateRange: { start: string; end: string };
  loading: boolean;
  error: string | null;
}

export function useTimeBasedAnalytics(initialDateRange?: { start: string; end: string }) {
  // Default to last 30 days if no range provided
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [state, setState] = useState<TimeBasedAnalyticsState>({
    analytics: null,
    dateRange: initialDateRange || { start: defaultStartDate, end: defaultEndDate },
    loading: true,
    error: null
  });

  // Load time-based analytics
  const loadAnalytics = useCallback(async (dateRange?: { start: string; end: string }) => {
    const rangeToUse = dateRange || state.dateRange;
    
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await StudentService.getTimeBasedAnalytics(rangeToUse);
      
      if (response.success) {
        setState(prev => ({
          ...prev,
          analytics: response.data,
          loading: false
        }));
      } else {
        setState(prev => ({
          ...prev,
          error: response.error || 'Failed to load time-based analytics',
          loading: false
        }));
        // Silently handle error since analytics are optional
        console.warn('Time-based analytics unavailable:', response.error);
      }
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        error: err.message || 'Failed to load time-based analytics',
        loading: false
      }));
      // Silently handle error since analytics are optional
      console.warn('Time-based analytics error:', err.message);
    }
  }, [state.dateRange]);

  // Set date range
  const setDateRange = useCallback((start: string, end: string) => {
    if (new Date(start) > new Date(end)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    const newRange = { start, end };
    setState(prev => ({
      ...prev,
      dateRange: newRange
    }));
    
    loadAnalytics(newRange);
  }, [loadAnalytics]);

  // Set predefined date ranges
  const setLast7Days = useCallback(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange(start, end);
  }, [setDateRange]);

  const setLast30Days = useCallback(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange(start, end);
  }, [setDateRange]);

  const setLast90Days = useCallback(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateRange(start, end);
  }, [setDateRange]);

  const setThisMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setDateRange(start, end);
  }, [setDateRange]);

  const setLastMonth = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    setDateRange(start, end);
  }, [setDateRange]);

  // Get analytics insights
  const getAnalyticsInsights = useCallback(() => {
    if (!state.analytics) return [];

    const insights: string[] = [];
    const { dailyPerformance, weeklyTrends, monthlyProgress } = state.analytics;

    // Daily performance insights
    if (dailyPerformance.length > 0) {
      const totalDays = dailyPerformance.length;
      const activeDays = dailyPerformance.filter(day => day.sessionsCompleted > 0).length;
      const consistencyRate = Math.round((activeDays / totalDays) * 100);
      
      if (consistencyRate > 80) {
        insights.push(`Excellent consistency! You studied on ${consistencyRate}% of days in this period.`);
      } else if (consistencyRate > 60) {
        insights.push(`Good study consistency at ${consistencyRate}%. Try to maintain regular study habits.`);
      } else {
        insights.push(`Study consistency could be improved (${consistencyRate}%). Consider setting a regular study schedule.`);
      }

      // Best and worst days
      const bestDay = dailyPerformance.reduce((best, day) => 
        day.averageAccuracy > best.averageAccuracy ? day : best
      );
      const worstDay = dailyPerformance.reduce((worst, day) => 
        day.sessionsCompleted > 0 && day.averageAccuracy < worst.averageAccuracy ? day : worst
      );

      if (bestDay.averageAccuracy > 0) {
        insights.push(`Your best performance was on ${bestDay.date} with ${bestDay.averageAccuracy}% accuracy.`);
      }
    }

    // Weekly trends insights
    if (weeklyTrends.length > 1) {
      const improvingWeeks = weeklyTrends.filter(week => week.improvementRate > 0).length;
      const totalWeeks = weeklyTrends.length - 1; // Exclude first week (no improvement rate)
      
      if (improvingWeeks > totalWeeks * 0.6) {
        insights.push('Great progress! You\'re showing consistent improvement week over week.');
      } else if (improvingWeeks < totalWeeks * 0.4) {
        insights.push('Consider reviewing your study methods to improve week-over-week performance.');
      }
    }

    // Monthly progress insights
    if (monthlyProgress.length > 0) {
      const currentMonth = monthlyProgress[monthlyProgress.length - 1];
      if (currentMonth.averageAccuracy > 80) {
        insights.push(`Outstanding monthly performance with ${currentMonth.averageAccuracy}% average accuracy!`);
      } else if (currentMonth.averageAccuracy > 70) {
        insights.push(`Good monthly performance with ${currentMonth.averageAccuracy}% average accuracy.`);
      }

      if (currentMonth.topSubjects.length > 0) {
        insights.push(`Your strongest subjects this month: ${currentMonth.topSubjects.join(', ')}.`);
      }
    }

    return insights;
  }, [state.analytics]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (!state.analytics) return null;

    const { dailyPerformance } = state.analytics;
    
    const totalSessions = dailyPerformance.reduce((sum, day) => sum + day.sessionsCompleted, 0);
    const totalQuestions = dailyPerformance.reduce((sum, day) => sum + day.questionsAnswered, 0);
    const totalTimeSpent = dailyPerformance.reduce((sum, day) => sum + day.totalTimeSpent, 0);
    
    const averageAccuracy = dailyPerformance.length > 0
      ? Math.round(dailyPerformance.reduce((sum, day) => sum + day.averageAccuracy, 0) / dailyPerformance.length)
      : 0;

    const activeDays = dailyPerformance.filter(day => day.sessionsCompleted > 0).length;
    
    return {
      totalSessions,
      totalQuestions,
      totalTimeSpent,
      averageAccuracy,
      activeDays,
      totalDays: dailyPerformance.length,
      averageSessionsPerDay: activeDays > 0 ? Math.round((totalSessions / activeDays) * 10) / 10 : 0,
      averageQuestionsPerSession: totalSessions > 0 ? Math.round((totalQuestions / totalSessions) * 10) / 10 : 0
    };
  }, [state.analytics]);

  // Load analytics on mount and when date range changes
  useEffect(() => {
    loadAnalytics();
  }, []);

  return {
    // Data
    analytics: state.analytics,
    dateRange: state.dateRange,
    insights: getAnalyticsInsights(),
    summary: getPerformanceSummary(),
    
    // State
    loading: state.loading,
    error: state.error,
    
    // Actions
    setDateRange,
    refresh: () => loadAnalytics(),
    
    // Predefined date ranges
    setLast7Days,
    setLast30Days,
    setLast90Days,
    setThisMonth,
    setLastMonth,
    
    // Computed properties
    hasData: state.analytics !== null,
    dayCount: state.analytics?.dailyPerformance?.length || 0,
    weekCount: state.analytics?.weeklyTrends?.length || 0,
    monthCount: state.analytics?.monthlyProgress?.length || 0
  };
}

// Specialized hooks for specific time periods
export function useWeeklyAnalytics() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return useTimeBasedAnalytics({ start: startDate, end: endDate });
}

export function useMonthlyAnalytics() {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return useTimeBasedAnalytics({ start: startDate, end: endDate });
}

export function useCurrentMonthAnalytics() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  return useTimeBasedAnalytics({ start: startDate, end: endDate });
}
