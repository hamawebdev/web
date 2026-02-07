// @ts-nocheck
'use client';

import { Filter, BookOpen, GraduationCap, Stethoscope } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { SessionType } from '@/types/api';
import { cn } from '@/lib/utils';

interface SessionTypeFilterProps {
  value: SessionType;
  onChange: (value: SessionType) => void;
  className?: string;
  disabled?: boolean;
}

const SESSION_TYPE_OPTIONS = [
  {
    value: 'PRACTICE' as SessionType,
    label: 'Entraînement',
    description: 'Sessions de pratique',
    icon: BookOpen,
    color: 'text-blue-600'
  },
  {
    value: 'EXAM' as SessionType,
    label: 'Examen',
    description: 'Sessions d\'examen',
    icon: GraduationCap,
    color: 'text-green-600'
  },
  {
    value: 'RESIDENCY' as SessionType,
    label: 'Résidanat',
    description: 'Sessions de résidanat',
    icon: Stethoscope,
    color: 'text-purple-600'
  }
];

export function SessionTypeFilter({ 
  value, 
  onChange, 
  className,
  disabled = false 
}: SessionTypeFilterProps) {
  const selectedOption = SESSION_TYPE_OPTIONS.find(option => option.value === value);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="session-type-filter" className="text-sm font-medium text-foreground flex items-center gap-2">
        <Filter className="h-4 w-4" />
        Type Session
      </Label>
      
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger 
          id="session-type-filter"
          className="w-full sm:w-[200px] bg-background border-border/50 hover:border-border transition-colors"
        >
          <SelectValue>
            {selectedOption && (
              <div className="flex items-center gap-2">
                <selectedOption.icon className={cn("h-4 w-4", selectedOption.color)} />
                <span className="font-medium">{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        
        <SelectContent className="bg-background border-border/50 shadow-lg">
          {SESSION_TYPE_OPTIONS.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              className="cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
            >
              <div className="flex items-center gap-3 py-1">
                <option.icon className={cn("h-4 w-4", option.color)} />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Export the options for use in other components if needed
export { SESSION_TYPE_OPTIONS };
