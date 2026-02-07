// @ts-nocheck
import React from 'react'
import { cn } from '@/lib/utils'

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export const Main = ({ fixed, className, ...props }: MainProps) => {
  return (
    <main
      className={cn(
        'peer-[.header-fixed]/header:mt-16',
        'flex flex-1 flex-col overflow-y-auto',
        fixed && 'fixed-main',
        className
      )}
      {...props}
    />
  )
}

Main.displayName = 'Main'
