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
import { cn } from '@/lib/utils'

interface StudentLayoutProps {
  children: React.ReactNode
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { subscriptions, loading } = useUserSubscriptions();
  const { effective } = selectEffectiveActiveSubscription(subscriptions);
  const hasActiveSubscription = !!effective;

  // Pages that remain accessible for non-subscribers
  const subscriptionAllowed = useMemo(() => {
    if (!pathname) return false;
    // Allow access to subscription pages and settings (profile) regardless of subscription status
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
                // Desktop: 3rem padding, max-width 1280px
                'xl:px-12 xl:py-12 xl:max-w-7xl xl:mx-auto',
                // Large Desktop: 4rem padding, max-width 1440px
                '2xl:px-16 2xl:max-w-screen-2xl'
              )}>
                {children}
              </div>
            </Main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}