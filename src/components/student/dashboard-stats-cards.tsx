// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  FileText, 
  Layers
} from 'lucide-react';
import { useStudentDashboardStats } from '@/hooks/use-student-dashboard-stats';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  loading?: boolean;
  className?: string;
}

function StatCard({ title, value, icon: Icon, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("relative overflow-hidden", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-lg font-bold">
            <Skeleton className="h-5 w-32" />
          </CardTitle>
          <Skeleton className="h-5 w-5 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-20 mb-3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 ease-out",
      "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1",
      "border-border/50 hover:border-primary/20",
      "bg-card",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sm:pb-6">
        {/* Enhanced Title - Primary Focus with responsive sizing */}
        <CardTitle className={cn(
          "text-base sm:text-lg font-bold tracking-tight leading-tight",
          className?.includes("text-white") ? "text-white" : "text-foreground"
        )}>
          {title}
        </CardTitle>
        {/* Enhanced Icon - Strong Visual Element with responsive sizing */}
        <div className={cn(
          "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border",
          className?.includes("text-white") 
            ? "bg-white/20 border-white/30" 
            : "bg-primary/10 border-primary/20"
        )}>
          <Icon className={cn(
            "w-4 h-4 sm:w-5 sm:h-5",
            className?.includes("text-white") ? "text-white" : "text-primary"
          )} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Enhanced Value - Primary Data Point with responsive sizing */}
        <div className={cn(
          "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-none",
          className?.includes("text-white") ? "text-white" : "text-foreground"
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStatsCards() {
  const {
    derivedData,
    loading,
    error
  } = useStudentDashboardStats();

  if (error) {
    return null;
  }

  const statsCards = derivedData?.statsCards;

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
      {/* Total Questions */}
      <StatCard
        title="Total Questions"
        value={statsCards?.totalQuestions || 0}
        icon={FileText}
        loading={loading}
        className="bg-gradient-to-br from-[#18686E] via-[#1A6E72] to-[#094455] text-white border-white/20 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-1"
      />

      {/* Independent Modules */}
      <StatCard
        title="Independent Modules"
        value={statsCards?.independentModules || 0}
        icon={BookOpen}
        loading={loading}
        className="bg-gradient-to-br from-[#18686E] via-[#1A6E72] to-[#094455] text-white border-white/20 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-1"
      />

      {/* Total Units */}
      <StatCard
        title="Total Units"
        value={statsCards?.totalUnits || 0}
        icon={Layers}
        loading={loading}
        className="bg-gradient-to-br from-[#18686E] via-[#1A6E72] to-[#094455] text-white border-white/20 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-1"
      />
    </div>
  );
}
