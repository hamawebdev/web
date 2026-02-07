// @ts-nocheck
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PricingMode = 'YEAR' | 'MONTH';

interface PricingToggleProps {
  value: PricingMode;
  onChange: (mode: PricingMode) => void;
  className?: string;
}

export function PricingToggle({ value, onChange, className }: PricingToggleProps) {
  return (
    <div className={cn("flex items-center justify-center mb-12", className)}>
      <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50">
        <Button
          variant={value === 'YEAR' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('YEAR')}
          className={cn(
            "px-8 py-3 text-sm font-medium transition-all duration-200 rounded-md",
            value === 'YEAR'
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          )}
        >
          Yearly
        </Button>
        <Button
          variant={value === 'MONTH' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange('MONTH')}
          className={cn(
            "px-8 py-3 text-sm font-medium transition-all duration-200 rounded-md",
            value === 'MONTH'
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "text-muted-foreground hover:text-foreground hover:bg-background/80"
          )}
        >
          Monthly
        </Button>
      </div>
    </div>
  );
}
