'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LogoDisplay } from '@/components/ui/logo-display';
import { LoadingSpinner } from '@/components/loading-states';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Heart,
  Microscope,
  Stethoscope,
  Brain,
  Activity,
  Dna,
  Eye,
  Bone,
  Baby,
  Pill,
  GraduationCap,
  BookOpen,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiUnit {
  id: number;
  name: string;
  logoUrl?: string;
  modules?: ApiModule[];
}

interface ApiModule {
  id: number;
  name: string;
  logoUrl?: string;
  description?: string;
}

interface MedicalModulesGridProps {
  variant?: 'practice' | 'exam';
  units?: ApiUnit[];
  independentModules?: ApiModule[];
  onItemClick?: (item: { id: number; name: string; type: 'unite' | 'module'; isIndependent?: boolean; sessionCount?: number }) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

// Helper function to get icon and color for a module based on its name
const getModuleIconAndColor = (name: string) => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('anatomie')) return { icon: Bone, color: 'text-orange-500' };
  if (lowerName.includes('cardiologie') || lowerName.includes('cardio')) return { icon: Heart, color: 'text-red-500' };
  if (lowerName.includes('biochimie')) return { icon: Dna, color: 'text-green-500' };
  if (lowerName.includes('cytologie')) return { icon: Eye, color: 'text-purple-500' };
  if (lowerName.includes('dermatologie')) return { icon: Brain, color: 'text-yellow-600' };
  if (lowerName.includes('appareil') || lowerName.includes('locomoteur')) return { icon: Activity, color: 'text-blue-600' };
  if (lowerName.includes('patholog')) return { icon: Microscope, color: 'text-blue-500' };
  if (lowerName.includes('physiologie')) return { icon: Activity, color: 'text-green-600' };
  if (lowerName.includes('histologie')) return { icon: Eye, color: 'text-purple-600' };
  if (lowerName.includes('embryologie')) return { icon: Baby, color: 'text-pink-500' };
  if (lowerName.includes('pharmacologie') || lowerName.includes('pharmaco')) return { icon: Pill, color: 'text-orange-600' };

  // Default fallback
  return { icon: BookOpen, color: 'text-gray-500' };
};

export function MedicalModulesGrid({
  variant = 'practice',
  units = [],
  independentModules = [],
  onItemClick,
  loading = false,
  error = null,
  className
}: MedicalModulesGridProps) {

  // Convert API data to display items
  const allItems = React.useMemo(() => {
    const items: Array<{
      id: number;
      name: string;
      logoUrl?: string;
      type: 'unite' | 'module';
      isIndependent?: boolean;
      sessionCount: number;
    }> = [];

    // Add units
    units.forEach(unit => {
      items.push({
        id: unit.id,
        name: unit.name,
        logoUrl: unit.logoUrl,
        type: 'unite',
        sessionCount: 0 // Will be populated from session counts if available
      });
    });

    // Add independent modules
    independentModules.forEach(module => {
      items.push({
        id: module.id,
        name: module.name,
        logoUrl: module.logoUrl,
        type: 'module',
        isIndependent: true,
        sessionCount: 0 // Will be populated from session counts if available
      });
    });

    return items;
  }, [units, independentModules]);

  const handleClick = (item: typeof allItems[0]) => {
    console.log(`🎯 [MedicalModulesGrid] ${variant} item clicked:`, item);
    onItemClick?.(item);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("py-12", className)}>
        <EmptyState
          icon={BookOpen}
          title="Error Loading Content"
          description={error}
        />
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className={cn("py-12", className)}>
        <EmptyState
          icon={BookOpen}
          title="No Content Available"
          description="No units or modules found."
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Units Section */}
      {units && units.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">Units</h2>
            <span className="text-sm text-gray-500">{units.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-fr">
            {units.map((unit, index) => {
              const { icon: IconComponent, color } = getModuleIconAndColor(unit.name);
              return (
                <Card
                  key={`unit-${unit.id}`}
                  className="group cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 hover:scale-[1.05] hover:-translate-y-2 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-card hover:bg-gradient-to-br hover:from-card hover:to-blue-50/30 dark:hover:to-blue-900/20 h-full rounded-lg transform-gpu active:scale-[1.02] active:translate-y-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleClick({
                    id: unit.id,
                    name: unit.name,
                    logoUrl: unit.logoUrl,
                    type: 'unite',
                    sessionCount: 0
                  })}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between min-h-[160px]">
                    <div className="flex flex-col items-center space-y-3 flex-1 justify-center">
                      <div className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:animate-pulse">
                        <LogoDisplay
                          logoUrl={unit.logoUrl}
                          fallbackIcon={IconComponent}
                          alt={`${unit.name} logo`}
                          size="lg"
                          variant="rounded"
                          iconClassName={cn("w-12 h-12 transition-colors duration-300", color, "group-hover:brightness-110")}
                          className="bg-transparent border-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:border group-hover:border-blue-200 dark:group-hover:border-blue-700 transition-all duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3
                          className="font-medium text-sm leading-tight px-1 text-center transition-colors duration-300"
                          style={{ 
                            color: 'hsl(var(--accent-foreground))',
                            '--hover-color': 'hsl(var(--accent-foreground))'
                          } as React.CSSProperties}
                          title={unit.name}
                        >
                          {unit.name}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Independent Modules Section */}
      {independentModules && independentModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5" style={{ color: '#18686E' }} />
            <h2 className="text-lg font-semibold text-foreground">Independent Modules</h2>
            <span className="text-sm text-muted-foreground">{independentModules.length}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-fr">
            {independentModules.map((module, index) => {
              const { icon: IconComponent, color } = getModuleIconAndColor(module.name);
              return (
                <Card
                  key={`module-${module.id}`}
                  className="group cursor-pointer transition-all duration-300 ease-out hover:shadow-xl hover:shadow-[var(--gradient-left)]/20 hover:scale-[1.05] hover:-translate-y-2 border border-border hover:border-[var(--gradient-left)]/50 bg-card hover:bg-gradient-to-br hover:from-card hover:to-[var(--gradient-left)]/10 h-full rounded-lg transform-gpu active:scale-[1.02] active:translate-y-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => handleClick({
                    id: module.id,
                    name: module.name,
                    logoUrl: module.logoUrl,
                    type: 'module',
                    isIndependent: true,
                    sessionCount: 0
                  })}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center h-full justify-between min-h-[160px]">
                    <div className="flex flex-col items-center space-y-3 flex-1 justify-center">
                      <div className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6 group-hover:animate-pulse">
                        <LogoDisplay
                          logoUrl={module.logoUrl}
                          fallbackIcon={IconComponent}
                          alt={`${module.name} logo`}
                          size="lg"
                          variant="rounded"
                          iconClassName={cn("w-12 h-12 transition-colors duration-300", color, "group-hover:brightness-110")}
                          className="bg-transparent border-0 group-hover:bg-[var(--gradient-left)]/10 group-hover:border group-hover:border-[var(--gradient-left)]/30 transition-all duration-300"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <h3
                          className="font-medium text-sm leading-tight px-1 text-center transition-colors duration-300"
                          style={{ 
                            color: 'hsl(var(--accent-foreground))',
                            '--hover-color': 'hsl(var(--accent-foreground))'
                          } as React.CSSProperties}
                          title={module.name}
                        >
                          {module.name}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
