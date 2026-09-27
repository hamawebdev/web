// @ts-nocheck
'use client';

import { TooltipProvider } from '@/components/ui/tooltip'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription'
import { useStudentAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

interface SessionLayoutProps {
  children: React.ReactNode
}

export default function SessionLayout({ children }: SessionLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading, checkAndRedirect } = useStudentAuth();
  const { subscriptions, loading, error, refresh } = useUserSubscriptions();
  const { effective } = selectEffectiveActiveSubscription(subscriptions);
  const hasActiveSubscription = !!effective;

  // Pages that remain accessible for non-subscribers
  const subscriptionAllowed = useMemo(() => {
    if (!pathname) return false;
    // Allow access to subscription pages and settings (profile) regardless of subscription status
    // Session pages require active subscription
    return pathname.startsWith('/student/subscriptions') || pathname.startsWith('/student/settings');
  }, [pathname]);

  // Every page under this layout requires a signed-in student
  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  // Redirect non-subscribers away from protected student pages. A failed
  // subscriptions request is not "no subscription": show a retry state instead.
  useEffect(() => {
    if (loading || error || authLoading || !isAuthenticated) return;
    if (!hasActiveSubscription && !subscriptionAllowed) {
      router.replace('/student/subscriptions/browse');
    }
  }, [loading, error, authLoading, isAuthenticated, hasActiveSubscription, subscriptionAllowed, router]);

  const subscriptionCheckFailed = !!error && !subscriptionAllowed;

  return (
    <TooltipProvider>
      <div className='min-h-screen w-full bg-background'>
        {subscriptionCheckFailed ? <SubscriptionCheckFailed onRetry={refresh} /> : children}
      </div>
    </TooltipProvider>
  )
}

function SubscriptionCheckFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className='flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center'>
      <p className='text-muted-foreground'>
        Impossible de vérifier votre abonnement pour le moment.
      </p>
      <Button onClick={onRetry}>Réessayer</Button>
    </div>
  )
}
