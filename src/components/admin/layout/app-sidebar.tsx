// @ts-nocheck
import { useMemo } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/admin/layout/nav-group'
import { NavUser } from '@/components/admin/layout/nav-user'
import { TeamSwitcher } from '@/components/admin/layout/team-switcher'
import { sidebarData } from './data/sidebar-data'
import { User } from '@/types/auth'
import { type NavGroup as NavGroupType } from './types'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User | null
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Debug logging
  console.log('🔍 AppSidebar: Rendering with user:', {
    hasUser: !!user,
    role: user?.role,
    email: user?.email,
    fullUser: user
  });

  // Filter navigation items based on user role - memoized to recalculate when user changes
  const filteredNavGroups = useMemo(() => {
    console.log('🔍 AppSidebar: Filtering nav groups for role:', user?.role);

    // If no user or user is ADMIN, show all navigation items
    if (!user || user.role === 'ADMIN') {
      console.log('🔍 AppSidebar: Showing all nav items (ADMIN or no user)');
      return sidebarData.navGroups;
    }

    // For EMPLOYEE role, filter out specific items
    if (user.role === 'EMPLOYEE') {
      console.log('🔍 AppSidebar: Filtering for EMPLOYEE role');
      const filtered = sidebarData.navGroups
        .map(group => {
          console.log('🔍 AppSidebar: Processing group:', group.title);

          // Filter out the entire "User Management" group for employees
          if (group.title === 'User Management') {
            console.log('🔍 AppSidebar: Hiding User Management group');
            return null;
          }

          // For Content Management group, filter out "Question Sources"
          if (group.title === 'Content Management') {
            const filteredItems = group.items.filter(item => {
              const shouldShow = item.title !== 'Question Sources';
              console.log(`🔍 AppSidebar: Item "${item.title}" - ${shouldShow ? 'SHOW' : 'HIDE'}`);
              return shouldShow;
            });

            return {
              ...group,
              items: filteredItems
            };
          }

          return group;
        })
        .filter(Boolean) as NavGroupType[];

      console.log('🔍 AppSidebar: Filtered groups:', filtered.map(g => g.title));
      return filtered;
    }

    console.log('🔍 AppSidebar: Default - showing all nav items');
    return sidebarData.navGroups;
  }, [user, user?.role]); // Re-run when user or user.role changes

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
