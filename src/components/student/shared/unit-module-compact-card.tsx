'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LogoDisplay } from '@/components/ui/logo-display';
import {
  Building2,
  BookOpen,
  GraduationCap,
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

interface UnitModuleCompactCardProps {
  item: UnitModuleItem;
  onClick: (item: UnitModuleItem) => void;
  variant?: 'practice' | 'exam';
  className?: string;
  showSessionCount?: boolean;
  isSelected?: boolean;
}

export function UnitModuleCompactCard({
  item,
  onClick,
  variant = 'practice',
  className,
  showSessionCount = true,
  isSelected = false
}: UnitModuleCompactCardProps) {
  const isUnit = item.type === 'unite';
  const isIndependentModule = item.type === 'module' && item.isIndependent;
  
  // Determine colors and icons based on type and variant
  const getCardStyles = () => {
    if (isUnit) {
      return {
        bgColor: variant === 'practice' ? 'bg-primary/5 hover:bg-primary/10' : 'bg-chart-2/5 hover:bg-chart-2/10',
        borderColor: variant === 'practice' ? 'border-primary/20 hover:border-primary/30' : 'border-chart-2/20 hover:border-chart-2/30',
        iconBgColor: variant === 'practice' ? 'bg-primary/10' : 'bg-chart-2/10',
        iconColor: variant === 'practice' ? 'text-primary' : 'text-chart-2',
        sessionCountColor: variant === 'practice' ? 'text-primary' : 'text-chart-2',
        icon: Building2
      };
    } else if (isIndependentModule) {
      return {
        bgColor: variant === 'practice' ? 'bg-[var(--gradient-left)]/5 hover:bg-[var(--gradient-left)]/10' : 'bg-chart-3/5 hover:bg-chart-3/10',
        borderColor: variant === 'practice' ? 'border-[var(--gradient-left)]/20 hover:border-[var(--gradient-left)]/30' : 'border-chart-3/20 hover:border-chart-3/30',
        iconBgColor: variant === 'practice' ? 'bg-chart-1/10' : 'bg-chart-3/10',
        iconColor: variant === 'practice' ? 'text-chart-1' : 'text-chart-3',
        sessionCountColor: variant === 'practice' ? 'text-chart-1' : 'text-chart-3',
        icon: GraduationCap
      };
    } else {
      return {
        bgColor: variant === 'practice' ? 'bg-accent/5 hover:bg-accent/10' : 'bg-chart-4/5 hover:bg-chart-4/10',
        borderColor: variant === 'practice' ? 'border-accent/20 hover:border-accent/30' : 'border-chart-4/20 hover:border-chart-4/30',
        iconBgColor: variant === 'practice' ? 'bg-accent/10' : 'bg-chart-4/10',
        iconColor: variant === 'practice' ? 'text-accent-foreground' : 'text-chart-4',
        sessionCountColor: variant === 'practice' ? 'text-accent-foreground' : 'text-chart-4',
        icon: BookOpen
      };
    }
  };

  const styles = getCardStyles();
  const IconComponent = styles.icon;



  const handleClick = () => {
    console.log(`🎯 [UnitModuleCompactCard] ${variant} card clicked:`, {
      item,
      type: item.type,
      id: item.id,
      name: item.name,
      isIndependent: item.isIndependent,
      sessionCount: item.sessionCount,
      logoUrl: item.logoUrl, // Debug logo URL
      variant,
      timestamp: new Date().toISOString()
    });

    onClick(item);
  };

  // Truncate title if too long
  const truncatedTitle = item.name.length > 25 ? `${item.name.substring(0, 22)}...` : item.name;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.05] hover:-translate-y-1 border-2 h-full",
        styles.bgColor,
        styles.borderColor,
        isSelected && "ring-2 ring-primary ring-offset-2 shadow-lg scale-[1.02]",
        className
      )}
      onClick={handleClick}
    >
      <CardContent className="px-3 py-2 flex flex-col items-center text-center h-full justify-between min-h-[140px]">
        {/* Icon/Logo Section */}
        <div className="flex flex-col items-center space-y-1 flex-1 justify-center">
          <LogoDisplay
            logoUrl={item.logoUrl}
            fallbackIcon={IconComponent}
            alt={`${item.name} logo`}
            size="lg"
            variant="rounded"
            iconClassName={cn(styles.iconColor, "h-10 w-10 transition-all duration-300 hover:scale-110 hover:rotate-3")}
          />

          {/* Title Section */}
          <div className="flex-1 flex flex-col justify-center">
            <h3 
              className="font-semibold text-sm leading-tight text-foreground px-1"
              title={item.name} // Show full name on hover
            >
              {truncatedTitle}
            </h3>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
