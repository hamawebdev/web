// @ts-nocheck
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Table, PieChart } from 'lucide-react';

export type ViewMode = 'table' | 'graphic';

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ViewToggle({
  value,
  onChange,
  disabled = false,
  className = '',
  size = 'md'
}: ViewToggleProps) {
  
  const sizeConfig = {
    sm: {
      buttonSize: 'h-8 px-3',
      iconSize: 'h-3 w-3',
      textSize: 'text-xs',
      gap: 'gap-1.5'
    },
    md: {
      buttonSize: 'h-9 px-4',
      iconSize: 'h-4 w-4',
      textSize: 'text-sm',
      gap: 'gap-2'
    },
    lg: {
      buttonSize: 'h-10 px-5',
      iconSize: 'h-5 w-5',
      textSize: 'text-base',
      gap: 'gap-2.5'
    }
  };

  const config = sizeConfig[size];

  const toggleOptions = [
    {
      value: 'table' as ViewMode,
      label: 'Tableau',
      icon: Table,
      description: 'Vue tableau détaillée'
    },
    {
      value: 'graphic' as ViewMode,
      label: 'Graphique',
      icon: PieChart,
      description: 'Vue graphique circulaire'
    }
  ];

  return (
    <div className={cn("flex items-center", className)}>
      {/* Toggle Button Group */}
      <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
        {toggleOptions.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          
          return (
            <Button
              key={option.value}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={cn(
                "relative transition-all duration-200",
                config.buttonSize,
                config.textSize,
                config.gap,
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={option.description}
            >
              <Icon className={cn(config.iconSize, "flex-shrink-0")} />
              <span className="hidden sm:inline">{option.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Active View Label (Mobile) */}
      <div className="sm:hidden ml-3">
        <span className={cn("font-medium text-foreground", config.textSize)}>
          {toggleOptions.find(opt => opt.value === value)?.label}
        </span>
      </div>
    </div>
  );
}

// Hook for managing view state with persistence
export function useViewToggle(defaultView: ViewMode = 'table') {
  const [viewMode, setViewMode] = React.useState<ViewMode>(defaultView);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load persisted view mode from localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const stored = localStorage.getItem('analytics-view-mode');
        if (stored && ['table', 'graphic'].includes(stored)) {
          setViewMode(stored as ViewMode);
        }
      } catch (error) {
        console.warn('Failed to read view mode from localStorage:', error);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Persist view mode to localStorage
  const updateViewMode = React.useCallback((newMode: ViewMode) => {
    setViewMode(newMode);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('analytics-view-mode', newMode);
      } catch (error) {
        console.warn('Failed to write view mode to localStorage:', error);
      }
    }
  }, []);

  return {
    viewMode,
    setViewMode: updateViewMode,
    isInitialized
  };
}
