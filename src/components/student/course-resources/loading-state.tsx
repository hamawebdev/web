'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/loading-states'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground mt-4">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
