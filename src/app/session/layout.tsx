// @ts-nocheck
'use client';

import { TooltipProvider } from '@/components/ui/tooltip'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription'

interface SessionLayoutProps {
  children: React.ReactNode
}

export default function SessionLayout({ children }: SessionLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { subscriptions, loading } = useUserSubscriptions();
  const { effective } = selectEffectiveActiveSubscription(subscriptions);
  const hasActiveSubscription = !!effective;

  // Pages that remain accessible for non-subscribers
  const subscriptionAllowed = useMemo(() => {
    if (!pathname) return false;
    // Allow access to subscription pages and settings (profile) regardless of subscription status
    // Session pages require active subscription
    return pathname.startsWith('/student/subscriptions') || pathname.startsWith('/student/settings');
  }, [pathname]);

  // Redirect non-subscribers away from protected student pages
  useEffect(() => {
    if (loading) return;
    if (!hasActiveSubscription && !subscriptionAllowed) {
      router.replace('/student/subscriptions/browse');
    }
  }, [loading, hasActiveSubscription, subscriptionAllowed, router]);

  return (
    <TooltipProvider>
      <div className='min-h-screen w-full bg-background'>
        {children}
      </div>
    </TooltipProvider>
  )
}
