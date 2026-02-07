'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({ 
  message, 
  onRetry, 
  retryLabel = "Try Again",
  className 
}: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{message}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              {retryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
