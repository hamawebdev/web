// @ts-nocheck
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { StudentProfileDropdown } from './profile-dropdown'
import { ThemeToggle } from '@/components/theme-toggle'
import { HamburgerMenu } from '@solar-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Logo } from '@/components/ui/logo'

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Header = ({
  className,
  fixed,
  children,
  ...props
}: HeaderProps) => {
  const [offset, setOffset] = React.useState(0)
  const isMobile = useIsMobile()

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'bg-background/95 md:backdrop-blur md:supports-[backdrop-filter]:bg-background/75',
        'flex h-14 sm:h-16 shrink-0 items-center gap-3 sm:gap-4 lg:gap-6 border-b border-border/50 px-4 sm:px-6 lg:px-8',
        'transition-all duration-200',
        fixed && 'header-fixed peer/header fixed z-50 w-[inherit] rounded-md',
        offset > 10 && fixed ? 'shadow-lg border-border' : 'shadow-none',
        className
      )}
      {...props}
    >
      {/* Mobile Layout */}
      {isMobile ? (
        <>
          {/* Left: Hamburger Menu */}
          <SidebarTrigger
            variant='ghost'
            className='h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors touch-target'
            aria-label="Open navigation menu"
          >
            <HamburgerMenu className="h-5 w-5" />
          </SidebarTrigger>

          {/* Center: Logo */}
          <div className='flex-1 flex justify-center'>
            <div className='flex items-center gap-2 sm:gap-3'>
              <Logo
                className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
              />
              <span className='text-lg sm:text-xl font-bold text-foreground whitespace-nowrap'>
                Med-ADN
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle + Profile */}
          <div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
            <ThemeToggle />
            <StudentProfileDropdown />
          </div>
        </>
      ) : (
        <>
          {/* Desktop Layout */}
          {/* Spacer */}
          <div className='flex-1' />

          {/* Right Side Actions */}
          <div className='flex items-center gap-3 lg:gap-4 flex-shrink-0'>
            <ThemeToggle />
            <Separator orientation='vertical' className='h-6' />
            <StudentProfileDropdown />
          </div>
        </>
      )}

      {/* Custom children content */}
      {children}
    </header>
  )
}

Header.displayName = 'Header'
