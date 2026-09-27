// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { PaginationParams } from '@/types/api';
import { toast } from 'sonner';
import { logger, logHookOperation } from '@/lib/logger';

// Types for question reports
export interface QuestionReport {
  id: number;
  questionId: number;
  reportType: 'INCORRECT_ANSWER' | 'TYPO' | 'UNCLEAR_QUESTION' | 'MISSING_INFO' | 'OTHER';
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  adminResponse?: string | null;
  resolvedAt?: string;
  question?: {
    id: number;
    questionText: string;
  };
  reviewedBy?: {
    id: number;
    fullName: string;
  } | null;
}

export interface QuestionReportRequest {
  reportType: string;
  description: string;
}

// Question Reports Management Hook
export function useQuestionReports(params: PaginationParams & {
  status?: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'REJECTED' | 'all';
  reportType?: string;
} = {}) {
  const [reports, setReports] = useState<QuestionReport[] | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    logHookOperation('useQuestionReports', 'Starting to fetch reports', { params });
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getQuestionReports(params);

      if (response.success) {
        // Handle nested API response structure: response.data.data.data
        const reportsData = response.data?.data?.data || response.data?.data || response.data || [];
        const reportsArray = Array.isArray(reportsData) ? reportsData : [];

        setReports(reportsArray);
        setPagination(response.data?.pagination || response.data?.data?.pagination || null);
      } else {
        logger.error('📊 useQuestionReports: API returned error', response.error);
        throw new Error(response.error || 'Failed to fetch reports');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports';
      logger.error('📊 useQuestionReports: Fetch error caught', {
        error,
        errorMessage,
        errorType: typeof error,
        isApiError: error && typeof error === 'object' && 'statusCode' in error
      });
      setError(errorMessage);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [params.page, params.limit, params.status, params.reportType]);

  const createReport = useCallback(async (questionId: number, reportData: QuestionReportRequest) => {
    try {
      const response = await StudentService.reportQuestion(questionId, reportData);

      if (response.success) {
        toast.success('Report submitted successfully');
        fetchReports(); // Refresh the list
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit report');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    pagination,
    loading,
    error,
    refresh: fetchReports,
    createReport,
  };
}

// Individual Report Details Hook
export function useReportDetails(reportId: number | null) {
  const [report, setReport] = useState<QuestionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportDetails = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await StudentService.getReportDetails(id);

      if (response.success) {
        // Support shapes:
        // { data: { data: { ...report } } } or { data: { report: {...} } } or direct { ...report }
        const reportData = response.data?.data || response.data?.report || response.data;
        setReport(reportData);
      } else {
        throw new Error(response.error || 'Failed to fetch report details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report details';
      setError(errorMessage);
      console.error('Report details fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (reportId) {
      fetchReportDetails(reportId);
    } else {
      setReport(null);
      setLoading(false);
      setError(null);
    }
  }, [reportId, fetchReportDetails]);

  return {
    report,
    loading,
    error,
    refresh: reportId ? () => fetchReportDetails(reportId) : undefined,
  };
}

// Report Statistics Hook
export function useReportStatistics() {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    rejected: number;
    byType: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all reports to calculate statistics
      const response = await StudentService.getQuestionReports({ page: 1, limit: 1000 });

      if (response.success) {
        const allReports = response.data?.data || [];

        const statistics = {
          total: allReports.length,
          pending: allReports.filter((r: QuestionReport) => r.status === 'PENDING').length,
          reviewed: allReports.filter((r: QuestionReport) => r.status === 'REVIEWED').length,
          resolved: allReports.filter((r: QuestionReport) => r.status === 'RESOLVED').length,
          rejected: allReports.filter((r: QuestionReport) => r.status === 'REJECTED').length,
          byType: allReports.reduce((acc: Record<string, number>, report: QuestionReport) => {
            acc[report.reportType] = (acc[report.reportType] || 0) + 1;
            return acc;
          }, {})
        };

        setStats(statistics);
      } else {
        throw new Error(response.error || 'Failed to fetch report statistics');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
      setError(errorMessage);
      console.error('Report statistics fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStatistics,
  };
}
