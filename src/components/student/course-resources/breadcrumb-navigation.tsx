'use client'

import React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  onClick: () => void
  isActive?: boolean
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[]
  className?: string
}

export function BreadcrumbNavigation({ items, className }: BreadcrumbNavigationProps) {
  if (items.length <= 1) return null

  return (
    <div className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          <button
            onClick={item.onClick}
            className={cn(
              "hover:text-foreground transition-colors",
              item.isActive || index === items.length - 1 
                ? "text-foreground font-medium" 
                : "hover:underline"
            )}
            disabled={item.isActive || index === items.length - 1}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  )
}
