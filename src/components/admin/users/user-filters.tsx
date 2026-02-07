'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import { UserFilters as UserFiltersType } from '@/hooks/admin/use-user-management';
import { AdminService } from '@/lib/api-services';

interface UserFiltersProps {
  filters: UserFiltersType;
  onFiltersChange: (filters: Partial<UserFiltersType>) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

interface University {
  id: number;
  name: string;
  country: string;
}

export function UserFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  hasFilters,
}: UserFiltersProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  // Load universities for filter dropdown
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const response = await AdminService.getQuestionFilters();
        
        if (response.success && response.data?.filters?.universities) {
          setUniversities(response.data.filters.universities);
        }
      } catch (error) {
        console.error('Failed to load universities:', error);
      } finally {
        setLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, []);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ search: value });
  };

  const handleRoleChange = (value: string) => {
    onFiltersChange({ 
      role: value === 'all' ? '' : value as 'STUDENT' | 'ADMIN' | 'EMPLOYEE' 
    });
  };

  const handleUniversityChange = (value: string) => {
    onFiltersChange({ 
      university: value === 'all' ? undefined : parseInt(value) 
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      isActive: value === 'all' ? undefined : value === 'active' 
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role) count++;
    if (filters.university) count++;
    if (filters.isActive !== undefined) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Users</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name or email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Role Filter */}
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={filters.role || 'all'}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* University Filter */}
        <div className="space-y-2">
          <Label>University</Label>
          <Select
            value={filters.university?.toString() || 'all'}
            onValueChange={handleUniversityChange}
            disabled={loadingUniversities}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingUniversities ? "Loading..." : "All universities"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id.toString()}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={
              filters.isActive === undefined 
                ? 'all' 
                : filters.isActive 
                  ? 'active' 
                  : 'inactive'
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
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ search: '' })}
              />
            </Badge>
          )}
          
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              Role: {filters.role}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ role: '' })}
              />
            </Badge>
          )}
          
          {filters.university && (
            <Badge variant="secondary" className="gap-1">
              University: {universities.find(u => u.id === filters.university)?.name || 'Unknown'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ university: undefined })}
              />
            </Badge>
          )}
          
          {filters.isActive !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.isActive ? 'Active' : 'Inactive'}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ isActive: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Clear Filters Button */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters ({activeFiltersCount})
          </Button>
        </div>
      )}
    </div>
  );
}
