'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-states';
import { EmptyState } from '@/components/ui/empty-state';
import { UnitModuleCard, UnitModuleItem } from './unit-module-card';
import { UnitModuleCompactCard } from './unit-module-compact-card';
import { UnitModuleImageCard } from './unit-module-image-card';
import { Building2, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnitModuleGridProps {
  units?: Array<{
    id: number;
    name: string;
    description?: string;
    logoUrl?: string;
    modules?: Array<{
      id: number;
      name: string;
      description?: string;
    }>;
  }>;
  independentModules?: Array<{
    id: number;
    name: string;
    description?: string;
    logoUrl?: string;
  }>;
  onItemClick: (item: UnitModuleItem) => void;
  variant?: 'practice' | 'exam';
  loading?: boolean;
  error?: string | null;
  className?: string;
  showSessionCounts?: boolean;
  selectedItem?: UnitModuleItem | null;
  layout?: 'default' | 'compact'; // New prop to control card layout
}

export function UnitModuleGrid({
  units = [],
  independentModules = [],
  onItemClick,
  variant = 'practice',
  loading = false,
  error = null,
  className,
  showSessionCounts = true,
  selectedItem = null,
  layout = 'compact' // Default to compact layout for modern design
}: UnitModuleGridProps) {

  // Convert API data to UnitModuleItem format
  const unitItems: UnitModuleItem[] = units.map(unit => ({
    id: unit.id,
    name: unit.name,
    description: unit.description,
    logoUrl: unit.logoUrl,
    type: 'unite' as const,
    moduleCount: unit.modules?.length || 0,
    sessionCount: 0 // Will be populated by parent component if needed
  }));

  const independentModuleItems: UnitModuleItem[] = independentModules.map(module => ({
    id: module.id,
    name: module.name,
    description: module.description,
    logoUrl: module.logoUrl,
    type: 'module' as const,
    isIndependent: true,
    sessionCount: 0 // Will be populated by parent component if needed
  }));

  const allItems = [...unitItems, ...independentModuleItems];

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-lg font-medium">Loading content...</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your available {variant === 'practice' ? 'practice' : 'exam'} content
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("py-12", className)}>
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Content"
          description={error}
        />
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className={cn("py-12", className)}>
        <EmptyState
          icon={variant === 'practice' ? Building2 : BookOpen}
          title="No Content Available"
          description={`No study units or modules found for ${variant === 'practice' ? 'practice' : 'exam'} sessions. Please check your study pack access or contact support.`}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Units Section */}
      {unitItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Building2 className={cn(
              "h-5 w-5 flex-shrink-0",
              variant === 'practice' ? "text-primary" : "text-chart-2"
            )} />
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Units</h3>
            <Badge variant="secondary" className="text-xs">{unitItems.length}</Badge>
          </div>

          <div className={cn(
            "grid gap-4 auto-rows-fr",
            layout === 'compact'
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          )}>
            {unitItems.map((item) => {
              const CardComponent = layout === 'compact' ? UnitModuleImageCard : UnitModuleCard;
              return (
                <CardComponent
                  key={`unit-${item.id}`}
                  item={item}
                  onClick={onItemClick}
                  variant={variant}
                  showSessionCount={showSessionCounts}
                  isSelected={selectedItem?.type === 'unite' && selectedItem.id === item.id}
                />
              );
            })}
          </div>
        </div>
      )}


      {/* Independent Modules Section */}
      {independentModuleItems.length > 0 && (
        <div className="space-y-4">
          <div className={cn(
            "grid gap-4 auto-rows-fr",
            layout === 'compact'
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
              : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          )}>
            {independentModuleItems.map((item) => {
              const CardComponent = layout === 'compact' ? UnitModuleImageCard : UnitModuleCard;
              return (
                <CardComponent
                  key={`module-${item.id}`}
                  item={item}
                  onClick={onItemClick}
                  variant={variant}
                  showSessionCount={showSessionCounts}
                  isSelected={selectedItem?.type === 'module' && selectedItem.id === item.id && item.isIndependent}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
