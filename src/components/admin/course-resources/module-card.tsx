/**
 * Admin Module Card Component
 * Displays module information with navigation to courses
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, ChevronRight } from 'lucide-react';
import { Module } from '@/hooks/admin/use-admin-course-resources';

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
  isIndependent?: boolean;
}

export function ModuleCard({ module, onClick, isIndependent = false }: ModuleCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5 text-primary" />
          {module.name}
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
        </CardTitle>
        <CardDescription className="text-sm">
          {isIndependent ? 'Independent Module' : 'Module'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              Module
            </Badge>
            {isIndependent && (
              <Badge variant="outline" className="text-xs">
                Independent
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {module.courses.length} course{module.courses.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
