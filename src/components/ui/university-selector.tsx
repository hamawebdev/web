import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, University as UniversityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversitySelectionState, validateUniversitySelection } from '@/hooks/use-university-selection';

interface UniversitySelectorProps {
  universitySelection: UniversitySelectionState;
  allowMultiple?: boolean;
  required?: boolean;
  loading?: boolean;
  className?: string;
  label?: string;
  sessionType?: 'PRACTICE' | 'EXAM';
}

export function UniversitySelector({
  universitySelection,
  allowMultiple = false,
  required = true,
  loading = false,
  className,
  label = 'Universities',
  sessionType
}: UniversitySelectorProps) {
  const {
    availableUniversities,
    selectedUniversityIds,
    showDropdown,
    autoSelectedUniversity,
    errorMessage,
    selectUniversity,
    selectMultipleUniversities,
    isValid,
    getValidationError
  } = universitySelection;

  // Show error state if no universities available
  if (errorMessage) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="flex items-center gap-1">
          <UniversityIcon className="h-4 w-4" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Hide university UI when auto-selected (single university case)
  if (autoSelectedUniversity && !showDropdown) {
    return null;
  }

  // Show dropdown for multiple universities
  if (showDropdown) {
    const validationError = getValidationError();

    if (allowMultiple) {
      return (
        <div className={cn("space-y-2", className)}>
          <Label className="flex items-center gap-1">
            <UniversityIcon className="h-4 w-4" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <MultiSelect
            options={availableUniversities.map(u => ({
              value: String(u.id),
              label: u.country ? `${u.name} (${u.country})` : u.name
            }))}
            value={selectedUniversityIds.map(String)}
            onChange={(values) => selectMultipleUniversities(values.map(Number))}
            placeholder={
              loading
                ? "Loading universities..."
                : required
                  ? "Select one or more universities"
                  : "Select universities (optional)"
            }
            disabled={loading}
            className={cn(validationError && "border-red-500")}
          />
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
        </div>
      );
    } else {
      return (
        <div className={cn("space-y-2", className)}>
          <Label className="flex items-center gap-1">
            <UniversityIcon className="h-4 w-4" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
          <Select
            value={selectedUniversityIds.length > 0 ? String(selectedUniversityIds[0]) : ''}
            onValueChange={(value) => value && selectUniversity(Number(value))}
            disabled={loading}
          >
            <SelectTrigger className={cn(validationError && "border-red-500")}>
              <SelectValue
                placeholder={
                  loading
                    ? "Loading universities..."
                    : required
                      ? "Select a university"
                      : "Select a university (optional)"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {!required && (
                <SelectItem value="">No selection</SelectItem>
              )}
              {availableUniversities.map((university) => (
                <SelectItem key={university.id} value={String(university.id)}>
                  <div className="flex flex-col">
                    <span>{university.name}</span>
                    {university.country && (
                      <span className="text-xs text-muted-foreground">
                        {university.country}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationError && (
            <p className="text-sm text-red-500">{validationError}</p>
          )}
        </div>
      );
    }
  }

  return null;
}
