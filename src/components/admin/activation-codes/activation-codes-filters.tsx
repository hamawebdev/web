'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { ActivationCodeFilters, PaginationParams } from '@/types/api';

interface ActivationCodesFiltersProps {
  filters: ActivationCodeFilters & PaginationParams;
  onFiltersChange: (filters: Partial<ActivationCodeFilters & PaginationParams>) => void;
  onClearFilters: () => void;
}

export function ActivationCodesFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ActivationCodesFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: localSearch.trim() || undefined, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ isActive: undefined, page: 1 });
    } else {
      onFiltersChange({ isActive: value === 'active', page: 1 });
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onFiltersChange({ search: undefined, page: 1 });
  };

  const hasActiveFilters = filters.search || filters.isActive !== undefined;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search codes, descriptions..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-8"
              />
              {localSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={handleClearSearch}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={
              filters.isActive === undefined ? 'all' :
              filters.isActive ? 'active' : 'inactive'
            }
            onValueChange={handleStatusChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results per page */}
        <div className="space-y-2">
          <Label htmlFor="limit">Results per page</Label>
          <Select
            value={filters.limit?.toString() || '20'}
            onValueChange={(value) => onFiltersChange({ limit: parseInt(value), page: 1 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <span className="font-medium">Active filters:</span>
            {filters.search && (
              <span className="bg-background px-2 py-1 rounded text-xs">
                Search: "{filters.search}"
              </span>
            )}
            {filters.isActive !== undefined && (
              <span className="bg-background px-2 py-1 rounded text-xs">
                Status: {filters.isActive ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
