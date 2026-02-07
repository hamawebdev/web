/**
 * Admin Course Card Component
 * Displays course information with navigation to resource creation
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  ChevronRight,
  PlusCircle,
  FileText,
  Video,
  Headphones,
  Star
} from 'lucide-react'
import { Course } from '@/hooks/admin/use-admin-course-resources'

interface CourseCardProps {
  course: Course;
  onClick: () => void;
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  // Mock counts for UI demonstration - in real app would come from API
  const hasResources = false

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30 group relative overflow-hidden"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="line-clamp-1">{course.name}</span>
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 min-h-[2.5em]">
          {course.description || 'No description available'}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
          <div className="flex gap-1.5">
            {/* Resource Type Indicators */}
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              <FileText className="h-3 w-3" />
            </Badge>
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full border-blue-200 bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
              <Video className="h-3 w-3" />
            </Badge>
            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full border-amber-200 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              <Star className="h-3 w-3" />
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Manage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
