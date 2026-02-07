'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useContentFilters } from '@/hooks/use-content-filters';
import { LoadingSpinner } from '@/components/loading-states';
import { UnitModuleGrid } from './unit-module-grid';
import { UnitModuleItem } from './unit-module-compact-card';
import { cn } from '@/lib/utils';

export interface UnitModuleSelection {
  type: 'unite' | 'module';
  id: number;
  name: string;
  uniteId?: number;
  uniteName?: string;
}

interface UnitModuleSelectorProps {
  onSelection: (selection: UnitModuleSelection) => void;
  selectedItem?: UnitModuleSelection | null;
  onBack?: () => void;
  title?: string;
  description?: string;
  className?: string;
  yearLevel?: string; // Optional year level filter
}

export function UnitModuleSelector({
  onSelection,
  selectedItem,
  onBack,
  title = "Select Unit or Module",
  description = "Choose a unit to view all modules within it, or select a specific module",
  className,
  yearLevel
}: UnitModuleSelectorProps) {
  const { filters, loading, error } = useContentFilters({ yearLevel });

  // Handle unit/module selection using UnitModuleGrid
  const handleUnitModuleSelection = (item: UnitModuleItem) => {
    const selection: UnitModuleSelection = {
      type: item.type,
      id: item.id,
      name: item.name,
      uniteId: item.type === 'unite' ? item.id : undefined,
      uniteName: item.type === 'unite' ? item.name : undefined
    };

    // Log the selection for debugging
    console.log('🏗️ [UnitModuleSelector] Item selected:', {
      selection,
      item,
      timestamp: new Date().toISOString()
    });

    onSelection(selection);
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <LoadingSpinner size="md" />
            <span className="ml-3 text-muted-foreground">Loading units and modules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-destructive", className)}>
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-2">Failed to load content</div>
          <div className="text-sm text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!filters) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">No content available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Use UnitModuleGrid for consistent layout */}
        <UnitModuleGrid
          units={filters?.unites}
          independentModules={filters?.independentModules}
          onItemClick={handleUnitModuleSelection}
          variant="practice"
          layout="compact"
          loading={false}
          error={null}
          showSessionCounts={false}
          selectedItem={selectedItem ? {
            id: selectedItem.id,
            name: selectedItem.name,
            type: selectedItem.type,
            isIndependent: selectedItem.type === 'module'
          } : null}
        />
      </CardContent>
    </Card>
  );
}
