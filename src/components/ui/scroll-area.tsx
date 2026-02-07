// @ts-nocheck
import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

interface ScrollAreaProps
  extends React.ComponentProps<typeof ScrollAreaPrimitive.Root> {
  orientation?: 'vertical' | 'horizontal'
  forceVisible?: boolean
}

function ScrollArea({
  className,
  children,
  orientation = 'vertical',
  forceVisible = false,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot='scroll-area'
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot='scroll-area-viewport'
        className={cn(
          'focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
          orientation === 'horizontal' && 'overflow-x-auto!'
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation={orientation} forceVisible={forceVisible} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

interface ScrollBarProps
  extends React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  forceVisible?: boolean
}

function ScrollBar({
  className,
  orientation = 'vertical',
  forceVisible = false,
  ...props
}: ScrollBarProps) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot='scroll-area-scrollbar'
      orientation={orientation}
      forceMount={forceVisible ? true : undefined}
      className={cn(
        'flex touch-none transition-colors select-none',
        orientation === 'vertical' &&
        'h-full w-1.5 border-l border-l-transparent p-[1px]',
        orientation === 'horizontal' &&
        'h-1.5 flex-col border-t border-t-transparent p-[1px]',
        forceVisible && 'opacity-100',
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot='scroll-area-thumb'
        className={cn(
          'relative flex-1 rounded-full transition-all duration-200',
          forceVisible
            ? 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
        )}
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
