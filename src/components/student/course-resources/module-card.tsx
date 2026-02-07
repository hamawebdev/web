'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LogoDisplay } from '@/components/ui/logo-display'
import { FolderOpen, Layers, ChevronRight } from 'lucide-react'

interface ModuleCardProps {
  module: {
    id: number
    name: string
    description?: string
    logoUrl?: string
  }
  isIndependent?: boolean
  onClick: () => void
}

export function ModuleCard({ module, isIndependent = false, onClick }: ModuleCardProps) {
  const FallbackIcon = isIndependent ? Layers : FolderOpen

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-3 text-base">
          <LogoDisplay
            logoUrl={module.logoUrl}
            fallbackIcon={FallbackIcon}
            alt={`${module.name} logo`}
            size="md"
            variant="rounded"
          />
          {module.name}
        </CardTitle>
        <CardDescription className="text-sm">
          {module.description || (isIndependent ? 'Independent module' : 'Module description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <Badge variant={isIndependent ? "outline" : "secondary"} className="text-xs">
            {isIndependent ? 'Independent Module' : 'Module'}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
