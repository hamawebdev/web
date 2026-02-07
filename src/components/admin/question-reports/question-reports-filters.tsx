'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import { QuestionReportsFilters as QuestionReportsFiltersType } from '@/hooks/admin/use-question-reports-management';

interface QuestionReportsFiltersProps {
  filters: QuestionReportsFiltersType;
  onFiltersChange: (filters: Partial<QuestionReportsFiltersType>) => void;
  onClearFilters: () => void;
}

const REPORT_TYPE_OPTIONS = [
  { value: 'INCORRECT_ANSWER', label: 'Incorrect Answer' },
  { value: 'UNCLEAR_QUESTION', label: 'Unclear Question' },
  { value: 'TYPO', label: 'Typo' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'status', label: 'Status' },
  { value: 'reportType', label: 'Report Type' },
];

export function QuestionReportsFilters({ filters, onFiltersChange, onClearFilters }: QuestionReportsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<QuestionReportsFiltersType>(filters);

  const handleFilterChange = (key: keyof QuestionReportsFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange({ [key]: value });
  };

  const handleClearFilters = () => {
    setLocalFilters({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    onClearFilters();
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof QuestionReportsFiltersType];
    return value !== undefined && value !== '' && value !== null && 
           !(key === 'page' && value === 1) && 
           !(key === 'limit' && value === 10) &&
           !(key === 'sortBy' && value === 'createdAt') &&
           !(key === 'sortOrder' && value === 'desc');
  });

  return (
    <div className="space-y-4">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Label htmlFor="search">Search Reports</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by question text, user, or description..."
              value={localFilters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <Label htmlFor="status">Status</Label>
          <Select
            value={localFilters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Report Type Filter */}
        <div className="w-full md:w-48">
          <Label htmlFor="reportType">Report Type</Label>
          <Select
            value={localFilters.reportType || 'all'}
            onValueChange={(value) => handleFilterChange('reportType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {REPORT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Question ID Filter */}
        <div className="w-full md:w-48">
          <Label htmlFor="questionId">Question ID</Label>
          <Input
            id="questionId"
            type="number"
            placeholder="Enter question ID"
            value={localFilters.questionId || ''}
            onChange={(e) => handleFilterChange('questionId', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        {/* User ID Filter */}
        <div className="w-full md:w-48">
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            type="number"
            placeholder="Enter user ID"
            value={localFilters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        {/* Sort Options */}
        <div className="w-full md:w-48">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select
            value={localFilters.sortBy || 'createdAt'}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="w-full md:w-32">
          <Label htmlFor="sortOrder">Order</Label>
          <Select
            value={localFilters.sortOrder || 'desc'}
            onValueChange={(value) => handleFilterChange('sortOrder', value as 'asc' | 'desc')}
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

      {/* Active Filters and Clear Button */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <Badge variant="secondary">
              {Object.keys(filters).filter(key => {
                const value = filters[key as keyof QuestionReportsFiltersType];
                return value !== undefined && value !== '' && value !== null && 
                       !(key === 'page' && value === 1) && 
                       !(key === 'limit' && value === 10) &&
                       !(key === 'sortBy' && value === 'createdAt') &&
                       !(key === 'sortOrder' && value === 'desc');
              }).length} active
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Quick Filter Badges */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={localFilters.status === 'PENDING' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('status', localFilters.status === 'PENDING' ? undefined : 'PENDING')}
        >
          Pending Only
        </Button>
        <Button
          variant={localFilters.reportType === 'INCORRECT_ANSWER' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('reportType', localFilters.reportType === 'INCORRECT_ANSWER' ? undefined : 'INCORRECT_ANSWER')}
        >
          Incorrect Answers
        </Button>
        <Button
          variant={localFilters.reportType === 'UNCLEAR_QUESTION' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFilterChange('reportType', localFilters.reportType === 'UNCLEAR_QUESTION' ? undefined : 'UNCLEAR_QUESTION')}
        >
          Unclear Questions
        </Button>
      </div>
    </div>
  );
}
