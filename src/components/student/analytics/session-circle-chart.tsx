// @ts-nocheck
'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AnalyticsSession } from '@/types/api';

// Chart colors as specified in requirements
const CHART_COLORS = {
  correct: '#00B050',    // Green for Répondue Juste
  incorrect: '#FF0000',  // Red for Répondue Fausse  
  consulted: '#BFBFBF',  // Gray for Consulté
};

interface SessionCircleChartProps {
  session: AnalyticsSession;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTitle?: boolean;
  showStats?: boolean;
}

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// Custom tooltip component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.color }}
          />
          <span className="font-medium text-sm">{data.name}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          <div>Nombre: {data.value}</div>
          <div>Pourcentage: {data.percentage}%</div>
        </div>
      </div>
    );
  }
  return null;
}

export function SessionCircleChart({
  session,
  className = '',
  size = 'md',
  showTitle = true,
  showStats = true
}: SessionCircleChartProps) {
  
  // Calculate chart data from session stats
  const calculateChartData = (): ChartDataPoint[] | null => {
    if (!session?.stats) {
      return null;
    }

    const { answeredCorrect = 0, answeredWrong = 0, consulted = 0, totalQuestions = 0 } = session.stats;
    
    // If no data at all, return null
    if (totalQuestions === 0) {
      return null;
    }

    const total = answeredCorrect + answeredWrong + consulted;
    
    // Handle edge case where total might be 0
    if (total === 0) {
      return [{
        name: 'Aucune donnée',
        value: 1,
        color: '#E5E7EB',
        percentage: 100
      }];
    }

    const data: ChartDataPoint[] = [];

    if (answeredCorrect > 0) {
      data.push({
        name: 'Répondue Juste',
        value: answeredCorrect,
        color: CHART_COLORS.correct,
        percentage: Math.round((answeredCorrect / total) * 100)
      });
    }

    if (answeredWrong > 0) {
      data.push({
        name: 'Répondue Fausse',
        value: answeredWrong,
        color: CHART_COLORS.incorrect,
        percentage: Math.round((answeredWrong / total) * 100)
      });
    }

    if (consulted > 0) {
      data.push({
        name: 'Consulté',
        value: consulted,
        color: CHART_COLORS.consulted,
        percentage: Math.round((consulted / total) * 100)
      });
    }

    return data;
  };

  const chartData = calculateChartData();

  // Size configurations
  const sizeConfig = {
    sm: {
      containerHeight: 'h-32',
      chartSize: 60,
      innerRadius: 20,
      outerRadius: 50,
      titleSize: 'text-sm',
      statsSize: 'text-xs'
    },
    md: {
      containerHeight: 'h-48',
      chartSize: 80,
      innerRadius: 30,
      outerRadius: 70,
      titleSize: 'text-base',
      statsSize: 'text-sm'
    },
    lg: {
      containerHeight: 'h-64',
      chartSize: 100,
      innerRadius: 40,
      outerRadius: 90,
      titleSize: 'text-lg',
      statsSize: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Get session type badge variant
  const getSessionTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'EXAM':
        return 'destructive';
      case 'PRACTICE':
        return 'default';
      case 'RESIDENCY':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={cn("border-border/50 shadow-sm hover:shadow-md transition-shadow", className)}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <CardTitle className={cn("line-clamp-2", config.titleSize)}>
              {session.title || 'Session sans titre'}
            </CardTitle>
            <div className="flex items-center justify-between">
              <Badge
                variant={getSessionTypeBadgeVariant(session.type)}
                className="text-xs"
              >
                {session.type || 'PRACTICE'}
              </Badge>
              {session.stats?.accuracy && (
                <Badge variant="outline" className="text-xs">
                  {session.stats.accuracy}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="pb-4">
        {!chartData ? (
          <div className={cn("flex items-center justify-center text-muted-foreground", config.containerHeight)}>
            <div className="text-center">
              <div className={cn("font-medium", config.statsSize)}>Aucune donnée disponible</div>
              <div className="text-xs text-muted-foreground mt-1">
                {session.stats?.totalQuestions === 0 ? 'Aucune question' : 'Données manquantes'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className={cn("w-full", config.containerHeight)}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={config.innerRadius}
                    outerRadius={config.outerRadius}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            {showStats && session.stats && (
              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={cn("font-semibold", config.statsSize)} style={{ color: CHART_COLORS.correct }}>
                      {session.stats.answeredCorrect || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Justes</div>
                  </div>
                  <div>
                    <div className={cn("font-semibold", config.statsSize)} style={{ color: CHART_COLORS.incorrect }}>
                      {session.stats.answeredWrong || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Fausses</div>
                  </div>
                  <div>
                    <div className={cn("font-semibold", config.statsSize)} style={{ color: CHART_COLORS.consulted }}>
                      {session.stats.consulted || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Consultées</div>
                  </div>
                </div>
                
                <div className="text-center pt-2 border-t border-border/30">
                  <div className={cn("text-muted-foreground", config.statsSize)}>
                    Total: {session.stats.totalQuestions || 0} questions
                  </div>
                  {session.stats.averagePerQuestion && (
                    <div className="text-xs text-muted-foreground">
                      Moyenne: {session.stats.averagePerQuestion}s/question
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
