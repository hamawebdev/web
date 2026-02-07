'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BookOpen,
  CheckCircle,
  Video,
  Star,
  Headphones,
  FileArchive
} from 'lucide-react'

interface CourseCardProps {
  course: {
    id: number
    name: string
    description?: string
    statistics?: {
      questionsCount: number
      quizzesCount: number
    }
  }
  onClick?: () => void
  onOfficialCourse?: () => void
  onVideoCourse?: () => void
  onSummaryCourse?: () => void
  // New handlers for additional resource types
  onAudioResource?: () => void
  onOtherResource?: () => void
}

// Resource type configuration with icons, labels, and colors
const RESOURCE_TYPE_CONFIG = {
  OFFICIAL_SUPPORT: {
    icon: CheckCircle,
    label: 'Official Support',
    className: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100 border-emerald-500/30'
  },
  CHOICE_OF_TEAM: {
    icon: Star,
    label: 'Team Choice',
    className: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border-amber-500/30'
  },
  VIDEO: {
    icon: Video,
    label: 'Video',
    className: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border-blue-500/30'
  },
  AUDIO: {
    icon: Headphones,
    label: 'Audio',
    className: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border-purple-500/30'
  },
  OTHER: {
    icon: FileArchive,
    label: 'Other Resources',
    className: 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-100 border-gray-500/30'
  }
}

export function CourseCard({
  course,
  onClick,
  onOfficialCourse,
  onVideoCourse,
  onSummaryCourse,
  onAudioResource,
  onOtherResource
}: CourseCardProps) {
  const handleButtonClick = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation() // Prevent card click when button is clicked
    if (action) {
      action()
    }
  }

  return (
    <Card
      className="text-card-foreground flex flex-col rounded-xl border p-4 sm:p-6 gap-4 sm:gap-6 shadow-sm hover:shadow-primary/5 duration-300 ease-out hover:-translate-y-1 relative overflow-hidden group bg-primary transition-all hover:shadow-md border-border/50 hover:border-primary/30"
      onClick={onClick}
    >
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base text-primary-foreground">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
          {course.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-2">
        {/* Official Support - Green/Verified */}
        <Button
          variant="outline"
          className={`w-full justify-start gap-2 ${RESOURCE_TYPE_CONFIG.OFFICIAL_SUPPORT.className}`}
          onClick={(e) => handleButtonClick(e, onOfficialCourse)}
        >
          <CheckCircle className="h-4 w-4" />
          {RESOURCE_TYPE_CONFIG.OFFICIAL_SUPPORT.label}
        </Button>

        {/* Video - Blue */}
        <Button
          variant="outline"
          className={`w-full justify-start gap-2 ${RESOURCE_TYPE_CONFIG.VIDEO.className}`}
          onClick={(e) => handleButtonClick(e, onVideoCourse)}
        >
          <Video className="h-4 w-4" />
          {RESOURCE_TYPE_CONFIG.VIDEO.label}
        </Button>

        {/* Team Choice - Amber/Star */}
        <Button
          variant="outline"
          className={`w-full justify-start gap-2 ${RESOURCE_TYPE_CONFIG.CHOICE_OF_TEAM.className}`}
          onClick={(e) => handleButtonClick(e, onSummaryCourse)}
        >
          <Star className="h-4 w-4" />
          {RESOURCE_TYPE_CONFIG.CHOICE_OF_TEAM.label}
        </Button>
      </CardContent>
    </Card>
  )
}

// Export resource type config for use in other components
export { RESOURCE_TYPE_CONFIG }

