// @ts-nocheck
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, LineChart, Line, Area, AreaChart } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Target,
  Award
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DataPoint {
  date: string
  correct: number
  incorrect: number
  viewed: number
}

interface Props {
  weeklyPerformance: DataPoint[]
  loading?: boolean
}

export function WeeklyPerformanceChart({ weeklyPerformance, loading }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')

  const data = weeklyPerformance.map((d) => ({
    name: new Date(d.date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    }),
    date: d.date,
    Justes: d.correct,
    Fausses: d.incorrect,
    Consultées: d.viewed,
    Total: d.correct + d.incorrect + d.viewed,
    Accuracy: Math.round((d.correct / (d.correct + d.incorrect)) * 100) || 0
  }))

  if (loading) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted/30 rounded-lg animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (weeklyPerformance.length === 0) {
    return (
      <Card className="bg-card border border-border shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            Weekly Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-muted-foreground">
            Aucun élément disponible.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Chart colors using design system values
  const colors = {
    Justes: '#00B050', // Justes - Green
    Fausses: '#FF0000', // Fausses - Red
    Consultées: '#BFBFBF', // Consultées - Gray
    Accuracy: '#00B050' // Use green for accuracy trend
  }

  // Calculate trends
  const totalQuestions = data.reduce((sum, d) => sum + d.Total, 0)
  const totalCorrect = data.reduce((sum, d) => sum + d.Justes, 0)
  const overallAccuracy = Math.round((totalCorrect / (totalQuestions - data.reduce((sum, d) => sum + d.Consultées, 0))) * 100) || 0

  const lastWeekAccuracy = data[data.length - 1]?.Accuracy || 0
  const previousWeekAccuracy = data[data.length - 2]?.Accuracy || 0
  const accuracyTrend = lastWeekAccuracy - previousWeekAccuracy

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-card border-border rounded-lg p-3 shadow-lg'>
          <p className='text-sm font-semibold mb-2 text-foreground'>{`Week: ${label}`}</p>
          <div className='space-y-1'>
            {payload.map((entry: any, index: number) => (
              <div key={index} className='flex items-center gap-2'>
                <div
                  className='w-2 h-2 rounded-full'
                  style={{ backgroundColor: entry.color }}
                ></div>
                <p className='text-xs text-muted-foreground'>
                  <span className='font-semibold text-foreground'>{entry.dataKey}:</span> {entry.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 10, left: 10, bottom: 5 }
    }

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="Justes"
              stroke={colors.Justes}
              strokeWidth={2}
              dot={{ fill: colors.Justes, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Fausses"
              stroke={colors.Fausses}
              strokeWidth={2}
              dot={{ fill: colors.Fausses, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Consultées"
              stroke={colors.Consultées}
              strokeWidth={2}
              dot={{ fill: colors.Consultées, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
            <Area
              type="monotone"
              dataKey="Justes"
              stackId="1"
              stroke={colors.Justes}
              fill={colors.Justes}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Fausses"
              stackId="1"
              stroke={colors.Fausses}
              fill={colors.Fausses}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="Consultées"
              stackId="1"
              stroke={colors.Consultées}
              fill={colors.Consultées}
              fillOpacity={0.7}
            />
          </AreaChart>
        )

      default:
        return (
          <BarChart {...commonProps}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="rect"
            />
            <Bar dataKey="Justes" fill={colors.Justes} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Fausses" fill={colors.Fausses} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Consultées" fill={colors.Consultées} radius={[3, 3, 0, 0]} />
          </BarChart>
        )
    }
  }

  return (
    <Card className='bg-card border-border shadow-sm'>

      <CardHeader className='pb-4'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4'>
            <div className='space-y-1 min-w-0 flex-1'>
              <CardTitle className='flex items-center gap-2 text-lg font-semibold'>
                <div className='p-1.5 bg-primary/10 rounded-lg'>
                  <BarChart3 className='h-4 w-4 text-primary' />
                </div>
                <span className='truncate'>Weekly Performance</span>
              </CardTitle>
              <CardDescription className='flex items-center gap-2 text-sm text-muted-foreground'>
                {accuracyTrend !== 0 && (
                  <>
                    <div className='p-1 bg-muted/50 rounded-full'>
                      {accuracyTrend > 0 ? (
                        <TrendingUp className='h-3 w-3 text-chart-2' />
                      ) : (
                        <TrendingDown className='h-3 w-3 text-destructive' />
                      )}
                    </div>
                    <span className='truncate'>
                      {accuracyTrend > 0 ? 'Improving' : 'Declining'} by {Math.abs(accuracyTrend)}%
                    </span>
                  </>
                )}
              </CardDescription>
            </div>

            <Badge variant='secondary' className='text-xs font-medium self-start sm:self-auto flex-shrink-0'>
              {data.length} Week{data.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Chart Type Controls */}
          <div className='flex items-center justify-center sm:justify-end'>
            <div className='flex items-center gap-1 bg-muted/50 rounded-lg p-1 border-border'>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setChartType('bar')}
                className='h-8 px-2 text-xs'
              >
                <BarChart3 className='h-3 w-3 sm:mr-1' />
                <span className='hidden sm:inline'>Bar</span>
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setChartType('line')}
                className='h-8 px-2 text-xs'
              >
                <LineChartIcon className='h-3 w-3 sm:mr-1' />
                <span className='hidden sm:inline'>Line</span>
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setChartType('area')}
                className='h-8 px-2 text-xs'
              >
                <Target className='h-3 w-3 sm:mr-1' />
                <span className='hidden sm:inline'>Area</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4'>
          <div className='rounded-lg p-3 text-center border bg-primary/10 border-primary/20'>
            <div className='flex items-center justify-center mb-1'>
              <div className='p-1 rounded-full bg-primary/20'>
                <Target className='h-3 w-3 text-primary' />
              </div>
            </div>
            <div className='text-lg font-bold' style={{ color: '#18686E' }}>{overallAccuracy}%</div>
            <div className='text-xs font-medium' style={{ color: '#18686E' }}>Overall Accuracy</div>
          </div>

          <div className='rounded-lg p-3 text-center border bg-primary/10 border-primary/20'>
            <div className='flex items-center justify-center mb-1'>
              <div className='p-1 rounded-full bg-primary/20'>
                <BarChart3 className='h-3 w-3 text-primary' />
              </div>
            </div>
            <div className='text-lg font-bold' style={{ color: '#18686E' }}>{totalQuestions}</div>
            <div className='text-xs font-medium' style={{ color: '#18686E' }}>Total Questions</div>
          </div>

          <div className='rounded-lg p-3 text-center border bg-primary/10 border-primary/20'>
            <div className='flex items-center justify-center mb-1'>
              <div className='p-1 rounded-full bg-primary/20'>
                {accuracyTrend > 0 ? (
                  <TrendingUp className='h-3 w-3 text-primary' />
                ) : accuracyTrend < 0 ? (
                  <TrendingDown className='h-3 w-3 text-destructive' />
                ) : (
                  <Award className='h-3 w-3 text-primary' />
                )}
              </div>
            </div>
            <div className={cn(
              'text-lg font-bold',
              accuracyTrend < 0 ? 'text-destructive' : ''
            )} style={accuracyTrend >= 0 ? { color: '#18686E' } : {}}>
              {Math.abs(accuracyTrend)}%
            </div>
            <div className='text-xs font-medium' style={{ color: '#18686E' }}>Weekly Trend</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart Container */}
        <div className='w-full h-56 sm:h-72 lg:h-80 bg-muted/20 rounded-lg p-2 sm:p-3 border-border'>
          <ResponsiveContainer width='100%' height='100%'>
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}