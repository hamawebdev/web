'use client';

import { useMemo } from 'react';
import { QuizFilters } from '@/types/api';
import { AdvancedFiltersConfig, TimeEstimate, QuestionRange } from '../types';

export function useQuestionCalculation(
  filters: {
    yearLevels: string[];
    courseIds: number[];
    quizSourceIds?: number[];
    quizYears?: number[];
    questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'>;
    examYears?: number[];
  },
  filterData: QuizFilters | null
): number {
  return useMemo(() => {
    if (!filterData || !filters.courseIds.length) {
      return 0;
    }

    let totalQuestions = 0;

    // Calculate base questions from selected courses
    filterData.unites?.forEach(unit => {
      unit.modules?.forEach(module => {
        module.courses?.forEach(course => {
          if (filters.courseIds.includes(course.id)) {
            const questionCount = course.questionCount || 0;
            totalQuestions += questionCount;
          }
        });
      });
    });

    // Apply filter reductions (estimates based on API behavior)
    // Note: Empty arrays [] mean "smart defaults" (include all), so no reduction
    // Only apply reductions if user has specifically selected some types/years
    if (filters.questionTypes?.length) {
      // Assume selecting only one of two types reduces pool by ~40%
      const totalTypes = 2; // SINGLE_CHOICE, MULTIPLE_CHOICE
      const typeReduction = 1 - (filters.questionTypes.length / totalTypes);
      const reduction = Math.floor(totalQuestions * typeReduction * 0.4);
      totalQuestions -= reduction;
    }

    if (filters.examYears?.length && filterData.availableYears && filters.examYears.length < filterData.availableYears.length) {
      const yearReduction = 1 - (filters.examYears.length / filterData.availableYears.length);
      const reduction = Math.floor(totalQuestions * yearReduction * 0.2);
      totalQuestions -= reduction;
    }

    const finalCount = Math.max(0, totalQuestions);
    return finalCount;
  }, [filters, filterData]);
}

// Hook for calculating question ranges based on available questions
export function useQuestionRanges(availableQuestions: number): {
  quick: QuestionRange;
  standard: QuestionRange;
  comprehensive: QuestionRange;
} {
  return useMemo(() => ({
    quick: {
      min: 1,
      max: Math.min(5, availableQuestions),
      color: 'green',
      label: 'Quick Practice',
      description: 'Perfect for review',
      timeRange: '5-10 min'
    },
    standard: {
      min: 6,
      max: Math.min(10, availableQuestions),
      color: 'yellow',
      label: 'Standard Quiz',
      description: 'Balanced practice',
      timeRange: '10-20 min'
    },
    comprehensive: {
      min: 11,
      max: availableQuestions,
      color: 'red',
      label: 'Comprehensive',
      description: 'Full coverage',
      timeRange: '20+ min'
    }
  }), [availableQuestions]);
}

// Hook for time estimation
export function useTimeEstimate(questionCount: number): TimeEstimate {
  return useMemo(() => {
    const minTime = Math.ceil(questionCount * 1.2); // 1.2 min per question minimum
    const maxTime = Math.ceil(questionCount * 2); // 2 min per question maximum
    
    return {
      min: minTime,
      max: maxTime,
      formatted: `${minTime}-${maxTime} minutes`
    };
  }, [questionCount]);
}

// Hook for determining current range
export function useCurrentRange(
  questionCount: number,
  ranges: ReturnType<typeof useQuestionRanges>
): 'quick' | 'standard' | 'comprehensive' {
  return useMemo(() => {
    if (questionCount <= ranges.quick.max) return 'quick';
    if (questionCount <= ranges.standard.max) return 'standard';
    return 'comprehensive';
  }, [questionCount, ranges]);
}

// Hook for calculating total questions from course selection
export function useTotalQuestionsFromCourses(
  courseIds: number[],
  filterData: QuizFilters | null
): number {
  return useMemo(() => {
    if (!filterData || !courseIds.length) return 0;

    let total = 0;
    filterData.unites?.forEach(unit => {
      unit.modules?.forEach(module => {
        module.courses?.forEach(course => {
          if (courseIds.includes(course.id)) {
            total += course.questionCount || 0;
          }
        });
      });
    });

    return total;
  }, [courseIds, filterData]);
}

// Hook for filter impact analysis
export function useFilterImpact(
  baseQuestionCount: number,
  advancedFilters: AdvancedFiltersConfig,
  filterData: QuizFilters | null
) {
  return useMemo(() => {
    if (!filterData) return { filteredCount: baseQuestionCount, reductions: [] };

    let filteredCount = baseQuestionCount;
    const reductions = [];

    // Calculate source filter impact
    // Empty array [] means smart defaults (all sources), so no reduction
    // Note: current QuizFilters doesn't expose sources; keep legacy block behind optional chaining
    if (advancedFilters.quizSourceIds?.length && (filterData as any)?.quizSources) {
      const totalSources = (filterData as any).quizSources.length;
      const selectedSources = advancedFilters.quizSourceIds.length;

      if (selectedSources < totalSources) {
        const reductionPercent = 1 - (selectedSources / totalSources);
        const reduction = Math.floor(baseQuestionCount * reductionPercent * 0.3);
        filteredCount -= reduction;
        reductions.push({
          type: 'sources' as const,
          description: `Source filtering: -${reduction} questions (${selectedSources}/${totalSources} sources)`,
          reduction
        });
      }
    }

    // Calculate year filter impact
    // Empty array [] means smart defaults (all years), so no reduction
    if (advancedFilters.quizYears?.length && filterData.availableYears) {
      const totalYears = filterData.availableYears.length;
      const selectedYears = advancedFilters.quizYears.length;

      if (selectedYears < totalYears) {
        const reductionPercent = 1 - (selectedYears / totalYears);
        const reduction = Math.floor(baseQuestionCount * reductionPercent * 0.2);
        filteredCount -= reduction;
        reductions.push({
          type: 'years' as const,
          description: `Year filtering: -${reduction} questions (${selectedYears}/${totalYears} years)`,
          reduction
        });
      }
    }

    return {
      filteredCount: Math.max(0, filteredCount),
      reductions
    };
  }, [baseQuestionCount, advancedFilters, filterData]);
}

// Utility functions
export const questionCalculationUtils = {
  // Get optimal question count based on available questions
  getOptimalQuestionCount: (availableQuestions: number, maxDesired: number = 20): number => {
    return Math.min(availableQuestions, maxDesired);
  },

  // Calculate question distribution across courses
  getQuestionDistribution: (
    courseIds: number[],
    filterData: QuizFilters | null
  ): Array<{ courseId: number; courseName: string; questionCount: number }> => {
    if (!filterData) return [];

    const distribution: Array<{ courseId: number; courseName: string; questionCount: number }> = [];

    filterData.unites?.forEach(unit => {
      unit.modules?.forEach(module => {
        module.courses?.forEach(course => {
          if (courseIds.includes(course.id)) {
            distribution.push({
              courseId: course.id,
              courseName: course.name,
              questionCount: course.questionCount || 0
            });
          }
        });
      });
    });

    return distribution;
  },

  // Validate question count against available questions
  validateQuestionCount: (
    requestedCount: number,
    availableCount: number
  ): { isValid: boolean; message?: string } => {
    if (requestedCount <= 0) {
      return { isValid: false, message: 'Question count must be at least 1' };
    }
    
    if (requestedCount > availableCount) {
      return { 
        isValid: false, 
        message: `Only ${availableCount} questions available. Please reduce the count or select more courses.` 
      };
    }
    
    return { isValid: true };
  }
};
