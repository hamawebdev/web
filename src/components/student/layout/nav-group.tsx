// @ts-nocheck
import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NavCollapsible, NavItem, NavLink, type NavGroup } from './types'

export function NavGroup({ title, items }: NavGroup) {
  const { state } = useSidebar()
  const href = usePathname()
  return (
    <SidebarGroup className={cn('py-2 px-0', title ? 'mb-2' : 'mb-0')}>
      {title && state === 'expanded' && (
        <SidebarGroupLabel className='text-xs font-medium text-muted-foreground/60 px-3 mb-2'>
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className='space-y-0.5 px-0'>
        {items.map((item) => {
          const key = `${item.title}-${item.url || 'collapsible'}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed')
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

const NavBadge = ({ children }: { children: ReactNode }) => (
  <Badge className='rounded-full px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary border-0 group-data-[active=true]:bg-primary-foreground/20 group-data-[active=true]:text-primary-foreground'>
    {children}
  </Badge>
)

const SidebarMenuLink = ({ item, href }: { item: NavLink & { disabled?: boolean }; href: string }) => {
  const { setOpenMobile } = useSidebar()
  const disabled = (item as any).disabled;
  const isActive = checkIsActive(href, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild={!disabled}
        isActive={isActive}
        tooltip={item.title}
        disabled={disabled}
        className={cn(
          "relative h-9 rounded-xl transition-all duration-200 group px-3",
          "flex items-center justify-start gap-3 w-full",
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
            : 'text-muted-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {disabled ? (
          <div className="flex w-full items-center justify-start gap-3">
            {item.icon && (
              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium text-sm truncate">{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </div>
        ) : (
          <Link href={item.url} onClick={() => setOpenMobile(false)} className="flex w-full items-center justify-start gap-3">
            {item.icon && (
              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium text-sm truncate">{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
          </Link>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible & { disabled?: boolean }
  href: string
}) => {
  const { setOpenMobile, state } = useSidebar()
  const isActive = checkIsActive(href, item, true)
  const hasActiveChild = item.items?.some((subItem) => checkIsActive(href, subItem))
  const disabled = (item as any).disabled;

  return (
    <Collapsible
      asChild
      defaultOpen={!disabled && (isActive || hasActiveChild)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild disabled={disabled}>
          <SidebarMenuButton
            tooltip={item.title}
            disabled={disabled}
            className={cn(
              "h-9 rounded-xl px-3 flex items-center justify-start gap-3 w-full transition-all duration-200",
              hasActiveChild
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.icon && (
              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                <item.icon className="h-4 w-4" />
              </div>
            )}
            <span className="font-medium text-sm truncate flex-1">{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className="border-none mx-0 px-0 pl-4 mt-1 space-y-0.5">
            {item.items.map((subItem) => {
              const subIsActive = checkIsActive(href, subItem)
              const subDisabled = disabled || (subItem as any).disabled;
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild={!subDisabled}
                    isActive={subIsActive}
                    disabled={subDisabled}
                    className={cn(
                      "h-8 rounded-lg px-3 transition-all duration-200",
                      subIsActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-muted-foreground',
                      subDisabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {subDisabled ? (
                      <div className="flex items-center gap-2">
                        {subItem.icon && <subItem.icon className="h-4 w-4" />}
                        <span className="text-sm">{subItem.title}</span>
                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                      </div>
                    ) : (
                      <Link href={subItem.url} onClick={() => setOpenMobile(false)} className="flex items-center gap-2">
                        {subItem.icon && <subItem.icon className="h-4 w-4" />}
                        <span className="text-sm">{subItem.title}</span>
                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                      </Link>
                    )}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible & { disabled?: boolean }
  href: string
}) => {
  const disabled = (item as any).disabled;

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
            disabled={disabled}
            className={cn(
              "h-9 rounded-xl px-3 flex items-center justify-center w-full transition-all duration-200",
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {item.icon && (
              <div className="flex items-center justify-center w-5 h-5">
                <item.icon className="h-4 w-4" />
              </div>
            )}
            <span className="sr-only">{item.title}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => {
            const subDisabled = disabled || (sub as any).disabled;
            return (
              <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild disabled={subDisabled}>
                <Link
                  href={sub.url}
                  className={cn(
                    subDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  {sub.icon && <sub.icon />}
                  <span className='max-w-52 text-wrap'>{sub.title}</span>
                  {sub.badge && (
                    <span className='ml-auto text-xs'>{sub.badge}</span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
