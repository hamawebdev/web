'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';
import { SpecialtyFilters } from '@/hooks/admin/use-specialty-management';

interface SpecialtyFiltersProps {
  filters: SpecialtyFilters;
  onFiltersChange: (filters: Partial<SpecialtyFilters>) => void;
  onClearFilters: () => void;
  isVisible: boolean;
}

export function SpecialtyFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible,
}: SpecialtyFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SpecialtyFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearchChange = (value: string) => {
    const newFilters = { ...localFilters, search: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof SpecialtyFilters]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="ml-auto text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Filter */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Specialties</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by specialty name..."
              value={localFilters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <div className="text-sm text-muted-foreground">
              Active filters:
              <div className="mt-1 flex flex-wrap gap-1">
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                    Search: "{filters.search}"
                    <button
                      onClick={() => handleSearchChange('')}
                      className="ml-1 hover:text-primary/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
