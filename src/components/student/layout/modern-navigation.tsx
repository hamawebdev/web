// @ts-nocheck
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { Header } from './header'

interface ModernNavigationProps {
  children: React.ReactNode
  className?: string
}

export function ModernNavigation({ children, className }: ModernNavigationProps) {
  return (
    <SidebarProvider>
      <div className={cn('min-h-screen bg-background', className)}>
        {/* Modern Sidebar */}
        <AppSidebar />
        
        {/* Main Content Area */}
        <SidebarInset className='flex flex-col'>
          {/* Modern Top Navigation */}
          <Header />
          
          {/* Page Content */}
          <main className='flex-1 overflow-auto custom-scrollbar'>
            <div className='container mx-auto p-6'>
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

// Export individual components for flexibility
export { AppSidebar } from './app-sidebar'
export { Header } from './header'
export { StudentSearch } from './search'
export { StudentProfileDropdown } from './profile-dropdown'
