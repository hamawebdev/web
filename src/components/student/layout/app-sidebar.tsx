// @ts-nocheck
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/student/layout/nav-group'
import { sidebarData } from './data/sidebar-data'
import { useUserSubscriptions, selectEffectiveActiveSubscription } from '@/hooks/use-subscription'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

function AppSidebarHeader() {
  const { state, toggleSidebar } = useSidebar()

  return (
    <div className={cn(
      'flex h-full items-center justify-between transition-all duration-200',
      state === 'expanded' ? 'px-4 py-4' : 'justify-center px-2 py-4'
    )}>
      {/* Logo Icon - Always visible */}
      <div className="flex items-center gap-2">
        <Logo
          className={cn(
            "object-contain transition-all duration-200",
            state === 'expanded' ? "h-8 w-8" : "h-7 w-7"
          )}
        />

        {/* Logo Text - Only visible when expanded */}
        {state === 'expanded' && (
          <span className='text-xl font-bold text-foreground'>
            MedADN
          </span>
        )}
      </div>

    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Compute sidebar items dynamically and enforce subscription-based disabling
  const { subscriptions } = useUserSubscriptions();
  const { effective, isResidency } = selectEffectiveActiveSubscription(subscriptions);
  const hasActiveSubscription = !!effective;

  const computedNavGroups = (() => {
    return sidebarData.navGroups.map((group) => {
      const processedItems = group.items.map((item: any) => {
        // Disable Residency items if user does not have a residency subscription
        if (item.title === 'Residency') {
          return { ...item, disabled: !isResidency };
        }

        // Disable practice, exam, and residency groups when user is not subscribed
        if (!hasActiveSubscription && item.group) {
          const groupType = item.group;
          // Disable practice, exam, and residency groups when not subscribed
          if (groupType === 'practice' || groupType === 'exam' || groupType === 'residency') {
            return { ...item, disabled: true };
          }
        }

        // If user has no active subscription, disable all items except subscription pages and settings
        if (!hasActiveSubscription) {
          const url: string | undefined = item.url;
          const isSubscriptionPage = url?.startsWith('/student/subscriptions');
          const isSettingsPage = url === '/student/settings';
          
          if (url && !isSubscriptionPage && !isSettingsPage) {
            return { ...item, disabled: true };
          }
          
          // Also check sub-items for collapsible items
          if (item.items && Array.isArray(item.items)) {
            return {
              ...item,
              items: item.items.map((subItem: any) => {
                const subUrl: string | undefined = subItem.url;
                const isSubSubscriptionPage = subUrl?.startsWith('/student/subscriptions');
                const isSubSettingsPage = subUrl === '/student/settings';
                if (subUrl && !isSubSubscriptionPage && !isSubSettingsPage) {
                  return { ...subItem, disabled: true };
                }
                return subItem;
              }),
            };
          }
        }

        return item;
      });

      return {
        ...group,
        items: processedItems,
      };
    });
  })();

  return (
    <Sidebar
      collapsible='icon'
      variant='floating'
      className="group-data-[collapsible=icon]:w-[4rem] border-none"
      {...props}
    >
      <SidebarHeader
        className={cn(
          'h-auto border-b border-transparent bg-sidebar',
          'group-data-[collapsible=icon]:min-h-[4rem] group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center',
          'min-h-[4rem] p-0 relative'
        )}
      >
        <AppSidebarHeader />
      </SidebarHeader>
      <SidebarContent className='px-0 py-3 group-data-[collapsible=icon]:px-0'>
        {computedNavGroups.map((group, index) => (
          <NavGroup 
            key={index} 
            title={group.title} 
            items={group.items} 
          />
        ))}
      </SidebarContent>
      <SidebarFooter className='p-3 border-t border-transparent group-data-[collapsible=icon]:p-2'>
        {/* NewSessionButton removed */}
      </SidebarFooter>
    </Sidebar>
  )
}

function NewSessionButton() {
  const { state } = useSidebar()

  if (state === 'collapsed') {
    return (
      <Link href="/student/practice/create">
        <Button
          variant="outline"
          size="icon"
          className="w-full h-9 rounded-xl border-dashed border-2 border-emerald-300/50 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-400/50"
        >
          <Plus className="h-4 w-4 text-emerald-600" />
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/student/practice/create" className="w-full">
      <Button
        variant="outline"
        className="w-full h-10 rounded-xl border-dashed border-2 border-emerald-300/50 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-400/50 text-emerald-700 font-medium gap-2"
      >
        <Plus className="h-4 w-4" />
        New Session
      </Button>
    </Link>
  )
}
