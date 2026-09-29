// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SubscriptionService, ContentService } from '@/lib/api-services';
import { UserSubscription } from '@/types/api';
import { useCachedResource } from '@/lib/cached-resource';

// Interface for subscription access check
export interface SubscriptionAccess {
  hasAccess: boolean;
  subscriptionRequired: boolean;
  subscriptionType?: string;
  trialAvailable?: boolean;
  reason?: string;
}

// Interface for subscription state
interface SubscriptionState {
  subscriptions: UserSubscription[] | null;
  loading: boolean;
  error: string | null;
}

// Interface for access check state
interface AccessCheckState {
  access: SubscriptionAccess | null;
  loading: boolean;
  error: string | null;
}

/** GET /students/subscriptions, unwrapped (throws on failure) */
export async function fetchUserSubscriptions(): Promise<UserSubscription[]> {
  const response = await SubscriptionService.getUserSubscriptions();
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch subscriptions');
  }
  // API returns: { success: true, data: [...] } (older shapes nested it once more)
  const subscriptionsData = response.data?.data?.data || response.data?.data || response.data || [];
  return Array.isArray(subscriptionsData) ? subscriptionsData : [];
}

// Hook for managing user subscriptions. Every hook on the page shares one request
// and the last known list shows at once on later visits (refreshed in the background).
// `refreshing` is true until the list is confirmed by the server: do not send a
// student away (no subscription) on a cached list.
export function useUserSubscriptions() {
  const { data, loading, refreshing, error, refresh } = useCachedResource('subscriptions', fetchUserSubscriptions);
  return {
    subscriptions: data ?? null,
    loading,
    refreshing,
    error,
    refresh,
  };
}

// Hook for checking subscription access to content
export function useSubscriptionAccess(contentId: number | null, contentType: 'study-pack' | 'course') {
  const [state, setState] = useState<AccessCheckState>({
    access: null,
    loading: false,
    error: null,
  });

  const checkAccess = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // First check subscription access
      const subscriptionResponse = await SubscriptionService.checkSubscriptionAccess(id, contentType);

      if (subscriptionResponse.success) {
        setState({
          access: subscriptionResponse.data,
          loading: false,
          error: null,
        });
      } else {
        // Fallback to content-specific access check
        let accessResponse;
        if (contentType === 'study-pack') {
          accessResponse = await ContentService.checkStudyPackAccess(id);
        } else {
          accessResponse = await ContentService.checkCourseAccess(id);
        }

        if (accessResponse.success) {
          setState({
            access: {
              hasAccess: accessResponse.data.hasAccess,
              subscriptionRequired: !accessResponse.data.hasAccess,
              reason: accessResponse.data.reason,
            },
            loading: false,
            error: null,
          });
        } else {
          throw new Error(accessResponse.error || 'Failed to check access');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check access';
      setState({
        access: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Access check error:', error);
    }
  }, [contentType]);

  useEffect(() => {
    if (contentId) {
      checkAccess(contentId);
    } else {
      setState({
        access: null,
        loading: false,
        error: null,
      });
    }
  }, [contentId, checkAccess]);

  return {
    ...state,
    refresh: contentId ? () => checkAccess(contentId) : undefined,
  };
}

// Hook for subscription management actions
export function useSubscriptionActions() {
  const [loading, setLoading] = useState(false);

  const startFreeTrial = useCallback(async (subscriptionType: string) => {
    setLoading(true);
    try {
      const response = await SubscriptionService.startFreeTrial(subscriptionType);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start free trial');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start free trial';
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCheckoutSession = useCallback(async (planId: string) => {
    setLoading(true);
    try {
      const response = await SubscriptionService.createCheckoutSession(planId);

      if (response.success) {
        // Redirect to checkout URL
        window.location.href = response.data.checkoutUrl;
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create checkout session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (subscriptionId: string) => {
    setLoading(true);
    try {
      const response = await SubscriptionService.cancelSubscription(subscriptionId);

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel subscription';
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    startFreeTrial,
    createCheckoutSession,
    cancelSubscription,
  };
}

// Hook for subscription plans - Fetches specific study pack and related options
export function useSubscriptionPlans(targetContentId?: number, contentType?: 'study-pack' | 'course') {
  const [plans, setPlans] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let primaryPlan = null;
      let relatedPlans: any[] = [];

      // If we have a specific content ID, fetch its details first
      if (targetContentId && contentType === 'study-pack') {
        try {
          const detailsResponse = await ContentService.getStudyPackDetails(targetContentId);
          if (detailsResponse.success) {
            const studyPack = detailsResponse.data?.data?.data || detailsResponse.data?.data || detailsResponse.data;
            primaryPlan = {
              id: studyPack.id,
              name: studyPack.name,
              description: studyPack.description,
              price: studyPack.price,
              currency: 'DA',
              duration: 'year',
              type: studyPack.type,
              yearNumber: studyPack.yearNumber,
              features: [
                `${studyPack.statistics?.totalCourses || 0} Courses`,
                `${studyPack.statistics?.totalModules || 0} Modules`,
                `${studyPack.statistics?.totalQuestions || 0} Practice Questions`,
                `${studyPack.statistics?.totalQuizzes || 0} Quizzes`,
                '24/7 Access',
                'Mobile Support',
                'Progress Tracking'
              ],
              popular: true, // Mark the target study pack as primary
              statistics: studyPack.statistics,
              isActive: studyPack.isActive,
              isPrimary: true
            };
          }
        } catch (detailsError) {
          console.warn('Failed to fetch specific study pack details:', detailsError);
        }
      }

      // Fetch other available study packs as alternatives
      const response = await ContentService.getStudyPacks({
        page: 1,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'asc'
      });

      if (response.success) {
        const studyPacks = response.data?.data?.data || response.data?.data || response.data || [];

        relatedPlans = studyPacks
          .filter((pack: any) => pack.id !== targetContentId) // Exclude the primary pack
          .map((pack: any) => ({
            id: pack.id,
            name: pack.name,
            description: pack.description,
            price: pack.price,
            currency: 'DA',
            duration: 'year',
            type: pack.type,
            yearNumber: pack.yearNumber,
            features: [
              `${pack.statistics?.totalCourses || 0} Courses`,
              `${pack.statistics?.totalModules || 0} Modules`,
              `${pack.statistics?.totalQuestions || 0} Practice Questions`,
              `${pack.statistics?.totalQuizzes || 0} Quizzes`,
              '24/7 Access',
              'Mobile Support',
              'Progress Tracking'
            ],
            popular: false,
            statistics: pack.statistics,
            isActive: pack.isActive,
            isPrimary: false
          }));
      }

      // Combine primary plan with related plans
      const allPlans = primaryPlan ? [primaryPlan, ...relatedPlans] : relatedPlans;
      setPlans(allPlans);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subscription plans';
      setError(errorMessage);
      console.error('Subscription plans fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [targetContentId, contentType]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refresh: fetchPlans,
  };
}

// Utility functions for subscription management
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  if (!subscription.isActive) return false;

  const expiryDate = new Date(subscription.expiryDate);
  const now = new Date();

  return expiryDate > now;
}

export function getSubscriptionStatus(subscription: UserSubscription): 'active' | 'expired' | 'trial' | 'cancelled' {
  if (!subscription.isActive) return 'cancelled';

  const expiryDate = new Date(subscription.expiryDate);
  const now = new Date();

  if (expiryDate <= now) return 'expired';

  // Check if it's a trial (assuming trial subscriptions have a specific type or short duration)
  const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff <= 7 && subscription.type === 'trial') return 'trial';

  return 'active';
}

export function getDaysUntilExpiry(subscription: UserSubscription): number {
  const expiryDate = new Date(subscription.expiryDate);
  const now = new Date();

  const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
}

export function getSubscriptionTypeLabel(type: string): string {
  switch (type) {
    case 'year_pack':
      return 'Annual Pack';
    case 'residency_pack':
      return 'Residency Pack';
    case 'premium':
      return 'Premium';
    case 'basic':
      return 'Basic';
    case 'trial':
      return 'Free Trial';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function getSubscriptionBenefits(type: string): string[] {
  switch (type) {
    case 'year_pack':
      return [
        'Access to all study packs',
        'Unlimited quiz attempts',
        'Progress tracking',
        'Download resources',
        'Priority support'
      ];
    case 'residency_pack':
      return [
        'Residency exam preparation',
        'Specialized content',
        'Mock exams',
        'Performance analytics',
        'Expert guidance'
      ];
    case 'premium':
      return [
        'All premium content',
        'Advanced analytics',
        'Personalized recommendations',
        'Offline access',
        '24/7 support'
      ];
    case 'basic':
      return [
        'Basic study materials',
        'Limited quiz attempts',
        'Basic progress tracking'
      ];
    default:
      return ['Access to selected content'];
  }
}


// Select a single effective ACTIVE subscription and derive allowed year levels
export function selectEffectiveActiveSubscription(subscriptions: any[] | null | undefined): {
  effective: any | null;
  allowedYearLevels: string[];
  isResidency: boolean;
} {
  const list = Array.isArray(subscriptions) ? subscriptions : [];
  const now = new Date().getTime();

  const active = list.filter((s: any) => String(s?.status || '').toUpperCase() === 'ACTIVE' && (!s?.endDate || new Date(s.endDate).getTime() >= now));
  if (active.length === 0) return { effective: null, allowedYearLevels: [], isResidency: false };

  // Helper function to check if a subscription is a residency pack
  const isResidencyPack = (s: any): boolean => {
    const packType = String(s?.studyPack?.type || s?.type || '').toUpperCase();
    const yearNumber = String(s?.studyPack?.yearNumber || s?.yearNumber || '').toUpperCase();

    // Check if type is explicitly RESIDENCY or if yearNumber is SEVEN (residency year)
    return packType === 'RESIDENCY' || yearNumber === 'SEVEN';
  };

  // Residency takes precedence (unlocks all years). If multiple residencies, pick the one with latest endDate.
  const residencies = active.filter(isResidencyPack);
  const byEndDesc = (a: any, b: any) => (new Date(b?.endDate || 0).getTime() - new Date(a?.endDate || 0).getTime()) || (new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  if (residencies.length > 0) {
    const effective = [...residencies].sort(byEndDesc)[0];
    return {
      effective,
      allowedYearLevels: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'],
      isResidency: true,
    };
  }

  // Otherwise pick the non-residency with the latest endDate
  const nonResidency = active.filter((s: any) => !isResidencyPack(s));
  const effective = [...nonResidency].sort(byEndDesc)[0] || null;

  const normalize = (val: any): string | null => {
    if (!val) return null;
    const s = String(val).toUpperCase();
    const map: Record<string, string> = {
      '1': 'ONE', 'ONE': 'ONE', 'L1': 'ONE',
      '2': 'TWO', 'TWO': 'TWO', 'L2': 'TWO',
      '3': 'THREE', 'THREE': 'THREE', 'L3': 'THREE',
      '4': 'FOUR', 'FOUR': 'FOUR', 'L4': 'FOUR',
      '5': 'FIVE', 'FIVE': 'FIVE', 'L5': 'FIVE',
      '6': 'SIX', 'SIX': 'SIX', 'L6': 'SIX',
      '7': 'SEVEN', 'SEVEN': 'SEVEN', 'L7': 'SEVEN',
    };
    return map[s] || null;
  };

  const y = effective?.studyPack?.yearNumber ?? effective?.yearNumber;
  const ny = normalize(y);
  return { effective, allowedYearLevels: ny ? [ny] : [], isResidency: false };
}
