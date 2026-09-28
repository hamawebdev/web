'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type YearLevel = 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | 'SIX' | 'SEVEN';

interface YearLevelSelectorProps {
  value: YearLevel | null;
  onChange: (yearLevel: YearLevel | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  // Optional class names applied to the SelectTrigger to control width/size
  triggerClassName?: string;
  // Optional class names applied to the label element
  labelClassName?: string;
  showAllOption?: boolean;
  required?: boolean;
  /** data-testid of the trigger */
  testId?: string;
  // Years to offer, in study order (default: every year)
  years?: readonly YearLevel[];
}

const YEAR_LEVELS: { value: YearLevel; label: string }[] = [
  { value: 'ONE', label: 'Première Année' },
  { value: 'TWO', label: 'Deuxième Année' },
  { value: 'THREE', label: 'Troisième Année' },
  { value: 'FOUR', label: 'Quatrième Année' },
  { value: 'FIVE', label: 'Cinquième Année' },
  { value: 'SIX', label: 'Sixième Année' },
  // The Résidanat pack's own modules (there is no 7th study year)
  { value: 'SEVEN', label: 'Résidanat' }
];

export function YearLevelSelector({
  value,
  onChange,
  label = 'Année',
  placeholder = 'Select year',
  disabled = false,
  loading = false,
  className,
  triggerClassName,
  labelClassName,
  showAllOption = true,
  required = false,
  testId,
  years
}: YearLevelSelectorProps) {
  const options = years ? YEAR_LEVELS.filter((year) => years.includes(year.value)) : YEAR_LEVELS;

  const handleValueChange = (newValue: string) => {
    if (newValue === 'all') {
      onChange(null);
    } else {
      onChange(newValue as YearLevel);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label className={cn("flex items-center gap-2", labelClassName)}>
        <GraduationCap className="h-4 w-4" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={(value ?? (showAllOption ? 'all' : undefined)) as any}
        onValueChange={handleValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={triggerClassName} data-testid={testId}>
          <SelectValue placeholder={loading ? 'Chargement...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">Toutes les Années</SelectItem>
          )}
          {options.map((year) => (
            <SelectItem key={year.value} value={year.value}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

