// @ts-nocheck
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnalyticsSession } from '@/types/api';
import { SessionCircleChart } from './session-circle-chart';

interface AnalyticsChartsGridProps {
  sessions: AnalyticsSession[];
  loading?: boolean;
  className?: string;
  chartSize?: 'sm' | 'md' | 'lg';
}

export function AnalyticsChartsGrid({
  sessions = [],
  loading = false,
  className = '',
  chartSize = 'md'
}: AnalyticsChartsGridProps) {

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Loading Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-6 bg-muted rounded animate-pulse" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Loading Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-4 space-y-3">
                {/* Title skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
                {/* Chart skeleton */}
                <div className="h-48 bg-muted rounded-lg animate-pulse" />
                {/* Stats skeleton */}
                <div className="grid grid-cols-3 gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="text-center space-y-1">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                      <div className="h-3 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!sessions || sessions.length === 0) {
    return (
      <div className={cn("", className)}>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
                <PieChart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Aucune session disponible
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Aucune session trouvée pour le type sélectionné. Commencez par créer une session pour voir vos statistiques graphiques.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Grid layout configuration based on chart size
  const gridConfig = {
    sm: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    md: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    lg: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
  };

  const gapConfig = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
          <PieChart className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Vue Graphique des Sessions
          </h3>
          <p className="text-sm text-muted-foreground">
            {sessions.length} session{sessions.length > 1 ? 's' : ''} trouvée{sessions.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={cn(
        "grid",
        gridConfig[chartSize],
        gapConfig[chartSize]
      )}>
        {sessions.map((session) => {
          if (!session || !session.id) return null;
          
          return (
            <SessionCircleChart
              key={session.id}
              session={session}
              size={chartSize}
              showTitle={true}
              showStats={true}
              className="h-full"
            />
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="mt-8 p-4 bg-muted/20 rounded-lg border border-border/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">
              {sessions.length}
            </div>
            <div className="text-sm text-muted-foreground">
              Sessions totales
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {sessions.reduce((sum, session) => sum + (session.stats?.answeredCorrect || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Réponses justes
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {sessions.reduce((sum, session) => sum + (session.stats?.answeredWrong || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              Réponses fausses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
