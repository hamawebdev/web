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
import { Search, X } from 'lucide-react';
import { ResidencyQuestionFilters } from '@/types/api';
import { AuthService } from '@/lib/api-services';
import { RESIDENCY_PARTS, normalizeResidencyPart } from '@/lib/residency-parts';

interface ResidencyQuestionsFiltersProps {
  filters: ResidencyQuestionFilters;
  onFiltersChange: (filters: Partial<ResidencyQuestionFilters>) => void;
  onClearFilters: () => void;
}

export function ResidencyQuestionsFilters({
  filters,
  onFiltersChange,
  onClearFilters,
}: ResidencyQuestionsFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [universities, setUniversities] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);

  // Load universities
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        setLoadingUniversities(true);
        const response = await AuthService.getUniversities();
        if (response.success && response.data) {
          setUniversities(response.data.universities || []);
        }
      } catch (error) {
        console.error('Error loading universities:', error);
      } finally {
        setLoadingUniversities(false);
      }
    };

    loadUniversities();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ search: localSearch.trim() || undefined });
  };

  const handlePartChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ part: undefined });
    } else {
      onFiltersChange({ part: value as any });
    }
  };

  const handleUniversityChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({ universityId: undefined });
    } else {
      onFiltersChange({ universityId: parseInt(value) });
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onFiltersChange({ search: undefined });
  };

  const hasActiveFilters = filters.search || filters.part || filters.universityId || filters.examYear;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search in question text or explanation..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {localSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Part Filter */}
      <div className="space-y-2">
        <Label htmlFor="part">Part</Label>
        <Select
          value={normalizeResidencyPart(filters.part) || 'all'}
          onValueChange={handlePartChange}
        >
          <SelectTrigger id="part">
            <SelectValue placeholder="All parts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Parts</SelectItem>
            {RESIDENCY_PARTS.map((part) => (
              <SelectItem key={part.value} value={part.value}>{part.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* University Filter */}
      <div className="space-y-2">
        <Label htmlFor="university">University</Label>
        <Select
          value={filters.universityId?.toString() || 'all'}
          onValueChange={handleUniversityChange}
          disabled={loadingUniversities}
        >
          <SelectTrigger id="university">
            <SelectValue placeholder="All universities" />
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

      {/* Exam Year Filter */}
      <div className="space-y-2">
        <Label htmlFor="examYear">Exam Year</Label>
        <Input
          id="examYear"
          type="number"
          placeholder="e.g., 2023"
          value={filters.examYear || ''}
          onChange={(e) => onFiltersChange({ examYear: e.target.value ? parseInt(e.target.value) : undefined })}
          min="2000"
          max="2100"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

