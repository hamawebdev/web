'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  School,
  Calendar,
  BookOpen,
  Layers,
  GraduationCap,
  Home
} from 'lucide-react';
import { HierarchyBreadcrumbsProps, SelectionState } from '@/types/question-import';

export function HierarchyBreadcrumbs({ 
  selection, 
  onStepClick 
}: HierarchyBreadcrumbsProps) {
  const breadcrumbItems = [
    {
      key: 'start' as const,
      label: 'Start',
      icon: Home,
      value: null,
      active: !selection.university
    },
    {
      key: 'university' as keyof SelectionState,
      label: 'University',
      icon: School,
      value: selection.university?.name,
      active: !!selection.university && !selection.examYear
    },
    {
      key: 'examYear' as keyof SelectionState,
      label: 'Exam Year',
      icon: Calendar,
      value: selection.examYear?.toString(),
      active: !!selection.examYear && !selection.unit
    },
    {
      key: 'unit' as keyof SelectionState,
      label: 'Unit',
      icon: BookOpen,
      value: selection.unit?.name,
      active: !!selection.unit && !selection.module
    },
    {
      key: 'module' as keyof SelectionState,
      label: 'Module',
      icon: Layers,
      value: selection.module?.name,
      active: !!selection.module && !selection.course
    },
    {
      key: 'course' as keyof SelectionState,
      label: 'Course',
      icon: GraduationCap,
      value: selection.course?.name,
      active: !!selection.course
    }
  ];

  // Filter to show only relevant breadcrumbs
  const visibleItems = breadcrumbItems.filter((item, index) => {
    if (item.key === 'start') return true;
    
    // Show current step and all completed steps
    const prevItem = breadcrumbItems[index - 1];
    if (item.key === 'university') return true;
    if (item.key === 'examYear') return !!selection.university;
    if (item.key === 'unit') return !!selection.examYear;
    if (item.key === 'module') return !!selection.unit;
    if (item.key === 'course') return !!selection.module;
    
    return false;
  });

  const handleStepClick = (key: keyof SelectionState | 'start') => {
    if (key === 'start') {
      // Reset all selections
      onStepClick('university');
      return;
    }
    onStepClick(key);
  };

  return (
    <div className="flex items-center space-x-1 overflow-x-auto pb-2">
      {visibleItems.map((item, index) => (
        <div key={item.key} className="flex items-center space-x-1 flex-shrink-0">
          <Button
            variant={item.active ? "default" : item.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleStepClick(item.key)}
            className="flex items-center space-x-2 min-w-0"
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {item.value || item.label}
            </span>
            {item.active && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Current
              </Badge>
            )}
          </Button>
          
          {index < visibleItems.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
