'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminService } from '@/lib/api-services';
import { AdminQuestionReport, AdminQuestionReportFilters, ReviewQuestionReportRequest } from '@/types/api';
import { toast } from 'sonner';

// Question reports filters interface
export interface QuestionReportsFilters extends AdminQuestionReportFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'reportType';
  sortOrder?: 'asc' | 'desc';
}

// Question reports stats interface
export interface QuestionReportsStats {
  total: number;
  pending: number;
  reviewed: number;
  resolved: number;
  dismissed: number;
  byType: {
    incorrectAnswer: number;
    unclearQuestion: number;
    typo: number;
    other: number;
  };
  recentActivity: number; // Reports in last 7 days
  averageResponseTime: number; // In hours
}

export function useQuestionReportsManagement() {
  const [reports, setReports] = useState<AdminQuestionReport[]>([]);
  const [totalReports, setTotalReports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QuestionReportsFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Computed stats from reports data
  const stats = useMemo((): QuestionReportsStats | null => {
    if (!reports.length) return null;

    const total = reports.length;
    const pending = reports.filter(r => r.status === 'PENDING').length;
    const reviewed = reports.filter(r => r.status === 'REVIEWED').length;
    const resolved = reports.filter(r => r.status === 'RESOLVED').length;
    const dismissed = reports.filter(r => r.status === 'DISMISSED').length;

    const byType = {
      incorrectAnswer: reports.filter(r => r.reportType === 'INCORRECT_ANSWER').length,
      unclearQuestion: reports.filter(r => r.reportType === 'UNCLEAR_QUESTION').length,
      typo: reports.filter(r => r.reportType === 'TYPO').length,
      other: reports.filter(r => r.reportType === 'OTHER').length,
    };

    // Calculate recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = reports.filter(r =>
      new Date(r.createdAt) >= sevenDaysAgo
    ).length;

    // Calculate average response time for reviewed/resolved/dismissed reports
    const reviewedReports = reports.filter(r =>
      (r.status === 'REVIEWED' || r.status === 'RESOLVED' || r.status === 'DISMISSED') &&
      r.createdAt !== r.updatedAt // Only count reports that have been updated
    );

    let averageResponseTime = 0;
    if (reviewedReports.length > 0) {
      const totalResponseTime = reviewedReports.reduce((sum, report) => {
        const created = new Date(report.createdAt);
        const updated = new Date(report.updatedAt);
        const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
        return sum + diffHours;
      }, 0);
      averageResponseTime = totalResponseTime / reviewedReports.length;
    }

    return {
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      byType,
      recentActivity,
      averageResponseTime
    };
  }, [reports]);

  // Fetch question reports with current filters
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AdminService.getQuestionReports({
        page: filters.page || 1,
        limit: filters.limit || 10,
        status: filters.status,
        reportType: filters.reportType,
        questionId: filters.questionId,
        userId: filters.userId,
        search: filters.search
      });

      if (response.success && response.data) {
        // Backend body: { items, total, page, limit, totalPages }; each item carries the
        // admin's reply as `adminNotes`, which the UI reads as `adminResponse`.
        const d: any = response.data;
        const rawReports: any[] = d.items ?? d.data ?? d.reports ?? [];
        const reportsData = rawReports.map(report => ({
          ...report,
          adminResponse: report.adminResponse ?? report.adminNotes ?? null,
        })) as AdminQuestionReport[];
        setReports(reportsData);

        const limit = filters.limit || 10;
        setTotalReports(d.total ?? d.pagination?.total ?? reportsData.length);
        setTotalPages(d.totalPages ?? d.pagination?.totalPages ?? Math.ceil(reportsData.length / limit));
        setCurrentPage(d.page ?? d.pagination?.currentPage ?? filters.page ?? 1);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch question reports');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch question reports';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load reports on mount and filter changes
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<QuestionReportsFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 when filters change
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  }, []);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  // Review question report
  const reviewReport = useCallback(async (reportId: number, reviewData: ReviewQuestionReportRequest) => {
    try {
      const response = await AdminService.reviewQuestionReport(reportId, reviewData);

      if (response.success) {
        toast.success(`Report ${reviewData.action.toLowerCase()} successfully`);
        await fetchReports(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to review report');
      }
    } catch (err) {
      // apiClient rejects with { success: false, error } objects, not Error instances
      const errorMessage = err instanceof Error
        ? err.message
        : (typeof (err as any)?.error === 'string' ? (err as any).error : 'Failed to review report');
      toast.error(errorMessage);
      throw err;
    }
  }, [fetchReports]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchReports();
  }, [fetchReports]);

  // Computed properties
  const hasReports = reports.length > 0;
  const hasError = !!error;
  const hasFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof QuestionReportsFilters];
    return value !== undefined && value !== '' && value !== null &&
      !(key === 'page' && value === 1) &&
      !(key === 'limit' && value === 10) &&
      !(key === 'sortBy' && value === 'createdAt') &&
      !(key === 'sortOrder' && value === 'desc');
  });

  return {
    reports,
    totalReports,
    currentPage,
    totalPages,
    loading,
    error,
    filters,
    stats,
    updateFilters,
    clearFilters,
    goToPage,
    reviewReport,
    refresh,
    hasReports,
    hasError,
    hasFilters
  };
}
