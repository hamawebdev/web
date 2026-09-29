// @ts-nocheck
'use client';

import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/student/layout/app-sidebar'
import { Header } from '@/components/student/layout/header'
import { Main } from '@/components/student/layout/main'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription'
import { useStudentAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudentLayoutProps {
  children: React.ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading, checkAndRedirect } = useStudentAuth();
  const { subscriptions, loading, refreshing, error, refresh } = useUserSubscriptions();
  const { effective } = selectEffectiveActiveSubscription(subscriptions);
  const hasActiveSubscription = !!effective;

  // Pages that remain accessible for non-subscribers
  const subscriptionAllowed = useMemo(() => {
    if (!pathname) return false;
    // Allow access to subscription pages and settings (profile) regardless of subscription status
    return pathname.startsWith('/student/subscriptions') || pathname.startsWith('/student/settings');
  }, [pathname]);

  // Every page under this layout requires a signed-in student
  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  // Redirect non-subscribers away from protected student pages. A failed
  // subscriptions request is not "no subscription": show a retry state instead.
  // A list shown from the cache is confirmed first (refreshing), so a student who
  // just subscribed is never sent away on an old list.
  useEffect(() => {
    if (loading || refreshing || error || authLoading || !isAuthenticated) return;
    if (!hasActiveSubscription && !subscriptionAllowed) {
      router.replace('/student/subscriptions/browse');
    }
  }, [loading, refreshing, error, authLoading, isAuthenticated, hasActiveSubscription, subscriptionAllowed, router]);

  const subscriptionCheckFailed = !!error && !subscriptionAllowed;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        <div
          className='flex h-screen h-[100dvh] overflow-hidden w-full'
          style={{
            background: 'var(--background)',
            // Ensure proper initial rendering on iOS
            height: '100dvh',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        >

          <AppSidebar />
          <div className='flex flex-1 flex-col min-w-0'>
            <Header />
            <Main className='flex-1'>
              <div className={cn(

                // Mobile: 1rem padding
                'px-4 py-6',
                // Tablet: 2rem padding
                'md:px-8 md:py-8',
                // Desktop: 3rem padding
                'xl:px-6 xl:py-6 w-full',
                // Large Desktop: 4rem padding
                '2xl:px-8'
              )}>
                {subscriptionCheckFailed ? <SubscriptionCheckFailed onRetry={refresh} /> : children}
              </div>
            </Main>
          </div>
        </div>
      </SidebarProvider>
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
