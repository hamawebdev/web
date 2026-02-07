// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuizService } from '@/lib/api-services';
import { NewApiService } from '@/lib/api/new-api-services';

export type QuestionCountFilters = {
  yearLevels: string[]; // derived from subscriptions
  courseIds?: number[];
  moduleIds?: number[];
  uniteIds?: number[];
  questionTypes?: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'QROC'>;
  quizSourceIds?: number[];
  // New API: explicit years selection
  quizYears?: number[];
  // Back-compat (older API supported ranges)
  yearMin?: number;
  yearMax?: number;
};

export type QuestionCounts = {
  total: number;
  SINGLE_CHOICE?: number;
  MULTIPLE_CHOICE?: number;
};

function buildQueryParams(filters: QuestionCountFilters) {
  const params = new URLSearchParams();
  const appendArr = (key: string, arr?: (string | number)[]) => {
    if (!arr || !arr.length) return;
    arr.forEach((v) => params.append(key, String(v)));
  };

  appendArr('yearLevels', filters.yearLevels);
  appendArr('courseIds', filters.courseIds);
  appendArr('moduleIds', filters.moduleIds);
  appendArr('uniteIds', filters.uniteIds);
  appendArr('quizSourceIds', filters.quizSourceIds);
  appendArr('questionTypes', filters.questionTypes);
  // Prefer explicit years if provided
  appendArr('quizYears', filters.quizYears);
  // Back-compat range support
  if (filters.yearMin !== undefined) params.append('yearMin', String(filters.yearMin));
  if (filters.yearMax !== undefined) params.append('yearMax', String(filters.yearMax));

  return params.toString();
}

/**
 * @deprecated This hook uses the older /quizzes/quiz-filters endpoint.
 * For new implementations, use the useQuestionCount hook from use-content-filters.tsx
 * which uses the newer POST /quizzes/question-count endpoint with proper accessibleQuestionCount handling.
 */
export function useAvailableQuestionCounts(
  filters: QuestionCountFilters,
  enabled: boolean,
  options?: { courseCountsById?: Record<number, number> }
) {
  const queryKey = useMemo(() => [
    'available-question-counts',
    {
      y: filters.yearLevels?.slice().sort(),
      c: filters.courseIds?.slice().sort(),
      m: filters.moduleIds?.slice().sort(),
      u: filters.uniteIds?.slice().sort(),
      t: filters.questionTypes?.slice().sort(),
      s: filters.quizSourceIds?.slice().sort(),
      ys: filters.quizYears?.slice().sort(),
      n: filters.yearMin,
      x: filters.yearMax,
    }
  ], [filters]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const qs = buildQueryParams(filters);
      const res = await QuizService.getQuizFiltersWithParams(qs);
      if (!res.success) throw Object.assign(new Error(res.error || 'Failed to fetch counts'), { status: res.status });
      const data = res.data?.data || res.data;

      const counts: QuestionCounts = { total: 0 };

      // Build a course-based list first (preferred for accurate filtering)
      let filteredCourses: any[] = Array.isArray(data?.courses) ? data.courses : [];

      // Or derive from nested unites/modules if present
      if (!filteredCourses.length && Array.isArray(data?.unites)) {
        const courses: any[] = [];
        for (const u of data.unites) {
          for (const m of (u.modules || [])) {
            for (const c of (m.courses || [])) {
              courses.push(c);
            }
          }
        }
        filteredCourses = courses;
      }

      // Filter to only selected course IDs if present
      const selectedIds = Array.isArray((filters as any)?.courseIds) ? (filters as any).courseIds : [];
      if (selectedIds.length && filteredCourses.length) {
        filteredCourses = filteredCourses.filter((c: any) => selectedIds.includes(Number(c?.id)));
      }

      // Type-based filtering after course selection
      const selectedTypes = Array.isArray(filters?.questionTypes) ? filters.questionTypes : [];
      const wantsSingle = selectedTypes.length === 0 || selectedTypes.includes('SINGLE_CHOICE');
      const wantsMulti = selectedTypes.length === 0 || selectedTypes.includes('MULTIPLE_CHOICE');

      if (filteredCourses.length) {
        let single = 0, multi = 0;
        for (const c of filteredCourses) {
          single += Number(
            c?.singleChoiceQuestionCount ??
            c?.singleChoiceCount ??
            c?._count?.singleChoice ??
            0
          );
          multi += Number(
            c?.multipleChoiceQuestionCount ??
            c?.multipleChoiceCount ??
            c?._count?.multipleChoice ??
            0
          );
        }

        // Compute total according to selected type filters
        const total = (wantsSingle ? single : 0) + (wantsMulti ? multi : 0);
        counts.total = total;
        if (single > 0) counts.SINGLE_CHOICE = single;
        if (multi > 0) counts.MULTIPLE_CHOICE = multi;
        return counts;
      }

      // Fallback: use any explicit aggregate counts if provided by the API
      const topCounts = (data && (data.counts || data.questionCounts)) || null;
      if (topCounts) {
        const sc = Number(topCounts.SINGLE_CHOICE ?? topCounts.singleChoice ?? topCounts.singleChoiceQuestionCount ?? 0);
        const mc = Number(topCounts.MULTIPLE_CHOICE ?? topCounts.multipleChoice ?? topCounts.multipleChoiceQuestionCount ?? 0);
        const total = (wantsSingle ? sc : 0) + (wantsMulti ? mc : 0);
        counts.total = total;
        if (sc > 0) counts.SINGLE_CHOICE = sc;
        if (mc > 0) counts.MULTIPLE_CHOICE = mc;
        return counts;
      }

      // 3) Fallback: use client-known counts
      const courseCounts = options?.courseCountsById;
      if (courseCounts) {
        if (filteredCourses.length) {
          // Sum by returned courses intersected with known map
          counts.total = filteredCourses.reduce((sum: number, c: any) => sum + (courseCounts[c.id] || 0), 0);
          return counts;
        }
        // If API didn't return courses, sum only the SELECTED courseIds
        const selectedIds = Array.isArray((filters as any)?.courseIds) ? (filters as any).courseIds : [];
        if (selectedIds.length) {
          counts.total = selectedIds.reduce((sum: number, id: number) => sum + (courseCounts[id] || 0), 0);
          return counts;
        }
      }

      // 4) Last resort: total keys
      if (typeof data?.totalAvailable === 'number') counts.total = data.totalAvailable;
      else if (typeof data?.total === 'number') counts.total = data.total;

      return counts;
    },
    enabled,
    staleTime: 60 * 1000,
  });

  return query;
}

