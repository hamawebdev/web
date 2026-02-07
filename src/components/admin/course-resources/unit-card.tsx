/**
 * Admin Unit Card Component
 * Displays unit information with navigation to modules
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School, ChevronRight } from 'lucide-react';
import { Unit } from '@/hooks/admin/use-admin-course-resources';

interface UnitCardProps {
  unit: Unit;
  onClick: () => void;
}

export function UnitCard({ unit, onClick }: UnitCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <School className="h-5 w-5 text-primary" />
          {unit.name}
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
        </CardTitle>
        <CardDescription className="text-sm">
          {unit.studyPack.name} - Year {unit.studyPack.yearNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              Unit
            </Badge>
            <Badge variant="outline" className="text-xs">
              {unit.studyPack.type}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {unit.modules.length} module{unit.modules.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
