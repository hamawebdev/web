// @ts-nocheck
'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  Filter, 
  X, 
  Search, 
  Calendar,
  DollarSign,
  BookOpen,
  Users,
  Target,
  Award,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface StudyPackFilters {
  search: string;
  types: string[];
  yearNumbers: string[];
  priceRange: [number, number];
  subscriptionStatus: 'all' | 'subscribed' | 'unsubscribed';
  isActive: 'all' | 'active' | 'inactive';
  sortBy: 'name' | 'price' | 'createdAt' | 'subscribersCount' | 'totalQuestions';
  sortOrder: 'asc' | 'desc';
  minCourses: number;
  minQuestions: number;
  showNew: boolean;
  showRecent: boolean;
}

interface StudyPackFiltersProps {
  filters: StudyPackFilters;
  onFiltersChange: (filters: StudyPackFilters) => void;
  studyPacks: any[];
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function StudyPackFiltersComponent({
  filters,
  onFiltersChange,
  studyPacks,
  className,
  isOpen,
  onToggle
}: StudyPackFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic', 'content']);

  // Calculate filter statistics from available data
  const filterStats = useMemo(() => {
    if (!studyPacks?.length) return null;

    const types = [...new Set(studyPacks.map(pack => pack.type))];
    const yearNumbers = [...new Set(studyPacks.map(pack => pack.yearNumber).filter(Boolean))];
    const prices = studyPacks.map(pack => pack.price).filter(price => price > 0);
    const maxPrice = Math.max(...prices, 500);
    const minPrice = Math.min(...prices, 0);
    const maxCourses = Math.max(...studyPacks.map(pack => pack.statistics?.totalCourses || 0), 50);
    const maxQuestions = Math.max(...studyPacks.map(pack => pack.statistics?.totalQuestions || 0), 1000);

    return {
      types,
      yearNumbers: yearNumbers.sort(),
      priceRange: [minPrice, maxPrice] as [number, number],
      maxCourses,
      maxQuestions
    };
  }, [studyPacks]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  const updateFilter = useCallback((key: keyof StudyPackFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      types: [],
      yearNumbers: [],
      priceRange: filterStats?.priceRange || [0, 500],
      subscriptionStatus: 'all',
      isActive: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      minCourses: 0,
      minQuestions: 0,
      showNew: false,
      showRecent: false
    });
  }, [filterStats, onFiltersChange]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.types.length > 0) count++;
    if (filters.yearNumbers.length > 0) count++;
    if (filters.subscriptionStatus !== 'all') count++;
    if (filters.isActive !== 'all') count++;
    if (filters.minCourses > 0) count++;
    if (filters.minQuestions > 0) count++;
    if (filters.showNew) count++;
    if (filters.showRecent) count++;
    if (filterStats && (filters.priceRange[0] > filterStats.priceRange[0] || filters.priceRange[1] < filterStats.priceRange[1])) count++;
    return count;
  }, [filters, filterStats]);

  if (!filterStats) return null;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-8"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, description..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Basic Filters */}
        <Collapsible 
          open={expandedSections.includes('basic')}
          onOpenChange={() => toggleSection('basic')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Basic Filters</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.includes('basic') && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Study Pack Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Study Pack Type</Label>
              <div className="flex flex-wrap gap-2">
                {filterStats.types.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.types.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('types', [...filters.types, type]);
                        } else {
                          updateFilter('types', filters.types.filter(t => t !== type));
                        }
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Academic Year */}
            {filterStats.yearNumbers.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Academic Year</Label>
                <div className="flex flex-wrap gap-2">
                  {filterStats.yearNumbers.map((year) => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox
                        id={`year-${year}`}
                        checked={filters.yearNumbers.includes(year)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilter('yearNumbers', [...filters.yearNumbers, year]);
                          } else {
                            updateFilter('yearNumbers', filters.yearNumbers.filter(y => y !== year));
                          }
                        }}
                      />
                      <Label htmlFor={`year-${year}`} className="text-sm">
                        Year {year}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscription Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Subscription Status</Label>
              <Select
                value={filters.subscriptionStatus}
                onValueChange={(value) => updateFilter('subscriptionStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Study Packs</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Not Subscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Availability</Label>
              <Select
                value={filters.isActive}
                onValueChange={(value) => updateFilter('isActive', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Content Filters */}
        <Collapsible 
          open={expandedSections.includes('content')}
          onOpenChange={() => toggleSection('content')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <span className="font-medium">Content Filters</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                expandedSections.includes('content') && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                max={filterStats.priceRange[1]}
                min={filterStats.priceRange[0]}
                step={10}
                className="w-full"
              />
            </div>

            {/* Minimum Courses */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Minimum Courses: {filters.minCourses}
              </Label>
              <Slider
                value={[filters.minCourses]}
                onValueChange={(value) => updateFilter('minCourses', value[0])}
                max={filterStats.maxCourses}
                min={0}
                step={1}
                className="w-full"
              />
            </div>

            {/* Minimum Questions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Minimum Questions: {filters.minQuestions}
              </Label>
              <Slider
                value={[filters.minQuestions]}
                onValueChange={(value) => updateFilter('minQuestions', value[0])}
                max={filterStats.maxQuestions}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Temporal Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Recency</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-new"
                checked={filters.showNew}
                onCheckedChange={(checked) => updateFilter('showNew', checked)}
              />
              <Label htmlFor="show-new" className="text-sm">
                Show New (Last 7 days)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-recent"
                checked={filters.showRecent}
                onCheckedChange={(checked) => updateFilter('showRecent', checked)}
              />
              <Label htmlFor="show-recent" className="text-sm">
                Show Recent (Last 30 days)
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sort Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Sort By</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={filters.sortBy}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="subscribersCount">Popularity</SelectItem>
                <SelectItem value="totalQuestions">Questions</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for managing study pack filters
export function useStudyPackFilters(studyPacks: any[], subscriptions: any[] = []) {
  const [filters, setFilters] = useState<StudyPackFilters>({
    search: '',
    types: [],
    yearNumbers: [],
    priceRange: [0, 500],
    subscriptionStatus: 'all',
    isActive: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    minCourses: 0,
    minQuestions: 0,
    showNew: false,
    showRecent: false
  });

  const filteredAndSortedPacks = useMemo(() => {
    if (!studyPacks?.length) return [];

    const filtered = studyPacks.filter(pack => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          pack.name.toLowerCase().includes(searchLower) ||
          pack.description.toLowerCase().includes(searchLower) ||
          pack.type.toLowerCase().includes(searchLower) ||
          (pack.yearNumber && pack.yearNumber.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filters.types.length > 0 && !filters.types.includes(pack.type)) {
        return false;
      }

      // Year filter
      if (filters.yearNumbers.length > 0 && (!pack.yearNumber || !filters.yearNumbers.includes(pack.yearNumber))) {
        return false;
      }

      // Price filter
      if (pack.price < filters.priceRange[0] || pack.price > filters.priceRange[1]) {
        return false;
      }

      // Subscription status filter
      if (filters.subscriptionStatus !== 'all') {
        const isSubscribed = subscriptions.some(sub => sub.studyPack.id === pack.id && sub.isActive);
        if (filters.subscriptionStatus === 'subscribed' && !isSubscribed) return false;
        if (filters.subscriptionStatus === 'unsubscribed' && isSubscribed) return false;
      }

      // Active status filter
      if (filters.isActive !== 'all') {
        if (filters.isActive === 'active' && !pack.isActive) return false;
        if (filters.isActive === 'inactive' && pack.isActive) return false;
      }

      // Content filters
      if (filters.minCourses > 0 && (pack.statistics?.totalCourses || 0) < filters.minCourses) {
        return false;
      }

      if (filters.minQuestions > 0 && (pack.statistics?.totalQuestions || 0) < filters.minQuestions) {
        return false;
      }

      // Temporal filters
      if (filters.showNew || filters.showRecent) {
        const createdDate = new Date(pack.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (filters.showNew && daysDiff > 7) return false;
        if (filters.showRecent && daysDiff > 30) return false;
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'subscribersCount':
          aValue = a.statistics?.subscribersCount || 0;
          bValue = b.statistics?.subscribersCount || 0;
          break;
        case 'totalQuestions':
          aValue = a.statistics?.totalQuestions || 0;
          bValue = b.statistics?.totalQuestions || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [studyPacks, filters, subscriptions]);

  return {
    filters,
    setFilters,
    filteredPacks: filteredAndSortedPacks,
    totalCount: studyPacks?.length || 0,
    filteredCount: filteredAndSortedPacks.length
  };
}