'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogoDisplay } from '@/components/ui/logo-display'
import { GraduationCap, ChevronRight } from 'lucide-react'

interface UnitCardProps {
  unit: {
    id: number
    name: string
    logoUrl?: string
    modules?: Array<{
      id: number
      name: string
      description?: string
    }>
  }
  onClick: () => void
}

export function UnitCard({ unit, onClick }: UnitCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <LogoDisplay
            logoUrl={unit.logoUrl}
            fallbackIcon={GraduationCap}
            alt={`${unit.name} logo`}
            size="md"
            variant="rounded"
          />
          {unit.name}
        </CardTitle>
        <CardDescription className="text-sm">
          {unit.modules?.length || 0} modules available
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            Unit
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
