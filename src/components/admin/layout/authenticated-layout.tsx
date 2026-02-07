// @ts-nocheck
'use client';

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
// Removed Outlet import as Next.js handles this through the layout system
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'
import AuthAPI from '@/lib/auth-api'
import { User } from '@/types/auth'

interface Props {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: Props) {
  const defaultOpen = Cookies.get('sidebar_state') !== 'false'
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Get current user directly from AuthAPI
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('🔍 AuthenticatedLayout: Loading user from AuthAPI...');
        const currentUser = await AuthAPI.getCurrentUser();
        console.log('🔍 AuthenticatedLayout: User loaded:', {
          hasUser: !!currentUser,
          role: currentUser?.role,
          email: currentUser?.email
        });
        setUser(currentUser);
      } catch (error) {
        console.error('🔍 AuthenticatedLayout: Error loading user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  console.log('🔍 AuthenticatedLayout: Rendering with user:', {
    hasUser: !!user,
    role: user?.role,
    email: user?.email,
    loading
  });

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar user={user} />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'sm:transition-[width] sm:duration-200 sm:ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          {children}
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
