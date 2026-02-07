// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { NewApiService } from '@/lib/api/new-api-services';
import { useQuizSessionFilters } from '@/hooks/use-content-filters';

interface DashboardStats {
  availableQuestions: number;
  availableExams: number;
  availableModules: number;
  availableUnits: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats() {
  const [state, setState] = useState<DashboardStats>({
    availableQuestions: 0,
    availableExams: 0,
    availableModules: 0,
    availableUnits: 0,
    loading: true,
    error: null,
  });

  // Get quiz session filters for question count and units
  const { filters: examFilters, loading: examFiltersLoading, error: examFiltersError } = useQuizSessionFilters();

  const fetchExamSessionCounts = useCallback(async () => {
    try {
      const response = await NewApiService.getSessionFilters('EXAM');
      if (response.success) {
        const data = response.data?.data || response.data;
        
        // Sum all session counts from the hierarchical structure
        let totalExamSessions = 0;
        let totalModules = 0;
        
        if (data?.unites && Array.isArray(data.unites)) {
          data.unites.forEach((unite: any) => {
            if (unite.modules && Array.isArray(unite.modules)) {
              totalModules += unite.modules.length;
              unite.modules.forEach((module: any) => {
                if (module.sessionCount) {
                  totalExamSessions += module.sessionCount;
                }
              });
            }
          });
        }
        
        return { totalExamSessions, totalModules };
      }
      return { totalExamSessions: 0, totalModules: 0 };
    } catch (error) {
      console.error('Failed to fetch exam session counts:', error);
      return { totalExamSessions: 0, totalModules: 0 };
    }
  }, []);

  const calculateStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Get exam session counts
      const { totalExamSessions, totalModules } = await fetchExamSessionCounts();

      // Calculate stats from exam session filters
      let totalQuestions = 0;
      let totalUnits = 0;

      if (examFilters) {
        // Use totalQuestionCount if provided by API, otherwise calculate
        if (examFilters.totalQuestionCount !== undefined) {
          totalQuestions = examFilters.totalQuestionCount;
        } else if (examFilters.unites && Array.isArray(examFilters.unites)) {
          examFilters.unites.forEach((unite: any) => {
            if (unite.modules && Array.isArray(unite.modules)) {
              unite.modules.forEach((module: any) => {
                if (module.universities && Array.isArray(module.universities)) {
                  module.universities.forEach((university: any) => {
                    if (university.years && Array.isArray(university.years)) {
                      university.years.forEach((year: any) => {
                        totalQuestions += (year.questionSingleCount || 0) + (year.questionMultipleCount || 0);
                      });
                    }
                  });
                }
              });
            }
          });
        }

        // Count total units
        if (examFilters.unites && Array.isArray(examFilters.unites)) {
          totalUnits = examFilters.unites.length;
        }
      }

      setState({
        availableQuestions: totalQuestions,
        availableExams: totalExamSessions,
        availableModules: totalModules,
        availableUnits: totalUnits,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate dashboard stats';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [examFilters, fetchExamSessionCounts]);

  useEffect(() => {
    if (!examFiltersLoading && !examFiltersError && examFilters) {
      calculateStats();
    } else if (examFiltersError) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: examFiltersError,
      }));
    }
  }, [examFilters, examFiltersLoading, examFiltersError, calculateStats]);

  return {
    ...state,
    refresh: calculateStats,
  };
}
