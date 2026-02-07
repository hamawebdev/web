// @ts-nocheck
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Filter,
  X,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sessionType: 'PRACTICE' | 'EXAM'; // Removed 'all' as sessionType is now required
  sortBy: 'date' | 'score' | 'duration';
  sortOrder: 'asc' | 'desc';
}

interface SessionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
}

export function SessionFilters({ filters, onFiltersChange, className }: SessionFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Quick filter presets
  const quickFilters = [
    {
      label: 'This Week',
      action: () => {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        onFiltersChange({
          dateRange: { from: weekAgo, to: today }
        });
      }
    },
    {
      label: 'This Month',
      action: () => {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setMonth(today.getMonth() - 1);
        onFiltersChange({
          dateRange: { from: monthAgo, to: today }
        });
      }
    },
    {
      label: 'High Scores',
      action: () => {
        onFiltersChange({
          sortBy: 'score',
          sortOrder: 'desc'
        });
      }
    },
    {
      label: 'Recent',
      action: () => {
        onFiltersChange({
          sortBy: 'date',
          sortOrder: 'desc'
        });
      }
    }
  ];

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      dateRange: { from: null, to: null },
      sessionType: 'PRACTICE', // Default to PRACTICE since sessionType is required
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setSearchTerm('');
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.dateRange.from ||
    filters.dateRange.to ||
    searchTerm.length > 0;

  return (
    <Card className={cn("card-enhanced", className)}>
      <CardContent className="p-6 space-y-6">
        {/* Quick Filters */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Quick Filters
              <Badge variant="outline" className="text-xs bg-muted/50">
                Completed Sessions Only
              </Badge>
            </Label>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={filter.action}
                className="text-xs btn-modern"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Filters */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Search Sessions
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Session Type
            </Label>
            <Select
              value={filters.sessionType}
              onValueChange={(value) => onFiltersChange({ sessionType: value as 'PRACTICE' | 'EXAM' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRACTICE">Practice</SelectItem>
                <SelectItem value="EXAM">Exam</SelectItem>
              </SelectContent>
            </Select>
          </div>



          {/* Sort By */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort By
            </Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => onFiltersChange({ sortBy: value as any })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFiltersChange({ 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
                className="px-3"
              >
                {filters.sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Label>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from-date" className="text-xs text-muted-foreground">
                From
              </Label>
              <Input
                id="from-date"
                type="date"
                value={filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onFiltersChange({
                    dateRange: { ...filters.dateRange, from: date }
                  });
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="to-date" className="text-xs text-muted-foreground">
                To
              </Label>
              <Input
                id="to-date"
                type="date"
                value={filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  onFiltersChange({
                    dateRange: { ...filters.dateRange, to: date }
                  });
                }}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.sessionType !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Type: {filters.sessionType}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 hover:bg-transparent"
                    onClick={() => onFiltersChange({ sessionType: 'all' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="text-xs">
                  Date Range
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-2 hover:bg-transparent"
                    onClick={() => onFiltersChange({ dateRange: { from: null, to: null } })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
