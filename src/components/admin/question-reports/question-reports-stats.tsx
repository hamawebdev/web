'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileQuestion,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Edit,
  HelpCircle,
  TrendingUp,
  Timer
} from 'lucide-react';
import { QuestionReportsStats as QuestionReportsStatsType } from '@/hooks/admin/use-question-reports-management';

interface QuestionReportsStatsProps {
  stats: QuestionReportsStatsType;
  loading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  loading?: boolean;
  className?: string;
  valueColor?: string;
}

function StatCard({ title, value, description, icon: Icon, trend, loading, className, valueColor }: StatCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor || ''}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <Badge 
              variant={trend.isPositive ? "default" : "secondary"}
              className="text-xs"
            >
              {trend.isPositive ? '+' : ''}{trend.value} {trend.label}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function QuestionReportsStats({ stats, loading }: QuestionReportsStatsProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${Math.round(hours)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Reports */}
        <StatCard
          title="Total Reports"
          value={formatNumber(stats?.total || 0)}
          description="All time submissions"
          icon={FileQuestion}
          loading={loading}
        />

        {/* Pending Reports */}
        <StatCard
          title="Pending Reports"
          value={formatNumber(stats?.pending || 0)}
          description="Awaiting review"
          icon={Clock}
          valueColor="text-orange-600"
          loading={loading}
        />

        {/* Reviewed Reports */}
        <StatCard
          title="Reviewed Reports"
          value={formatNumber(stats?.reviewed || 0)}
          description="Under review"
          icon={MessageSquare}
          valueColor="text-blue-600"
          loading={loading}
        />

        {/* Resolved Reports */}
        <StatCard
          title="Resolved Reports"
          value={formatNumber(stats?.resolved || 0)}
          description="Successfully addressed"
          icon={CheckCircle}
          valueColor="text-green-600"
          loading={loading}
        />

        {/* Dismissed Reports */}
        <StatCard
          title="Dismissed Reports"
          value={formatNumber(stats?.dismissed || 0)}
          description="Not actionable"
          icon={XCircle}
          valueColor="text-red-600"
          loading={loading}
        />
      </div>


      {/* Report Types Breakdown */}
      {stats?.byType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report Types Breakdown</CardTitle>
            <CardDescription>Distribution of report types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Incorrect Answer</span>
                </div>
                <Badge variant="secondary">{stats.byType.incorrectAnswer}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Unclear Question</span>
                </div>
                <Badge variant="secondary">{stats.byType.unclearQuestion}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Edit className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Typo</span>
                </div>
                <Badge variant="secondary">{stats.byType.typo}</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Other</span>
                </div>
                <Badge variant="secondary">{stats.byType.other}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
