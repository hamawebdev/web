'use client';

import { useMemo } from 'react';
import { useUserSubscriptions } from '@/hooks/use-subscription';

export type YearLevel = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';

export interface UseYearLevelResult {
  yearLevel: YearLevel | null;
  effectiveYearLevel: YearLevel | undefined;
  shouldApplyFilter: boolean;
  /** An active Résidanat pack subscription: every study year is open */
  isResidency: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * The student's year level, from their active subscriptions (shared with the
 * layout, so no extra request).
 *
 * A résidanat student (an active subscription to a RESIDENCY study pack, and
 * nobody else) can open every study year and picks one at a time
 * (shouldApplyFilter), starting on SEVEN, the Résidanat pack's own modules. A
 * year-pack student keeps their pack's year and no year choice (content filters
 * then return their own packs).
 */
export function useYearLevel(): UseYearLevelResult {
  const { subscriptions, loading, error, refresh } = useUserSubscriptions();

  const { yearLevel, isResidency } = useMemo(() => {
    const now = Date.now();
    const active = (subscriptions || []).filter((sub: any) =>
      String(sub?.status || '').toUpperCase() === 'ACTIVE' &&
      (!sub?.endDate || new Date(sub.endDate).getTime() >= now)
    );
    if (active.some((sub: any) => String(sub?.studyPack?.type || '').toUpperCase() === 'RESIDENCY')) {
      return { yearLevel: 'SEVEN' as YearLevel, isResidency: true };
    }
    const yearNumber = active[0]?.studyPack?.yearNumber;
    return { yearLevel: (yearNumber || null) as YearLevel | null, isResidency: false };
  }, [subscriptions]);

  return {
    yearLevel,
    effectiveYearLevel: isResidency ? 'SEVEN' : undefined,
    shouldApplyFilter: isResidency,
    isResidency,
    loading,
    error,
    refetch: refresh,
  };
}
