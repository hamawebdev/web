// @ts-nocheck
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSubscriptions } from '@/hooks/use-subscription';
import { StudentService } from '@/lib/api-services';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-states/api-loading-states';
import { RedeemActivationCodeModal } from '@/components/student/subscription/redeem-activation-code-modal';
import { SubscriptionErrorBoundary, usePerformanceMonitoring, useErrorReporting } from '@/components/student/subscription/subscription-error-boundary';
import { StudyPackPricingCard } from '@/components/student/subscription/study-pack-pricing-card';
import { RefreshCw, AlertCircle, Instagram } from 'lucide-react';
import { Gift } from '@solar-icons/react';
import type { StudyPack } from '@/types/api';



function BrowseSubscriptionsPageContent() {
  // Performance monitoring
  usePerformanceMonitoring('BrowseSubscriptionsPage');
  const { reportError } = useErrorReporting();
  const router = useRouter();
  const [packsLoading, setPacksLoading] = useState(true);
  const [packsError, setPacksError] = useState<string | null>(null);
  const [studyPacks, setStudyPacks] = useState<any[]>([]);
  const [pricingMode, setPricingMode] = useState<'YEAR' | 'MONTH'>('YEAR');
  const [selectedPackId, setSelectedPackId] = useState<number | null>(null);

  // Memoize the loadPacks function to prevent unnecessary re-renders
  const loadPacks = useCallback(async () => {
    try {
      setPacksLoading(true);
      setPacksError(null);
      const res = await StudentService.getStudyPacks({ page: 1, limit: 24 });
      const data = (res as any)?.data?.data || (res as any)?.data || res;
      // Handle the response structure where items are nested under data.items
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setStudyPacks(list);
      // Auto-select first pack if available
      if (list.length > 0 && !selectedPackId) {
        setSelectedPackId(list[0].id);
      }
    } catch (e: any) {
      console.error('Failed to load study packs:', e);
      reportError(e, 'loadPacks');
      setPacksError(e?.message || 'Failed to load study packs');
    } finally {
      setPacksLoading(false);
    }
  }, [reportError, selectedPackId]);

  // Load packs on mount - only once
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPacks();
    }
  }, [loadPacks]);

  const { subscriptions, loading: subsLoading, error: subsError } = useUserSubscriptions();
  const [redeemOpen, setRedeemOpen] = useState(false);

  // Memoize the current time to prevent constant recalculation
  const now = useMemo(() => new Date(), []);

  // Optimize subscription calculations with better memoization
  const subscriptionData = useMemo(() => {
    const list = Array.isArray(subscriptions) ? subscriptions : [];
    const nowTime = now.getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

    const activeSub = list.find((s) => s.status === 'ACTIVE' && new Date(s.endDate).getTime() >= nowTime);

    const cancelledWithinGraceIds = new Set(
      list
        .filter((s) => s.status !== 'ACTIVE')
        .filter((s) => {
          const updated = new Date(s.updatedAt).getTime();
          return nowTime - updated <= threeDaysMs;
        })
        .map((s) => s.studyPackId)
    );

    const cancelledExpiredIds = new Set(
      list
        .filter((s) => s.status !== 'ACTIVE')
        .filter((s) => {
          const updated = new Date(s.updatedAt).getTime();
          return nowTime - updated > threeDaysMs;
        })
        .map((s) => s.studyPackId)
    );

    return {
      activeSub,
      cancelledWithinGraceIds,
      cancelledExpiredIds
    };
  }, [subscriptions, now]);

  const { activeSub, cancelledWithinGraceIds, cancelledExpiredIds } = subscriptionData;

  const residencyActive = useMemo(() => {
    if (!activeSub) return false;
    const pack = subscriptions?.find((s) => s.studyPackId === activeSub.studyPackId)?.studyPack;
    return pack?.type === 'RESIDENCY';
  }, [activeSub, subscriptions]);

  const visiblePacks: StudyPack[] = useMemo(() => {
    const list = Array.isArray(studyPacks) ? studyPacks : [];
    return list.filter((p) => {
      // Hide user's currently active pack
      if (activeSub && p.id === activeSub.studyPackId) return false;
      // Hide cancelled/expired packs beyond grace period
      if (cancelledExpiredIds.has(p.id)) return false;
      return true;
    });
  }, [studyPacks, activeSub, cancelledExpiredIds]);

  // Memoize these functions to prevent recreation on every render
  const isDisabledForUser = useCallback((pack: StudyPack) => {
    // Cancelled within grace can be renewed
    if (cancelledWithinGraceIds.has(pack.id)) return false;
    // If user has active sub, all other packs are disabled due to single-subscription rule
    if (activeSub) return true;
    // Non-subscribers: cards are viewable; CTA is purchase, not disabled
    return false;
  }, [cancelledWithinGraceIds, activeSub]);

  const getCta = useCallback((pack: StudyPack) => {
    const isGrace = cancelledWithinGraceIds.has(pack.id);
    if (isGrace) return { label: 'Renew', variant: 'default' as const };
    if (activeSub) return { label: residencyActive ? 'Included with Residency' : 'Subscription Active', variant: 'outline' as const };
    return { label: 'Subscribe', variant: 'default' as const };
  }, [cancelledWithinGraceIds, activeSub, residencyActive]);

  const handleCtaClick = useCallback((pack: StudyPack) => {
    const isGrace = cancelledWithinGraceIds.has(pack.id);
    if (activeSub && !isGrace) {
      // Do nothing; disabled
      return;
    }

    // Subscribe and Renew are paid by manual BaridiMob transfer: show the instructions for this pack
    const cycle = pricingMode === 'YEAR' ? 'yearly' : 'monthly';
    router.push(`/student/subscriptions/payment?packId=${pack.id}&cycle=${cycle}`);
  }, [cancelledWithinGraceIds, activeSub, pricingMode, router]);

  // Handle successful activation code redemption
  const handleRedeemSuccess = useCallback(() => {
    // Refresh both study packs and subscriptions after successful redemption
    loadPacks();
    // Note: We would need to add a refresh method to useUserSubscriptions hook
    setRedeemOpen(false);
  }, [loadPacks]);

  // Handle pack selection
  const handlePackSelect = useCallback((packId: number) => {
    setSelectedPackId(packId);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 sm:space-y-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight">Subscriptions</h1>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-3 w-full sm:w-80 lg:w-96">
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
                variant="default"
                onClick={() => setRedeemOpen(true)}
              >
                <Gift className="h-4 w-4 mr-2" />
                Activation Code
              </Button>
              <div className="flex bg-muted p-1 rounded-lg">
                <Button
                  className={`flex-1 rounded-md transition-all ${pricingMode === 'YEAR' ? 'bg-background hover:bg-background' : 'hover:bg-transparent'}`}
                  variant={pricingMode === 'YEAR' ? 'secondary' : 'ghost'}
                  onClick={() => setPricingMode('YEAR')}
                >
                  Yearly
                </Button>
                <Button
                  className={`flex-1 rounded-md transition-all ${pricingMode === 'MONTH' ? 'bg-background shadow-sm hover:bg-background' : 'hover:bg-transparent'}`}
                  variant={pricingMode === 'MONTH' ? 'secondary' : 'ghost'}
                  onClick={() => setPricingMode('MONTH')}
                >
                  Monthly
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {packsLoading || subsLoading ? (
          <LoadingSpinner message="Loading subscriptions and study packs..." />
        ) : packsError || subsError ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="flex items-center justify-center gap-2 text-destructive mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load data</span>
              </div>
              <p className="text-muted-foreground mb-4">
                {packsError || subsError || 'An error occurred while loading the page.'}
              </p>
              <Button
                onClick={() => {
                  if (packsError) loadPacks();
                  // Note: subscription refresh would need to be implemented in the hook
                }}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-[450px] mx-auto flex flex-col gap-3">
            {visiblePacks.map((pack) => {
              const disabled = isDisabledForUser(pack);
              const cta = getCta(pack);
              const isGrace = cancelledWithinGraceIds.has(pack.id);

              return (
                <StudyPackPricingCard
                  key={pack.id}
                  pack={pack}
                  billingCycle={pricingMode === 'YEAR' ? 'yearly' : 'monthly'}
                  isSelected={selectedPackId === pack.id}
                  isDisabled={disabled}
                  isGrace={isGrace}
                  ctaLabel={cta.label}
                  ctaVariant={cta.variant}
                  onSelect={() => handlePackSelect(pack.id)}
                  onCtaClick={() => handleCtaClick(pack)}
                />
              );
            })}
          </div>
        )}
        {/* Contact Section */}
        <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-border/50 max-w-md mx-auto w-full">
          <p className="text-sm text-muted-foreground text-center font-medium">
            Or contact us to get activation code
          </p>
          <Button
            onClick={() => window.open('https://www.instagram.com/med.adn.dz/', '_blank')}
            className="w-full sm:w-auto min-w-[200px] bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] hover:opacity-90 text-white transition-all duration-300"
          >
            <Instagram className="h-4 w-4 mr-2" />
            Contact us on Instagram
          </Button>
        </div>

        <RedeemActivationCodeModal
          open={redeemOpen}
          onOpenChange={setRedeemOpen}
          onSuccess={handleRedeemSuccess}
        />
      </div>
    </div>
  );
}

// Main component with error boundary
export default function BrowseSubscriptionsPage() {
  return (
    <SubscriptionErrorBoundary>
      <BrowseSubscriptionsPageContent />
    </SubscriptionErrorBoundary>
  );
}
