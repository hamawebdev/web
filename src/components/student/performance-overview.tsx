// @ts-nocheck
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BookOpen,
  GraduationCap,
  Flame,
  Award,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerformanceOverviewProps {
  performance: {
    studyStreak: number
    improvementTrend: number
    weeklyStats: Array<{
      week: string
      sessionsCompleted: number
      averageScore: number
    }>
    subjectPerformance: Array<{
      subject: string
      averageScore: number
      totalSessions: number
    }>
  } | null
}

export function PerformanceOverview({ performance }: PerformanceOverviewProps) {
  if (!performance) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            Performance Overview
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Loading your performance data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border/50 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg mb-3"></div>
                <div className="h-6 w-12 bg-muted rounded mb-1"></div>
                <div className="h-4 w-16 bg-muted rounded mb-1"></div>
                <div className="h-3 w-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate metrics from API data
  const totalSessions = performance.weeklyStats.reduce((sum, week) => sum + week.sessionsCompleted, 0)
  const totalQuestions = totalSessions * 10 // Estimate 10 questions per session
  const totalSubjects = performance.subjectPerformance.length
  
  // Calculate average score from subject performance
  const averageScore = performance.subjectPerformance.length > 0
    ? Math.round(performance.subjectPerformance.reduce((sum, subject) => sum + subject.averageScore, 0) / performance.subjectPerformance.length)
    : 0

  // Get trend direction
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return TrendingUp
    if (trend < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-chart-2'
    if (trend < 0) return 'text-destructive'
    return 'text-muted-foreground'
  }

  const TrendIcon = getTrendIcon(performance.improvementTrend)

  const metrics = [
    {
      label: 'Study Streak',
      value: performance.studyStreak,
      unit: 'days',
      icon: Flame,
      gradient: 'from-chart-5 to-orange-500',
      bgGradient: 'from-chart-5/10 to-orange-500/10',
      description: 'Consecutive study days'
    },
    {
      label: 'Total Questions',
      value: totalQuestions.toLocaleString(),
      unit: '',
      icon: BookOpen,
      gradient: 'from-chart-1 to-blue-500',
      bgGradient: 'from-chart-1/10 to-blue-500/10',
      description: 'Questions answered'
    },
    {
      label: 'Sessions',
      value: totalSessions.toLocaleString(),
      unit: '',
      icon: GraduationCap,
      gradient: 'from-chart-2 to-green-500',
      bgGradient: 'from-chart-2/10 to-green-500/10',
      description: 'Sessions completed'
    },
    {
      label: 'Average Score',
      value: averageScore,
      unit: '%',
      icon: Award,
      gradient: 'from-chart-3 to-purple-500',
      bgGradient: 'from-chart-3/10 to-purple-500/10',
      description: 'Overall performance'
    }
  ]

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          Performance Overview
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <div
                key={metric.label}
                className="flex flex-col items-center p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 mb-3 bg-primary/10 rounded-lg">
                  <Icon className="w-5 h-5 text-primary" />
                </div>

                {/* Value */}
                <div className="text-2xl font-bold text-foreground mb-1">
                  {metric.value}{metric.unit}
                </div>

                {/* Label */}
                <div className="text-sm font-medium text-foreground text-center mb-1">
                  {metric.label}
                </div>

                {/* Description */}
                <div className="text-xs text-muted-foreground text-center">
                  {metric.description}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
