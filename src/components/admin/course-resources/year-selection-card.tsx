/**
 * Year Selection Card Component
 * Displays study pack year information for selection
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ChevronRight } from 'lucide-react';
import { StudyPack } from '@/hooks/admin/use-admin-course-resources';

interface YearSelectionCardProps {
  studyPack: StudyPack;
  onClick: () => void;
}

const YEAR_LABELS: Record<string, string> = {
  'ONE': '1st Year',
  'TWO': '2nd Year',
  'THREE': '3rd Year',
  'FOUR': '4th Year',
  'FIVE': '5th Year',
  'SIX': '6th Year',
  'SEVEN': '7th Year'
};

const YEAR_NUMBERS: Record<string, string> = {
  'ONE': '1',
  'TWO': '2',
  'THREE': '3',
  'FOUR': '4',
  'FIVE': '5',
  'SIX': '6',
  'SEVEN': '7'
};

export function YearSelectionCard({ studyPack, onClick }: YearSelectionCardProps) {
  const yearLabel = studyPack.yearNumber ? YEAR_LABELS[studyPack.yearNumber] || `Year ${studyPack.yearNumber}` : 'Residency';
  
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <GraduationCap className="h-5 w-5 text-primary" />
          {yearLabel}
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
        </CardTitle>
        <CardDescription className="text-sm">
          {studyPack.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Badge variant="secondary" className="text-xs">
              {studyPack.type}
            </Badge>
            {studyPack.isActive && (
              <Badge variant="outline" className="text-xs">
                Active
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Click to view content
          </div>
        </div>
        {studyPack.description && (
          <div className="mt-2 text-xs text-muted-foreground">
            {studyPack.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
