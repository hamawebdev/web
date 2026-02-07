// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { 
  SessionResult, 
  SessionResultsFilters, 
  QuestionReport, 
  QuestionReportsFilters,
  QuestionReportRequest,
  PaginationParams 
} from '@/types/api';

// Hook for session results with advanced filtering
export function useSessionResults(filters: SessionResultsFilters & PaginationParams = {}) {
  const [state, setState] = useState<{
    data: SessionResult[] | null;
    pagination: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchSessionResults = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await StudentService.getSessionResults(filters);
      
      if (response.success) {
        setState({
          data: response.data.data,
          pagination: response.data.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch session results');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch session results';
      setState({
        data: null,
        pagination: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Session results fetch error:', error);
    }
  }, [filters.page, filters.limit, filters.search, filters.subjectId, filters.sessionType, filters.startDate, filters.endDate, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchSessionResults();
  }, [fetchSessionResults]);

  return {
    ...state,
    refresh: fetchSessionResults,
  };
}

// Hook for question reporting
export function useQuestionReporting() {
  const [reportingState, setReportingState] = useState<{
    submitting: boolean;
    error: string | null;
    success: boolean;
  }>({
    submitting: false,
    error: null,
    success: false,
  });

  const reportQuestion = useCallback(async (questionId: number, reportData: QuestionReportRequest) => {
    setReportingState({ submitting: true, error: null, success: false });

    try {
      const response = await StudentService.reportQuestion(questionId, reportData);
      
      if (response.success) {
        setReportingState({
          submitting: false,
          error: null,
          success: true,
        });
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to submit report');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      setReportingState({
        submitting: false,
        error: errorMessage,
        success: false,
      });
      throw error;
    }
  }, []);

  const resetState = useCallback(() => {
    setReportingState({
      submitting: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    ...reportingState,
    reportQuestion,
    resetState,
  };
}

// Hook for fetching user's question reports
export function useQuestionReports(filters: QuestionReportsFilters & PaginationParams = {}) {
  const [state, setState] = useState<{
    data: QuestionReport[] | null;
    pagination: any | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchReports = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await StudentService.getQuestionReports(filters);
      
      if (response.success) {
        setState({
          data: response.data.data,
          pagination: response.data.pagination,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch reports');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reports';
      setState({
        data: null,
        pagination: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Question reports fetch error:', error);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    ...state,
    refresh: fetchReports,
  };
}

// Hook for fetching a specific report details
export function useReportDetails(reportId: number | null) {
  const [state, setState] = useState<{
    data: QuestionReport | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchReportDetails = useCallback(async () => {
    if (!reportId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await StudentService.getReportDetails(reportId);
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch report details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch report details';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Report details fetch error:', error);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    }
  }, [fetchReportDetails]);

  return {
    ...state,
    refresh: fetchReportDetails,
  };
}

// Combined hook for session analysis features
export function useSessionAnalysis() {
  return {
    useSessionResults,
    useQuestionReporting,
    useQuestionReports,
    useReportDetails,
  };
}
