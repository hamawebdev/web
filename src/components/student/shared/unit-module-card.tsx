'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogoDisplay } from '@/components/ui/logo-display';
import {
  Building2,
  BookOpen,
  Users,
  GraduationCap,
  ChevronRight,
  Play,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UnitModuleItem {
  id: number;
  name: string;
  description?: string;
  logoUrl?: string;
  type: 'unite' | 'module';
  isIndependent?: boolean;
  moduleCount?: number;
  sessionCount?: number;
}

interface UnitModuleCardProps {
  item: UnitModuleItem;
  onClick: (item: UnitModuleItem) => void;
  variant?: 'practice' | 'exam';
  className?: string;
  showSessionCount?: boolean;
  isSelected?: boolean;
}

export function UnitModuleCard({
  item,
  onClick,
  variant = 'practice',
  className,
  showSessionCount = true,
  isSelected = false
}: UnitModuleCardProps) {
  const isUnit = item.type === 'unite';
  const isIndependentModule = item.type === 'module' && item.isIndependent;
  
  // Determine colors and icons based on type and variant
  const getCardStyles = () => {
    if (isUnit) {
      return {
        borderColor: variant === 'practice' ? 'border-l-primary/30 hover:border-l-primary/50' : 'border-l-chart-2/30 hover:border-l-chart-2/50',
        bgColor: variant === 'practice' ? 'bg-primary/10' : 'bg-chart-2/10',
        iconColor: variant === 'practice' ? 'text-primary' : 'text-chart-2',
        icon: Building2
      };
    } else if (isIndependentModule) {
      return {
        borderColor: variant === 'practice' ? 'border-l-[var(--gradient-left)]/30 hover:border-l-[var(--gradient-left)]/50' : 'border-l-chart-3/30 hover:border-l-chart-3/50',
        bgColor: variant === 'practice' ? 'bg-chart-1/10' : 'bg-chart-3/10',
        iconColor: variant === 'practice' ? 'text-chart-1' : 'text-chart-3',
        icon: GraduationCap
      };
    } else {
      return {
        borderColor: variant === 'practice' ? 'border-l-primary-foreground/30 hover:border-l-primary-foreground/50' : 'border-l-chart-4/30 hover:border-l-chart-4/50',
        bgColor: variant === 'practice' ? 'bg-primary-foreground/10' : 'bg-chart-4/10',
        iconColor: variant === 'practice' ? 'text-primary-foreground' : 'text-chart-4',
        icon: BookOpen
      };
    }
  };

  const styles = getCardStyles();
  const IconComponent = styles.icon;

  const handleClick = () => {
    // Log the card click for debugging
    console.log(`🎯 [UnitModuleCard] ${variant} card clicked:`, {
      item,
      type: item.type,
      id: item.id,
      name: item.name,
      isIndependent: item.isIndependent,
      moduleCount: item.moduleCount,
      sessionCount: item.sessionCount,
      variant,
      timestamp: new Date().toISOString()
    });

    onClick(item);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 border-l-[4px] h-full",
        styles.borderColor,
        isSelected && "border-primary bg-primary/5 shadow-md",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 sm:p-6 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 flex-1">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <LogoDisplay
              logoUrl={item.logoUrl}
              fallbackIcon={IconComponent}
              alt={`${item.name} logo`}
              size="lg"
              variant="rounded"
              className={cn("p-2 sm:p-3 flex-shrink-0 mt-1", styles.bgColor)}
              iconClassName={styles.iconColor}
            />

            <div className="flex-1 min-w-0 space-y-2">
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight break-words">
                    {item.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs w-fit flex-shrink-0",
                      isUnit && "border-primary/30 text-primary",
                      isIndependentModule && "border-chart-1/30 text-chart-1",
                      !isUnit && !isIndependentModule && "border-primary-foreground/30 text-primary-foreground"
                    )}
                  >
                    {isUnit ? 'Unit' : isIndependentModule ? 'Independent Module' : 'Module'}
                  </Badge>
                </div>

              </div>

            </div>
          </div>

          <div className="flex items-center justify-end sm:justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
