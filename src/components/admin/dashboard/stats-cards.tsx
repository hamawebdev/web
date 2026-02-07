'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Activity, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  UserPlus,
  PlayCircle
} from 'lucide-react';
import { DashboardStats } from '@/types/api';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  loading?: boolean;
  className?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
  className
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-5 h-5 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="w-20 h-10 mb-3" />
          <Skeleton className="w-40 h-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 ease-out",
      "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
      "border-border/50 hover:border-primary/20",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sm:pb-6">
        {/* Enhanced Title - Primary Focus with responsive sizing */}
        <CardTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight leading-tight">
          {title}
        </CardTitle>
        {/* Enhanced Icon - Strong Visual Element with responsive sizing */}
        <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg sm:rounded-xl border border-primary/20">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Enhanced Value - Primary Data Point with responsive sizing */}
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-none">
          {typeof value === 'string' ? value : value.toLocaleString()}
        </div>

        {/* Enhanced Description - Secondary Information with responsive sizing */}
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
            {description}
          </p>
        )}

        {/* Enhanced Trend - Action Element with responsive sizing */}
        {trend && (
          <div className="flex items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
            <div className={cn(
              "flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full border",
              trend.isPositive
                ? "bg-chart-5/10 border-chart-5/20 text-chart-5"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              )}
            </div>
            <span className={cn(
              "text-sm sm:text-base font-bold",
              trend.isPositive ? "text-chart-5" : "text-destructive"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground font-medium">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards({ stats, loading, error }: StatsCardsProps) {
  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-destructive/20 bg-destructive/5">
            <CardContent className="text-center">
              <div className="text-destructive">
                <Activity className="w-10 h-10 mx-auto mb-4 opacity-60" />
                <p className="text-base font-semibold">Failed to load</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Users */}
      <StatCard
        title="Total Users"
        value={stats?.users?.total || 0}
        description={`${stats?.users?.students || 0} students, ${stats?.users?.employees || 0} employees`}
        icon={Users}
        trend={stats?.users?.newThisMonth ? {
          value: stats.users.newThisMonth,
          isPositive: stats.users.newThisMonth > 0,
          label: "new this month"
        } : undefined}
        loading={loading}
      />

      {/* Total Content */}
      <StatCard
        title="Content Library"
        value={stats?.content?.totalQuestions || 0}
        description={`${stats?.content?.totalQuizzes || 0} quizzes, ${stats?.content?.totalExams || 0} exams`}
        icon={BookOpen}
        loading={loading}
      />

      {/* Active Users */}
      <StatCard
        title="Active Users"
        value={stats?.activity?.activeUsers || 0}
        description={`${stats?.activity?.sessionsToday || 0} sessions today`}
        icon={Activity}
        loading={loading}
      />

      {/* Revenue */}
      <StatCard
        title="Revenue"
        value={`$${(stats?.subscriptions?.revenue || 0).toLocaleString()}`}
        description={`${stats?.subscriptions?.active || 0} active subscriptions`}
        icon={CreditCard}
        loading={loading}
      />
    </div>
  );
}

// Additional detailed stats cards for expanded view
export function DetailedStatsCards({ stats, loading, error }: StatsCardsProps) {
  if (error || loading) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* User Breakdown */}
      <Card className="hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 ease-out border-border/50 hover:border-primary/20">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-chart-1/10 rounded-lg sm:rounded-xl border border-chart-1/20">
              <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-chart-1" />
            </div>
            User Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Students</span>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="secondary" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1">{stats?.users?.students || 0}</Badge>
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-right">
                {stats?.users?.total ? Math.round((stats.users.students / stats.users.total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Employees</span>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="secondary" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1">{stats?.users?.employees || 0}</Badge>
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-right">
                {stats?.users?.total ? Math.round((stats.users.employees / stats.users.total) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3">
            <span className="text-sm sm:text-base font-semibold text-foreground">Admins</span>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1 border-primary/30 text-primary">{stats?.users?.admins || 0}</Badge>
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-right">
                {stats?.users?.total ? Math.round((stats.users.admins / stats.users.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Performance */}
      <Card className="hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 ease-out border-border/50 hover:border-primary/20">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-chart-2/10 rounded-lg sm:rounded-xl border border-chart-2/20">
              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
            </div>
            Session Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Total Sessions</span>
            <Badge variant="secondary" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1">{stats?.content?.totalSessions || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Today's Sessions</span>
            <Badge variant="secondary" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1">{stats?.activity?.sessionsToday || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3">
            <span className="text-sm sm:text-base font-semibold text-foreground">Avg. Score</span>
            <Badge variant="outline" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1 border-primary/30 text-primary">
              {stats?.activity?.averageSessionScore ? `${stats.activity.averageSessionScore}%` : 'N/A'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 ease-out border-border/50 hover:border-primary/20">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-3 sm:gap-4 text-lg sm:text-xl font-bold text-foreground">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-chart-4/10 rounded-lg sm:rounded-xl border border-chart-4/20">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-chart-4" />
            </div>
            Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Active</span>
            <Badge variant="default" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1 bg-primary text-primary-foreground">{stats?.subscriptions?.active || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3 border-b border-border/50">
            <span className="text-sm sm:text-base font-semibold text-foreground">Expired</span>
            <Badge variant="destructive" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1">{stats?.subscriptions?.expired || 0}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 sm:py-3">
            <span className="text-sm sm:text-base font-semibold text-foreground">Total Revenue</span>
            <Badge variant="outline" className="font-bold text-sm sm:text-base px-2 sm:px-3 py-1 border-primary/30 text-primary">
              ${(stats?.subscriptions?.revenue || 0).toLocaleString()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
