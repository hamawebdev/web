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

// Admin pages an EMPLOYEE can use: their backend routes are adminOrEmployee
// (GET/POST/PUT/DELETE /admin/question-sources, GET/PUT /admin/questions/reports).
const EMPLOYEE_ALLOWED_URLS = ['/admin/question-sources', '/admin/reports']

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

    // For EMPLOYEE role, show only the pages whose APIs are open to employees
    // (adminOrEmployee on the backend); every other admin page loads ADMIN-only data and
    // would only show 403 errors.
    if (user.role === 'EMPLOYEE') {
      console.log('🔍 AppSidebar: Filtering for EMPLOYEE role');
      const filtered = sidebarData.navGroups
        .map(group => {
          const items = group.items.filter(item => EMPLOYEE_ALLOWED_URLS.includes(item.url));
          return items.length > 0 ? { ...group, items } : null;
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
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
