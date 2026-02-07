'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Video,
  Image,
  File,
  ExternalLink,
  Eye,
  Download,
  Calendar,
  Play,
  DollarSign
} from 'lucide-react'
import { CourseResource } from '@/types/api'
import { cn } from '@/lib/utils'

const FILE_TYPE_ICONS = {
  PDF: FileText,
  VIDEO: Video,
  SLIDE: Image,
  DOCUMENT: File,
  LINK: ExternalLink
}

interface ResourceCardProps {
  resource: CourseResource
  viewMode: 'grid' | 'list'
  onView: (resource: CourseResource) => void
  onDownload: (resource: CourseResource) => void
  formatDate: (dateString: string) => string
}

export function ResourceCard({
  resource,
  viewMode,
  onView,
  onDownload,
  formatDate
}: ResourceCardProps) {
  const FileIcon = FILE_TYPE_ICONS[resource.type] || FileText

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-border/50",
        viewMode === 'list' && "flex-row"
      )}
      onClick={() => onView(resource)}
    >
      <CardHeader className={cn(
        "pb-3 p-4 sm:p-6",
        viewMode === 'list' && "flex-1"
      )}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="p-2 bg-muted rounded-lg flex-shrink-0">
              <FileIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <CardTitle className="text-sm sm:text-base line-clamp-2 flex-1">
                  {resource.title}
                </CardTitle>
                {resource.isPaid && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {resource.price ? `$${resource.price}` : 'Paid'}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2 text-xs sm:text-sm">
                {resource.description || 'No description available'}
              </CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {resource.type}
                </Badge>
                {resource.downloadCount && (
                  <Badge variant="secondary" className="text-xs">
                    {resource.downloadCount} downloads
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] flex-shrink-0">
                <Eye className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                onView(resource)
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {resource.filePath && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onDownload(resource)
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className={cn(
        "p-4 sm:p-6 pt-0",
        viewMode === 'list' && "flex-1"
      )}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="truncate">{formatDate(resource.createdAt)}</span>
            </div>
            {resource.downloadCount && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Download className="h-3 w-3" />
                {resource.downloadCount}
              </div>
            )}
          </div>

          {resource.type === 'VIDEO' && resource.youtubeVideoId && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <Play className="h-3 w-3" />
              YouTube Video
            </div>
          )}

          {resource.type === 'LINK' && resource.externalUrl && (
            <div className="flex items-center gap-1 text-xs text-primary">
              <ExternalLink className="h-3 w-3" />
              External Link
            </div>
          )}
        </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onView(resource)
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View resource
            </Button>

            {resource.externalUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(resource.externalUrl as string, '_blank', 'noopener,noreferrer')
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open externalUrl
              </Button>
            )}
          </div>

      </CardContent>
    </Card>
  )
}
