'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';

export type YearLevel = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';

export interface UseYearLevelResult {
  yearLevel: YearLevel | null;
  effectiveYearLevel: YearLevel | undefined;
  shouldApplyFilter: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to detect the user's year level from their active subscription
 * Fetches subscription data and extracts the yearNumber from the active study pack
 */
export function useYearLevel(): UseYearLevelResult {
  const [yearLevel, setYearLevel] = useState<YearLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchYearLevel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🎓 [useYearLevel] Fetching user subscriptions...');

      const response = await StudentService.getSubscriptions();

      if (response.success) {
        // Extract the actual subscriptions array from the nested response structure
        // API returns: { success: true, data: { success: true, data: [...] } }
        const responseData = response.data as any;
        const subscriptionsData = responseData?.data?.data || responseData?.data || responseData || [];
        const subscriptions = Array.isArray(subscriptionsData) ? subscriptionsData : [];

        console.log('🎓 [useYearLevel] Subscriptions loaded:', {
          count: subscriptions.length,
          subscriptions
        });

        // Find the active subscription
        const now = new Date().getTime();
        const activeSubscription = subscriptions.find((sub: any) => {
          const isActive = String(sub?.status || '').toUpperCase() === 'ACTIVE';
          const notExpired = !sub?.endDate || new Date(sub.endDate).getTime() >= now;
          return isActive && notExpired;
        });

        if (activeSubscription) {
          const yearNumber = activeSubscription.studyPack?.yearNumber;
          
          console.log('🎓 [useYearLevel] Active subscription found:', {
            subscriptionId: activeSubscription.id,
            studyPackName: activeSubscription.studyPack?.name,
            yearNumber,
            type: activeSubscription.studyPack?.type
          });

          if (yearNumber) {
            setYearLevel(yearNumber as YearLevel);
          } else {
            console.warn('🎓 [useYearLevel] Active subscription has no yearNumber');
            setYearLevel(null);
          }
        } else {
          console.warn('🎓 [useYearLevel] No active subscription found');
          setYearLevel(null);
        }
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to fetch subscriptions';
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch year level';
      console.error('🎓 [useYearLevel] Error:', err);
      setError(errorMessage);
      setYearLevel(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYearLevel();
  }, [fetchYearLevel]);

  // Only apply year-level filtering for SEVEN (Résidanat) students
  const shouldApplyFilter = yearLevel === 'SEVEN';
  const effectiveYearLevel = shouldApplyFilter ? yearLevel : undefined;

  return {
    yearLevel,
    effectiveYearLevel, // Only SEVEN, otherwise undefined
    shouldApplyFilter, // true only for SEVEN
    loading,
    error,
    refetch: fetchYearLevel
  };
}

