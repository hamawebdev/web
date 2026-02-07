// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User as UserIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { toast } from 'sonner'
import { SettingsService } from '@/lib/api-services'
import { apiClient } from '@/lib/api-client'
import type { UserProfile } from '@/types/api'

export function NavUser() {
  const { isMobile } = useSidebar()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const response = await SettingsService.getUserProfile()

        if (response.success && response.data) {
          setProfile(response.data)
        } else {
          console.error('Failed to load profile:', response.error)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      apiClient.clearTokens()
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error logging out')
    }
  }

  // Get user initials for avatar fallback
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get subscription status
  const getSubscriptionStatus = () => {
    if (!profile?.subscriptions || profile.subscriptions.length === 0) {
      return 'Free Plan'
    }

    const activeSubscriptions = profile.subscriptions.filter(sub => sub.status === 'ACTIVE')
    if (activeSubscriptions.length > 0) {
      return activeSubscriptions[0].studyPack.name
    }

    return 'Inactive Plan'
  }

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!profile) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg'>
            <Avatar className='h-8 w-8 rounded-full'>
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>Unknown User</span>
              <span className='text-muted-foreground truncate text-xs'>
                Error loading profile
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <Avatar className='h-8 w-8 rounded-full'>
                <AvatarImage src='/avatar-placeholder.png' alt={profile.fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{profile.fullName}</span>
                <span className='text-muted-foreground truncate text-xs'>
                  {getSubscriptionStatus()}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 text-muted-foreground' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={8}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-3 px-2 py-1.5 text-left'>
                <Avatar className='h-9 w-9 rounded-full'>
                  <AvatarImage src='/avatar-placeholder.png' alt={profile.fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <div className="flex items-center gap-2">
                    <span className='truncate font-semibold'>{profile.fullName}</span>
                    {profile.emailVerified && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <span className='text-muted-foreground truncate text-xs'>
                    {profile.email}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className='text-muted-foreground text-xs'>
                      {profile.university?.name || 'No University'} • {profile.currentYear || 'No Year'}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href='/student/subscription'>
                  <Sparkles className='mr-2 size-4' />
                  Upgrade to Pro
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/student/settings'>
                  <UserIcon className='mr-2 size-4' />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/student/subscription'>
                  <CreditCard className='mr-2 size-4' />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href='/student/settings'>
                  <Bell className='mr-2 size-4' />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className='mr-2 size-4' />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
