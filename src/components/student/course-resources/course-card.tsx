'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookOpen,
  CheckCircle,
  Video,
  Star,
  Headphones,
  FileText,
  Download,
  ExternalLink,
  DollarSign,
  File
} from 'lucide-react'
import { ContentService } from '@/lib/api-services'
import { CourseResource } from '@/types/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/loading-states'

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
}

// Resource type configuration with icons and labels
const RESOURCE_TYPES = [
  { id: 'VIDEO', label: 'Vidéos', icon: Video },
  { id: 'AUDIO', label: 'Audio', icon: Headphones },
  { id: 'CHOICE_OF_TEAM', label: "Choix de l'équipe", icon: Star },
  { id: 'OFFICIAL_SUPPORT', label: 'Support Officiel', icon: FileText },
  { id: 'OTHER', label: 'Autres résumés', icon: File },
] as const

type ResourceType = typeof RESOURCE_TYPES[number]['id']

export function CourseCard({ course }: CourseCardProps) {
  const [activeTab, setActiveTab] = useState<ResourceType>('VIDEO')
  const [resources, setResources] = useState<Record<ResourceType, CourseResource[]>>({
    VIDEO: [],
    AUDIO: [],
    CHOICE_OF_TEAM: [],
    OFFICIAL_SUPPORT: [],
    OTHER: []
  })
  const [loading, setLoading] = useState<Record<ResourceType, boolean>>({
    VIDEO: false,
    AUDIO: false,
    CHOICE_OF_TEAM: false,
    OFFICIAL_SUPPORT: false,
    OTHER: false
  })
  const [fetched, setFetched] = useState<Record<ResourceType, boolean>>({
    VIDEO: false,
    AUDIO: false,
    CHOICE_OF_TEAM: false,
    OFFICIAL_SUPPORT: false,
    OTHER: false
  })

  const fetchResources = async (type: ResourceType) => {
    if (fetched[type]) return

    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const response = await ContentService.getCourseResources(course.id, {
        page: 1,
        limit: 100,
        type
      })

      if (response.success && response.data) {
        const d: any = response.data
        const inner = d?.data?.data ?? d?.data ?? d
        const fetchedResources = Array.isArray(inner?.resources) ? inner.resources : Array.isArray(inner) ? inner : []

        // Filter by type on client side as well to ensure correctness
        const filteredResources = Array.isArray(fetchedResources)
          ? fetchedResources.filter((r: CourseResource) => r.type === type)
          : []

        setResources(prev => ({ ...prev, [type]: filteredResources }))
        setFetched(prev => ({ ...prev, [type]: true }))
      }
    } catch (err) {
      console.error('Failed to fetch resources', err)
      toast.error('Failed to load resources')
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  // Fetch resources when tab changes
  useEffect(() => {
    fetchResources(activeTab)
  }, [activeTab, course.id])

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank')
  }

  const handleDownloadResource = (resource: CourseResource) => {
    if (resource.isPaid && !resource.price) {
      toast.error('This is a paid resource. Please purchase to access.')
      return
    }

    if (resource.filePath) {
      const link = document.createElement('a')
      link.href = resource.filePath
      link.download = resource.title
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download started')
    } else {
      toast.info('Download not available for this resource')
    }
  }

  const handleResourceClick = (resource: CourseResource) => {
    if (resource.externalUrl) {
      handleOpenLink(resource.externalUrl)
    } else if (resource.filePath) {
      handleDownloadResource(resource)
    } else {
      toast.info('No link available for this resource')
    }
  }

  return (
    <Card className="w-full bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          {course.name}
        </CardTitle>
        {course.description && (
          <p className="text-sm text-muted-foreground">{course.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="VIDEO" value={activeTab} onValueChange={(v) => setActiveTab(v as ResourceType)} className="w-full">
          <TabsList className="w-full justify-start h-auto bg-transparent p-0 border-b rounded-none mb-4 flex-wrap">
            {RESOURCE_TYPES.map((type) => (
              <TabsTrigger
                key={type.id}
                value={type.id}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2 hover:text-primary transition-colors gap-2"
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {RESOURCE_TYPES.map((type) => (
            <TabsContent key={type.id} value={type.id} className="mt-0">
              {loading[type.id] ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : resources[type.id].length > 0 ? (
                <div className="space-y-1">
                  {resources[type.id].map((resource, index) => (
                    <div
                      key={resource.id}
                      onClick={() => handleResourceClick(resource)}
                      className="group flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <span className="text-muted-foreground min-w-[1.5rem] pt-0.5 text-sm font-medium">
                        {index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {resource.title}
                          </span>
                          {resource.isPaid && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5 ml-2">
                              {resource.price ? `$${resource.price}` : 'Premium'}
                            </Badge>
                          )}
                        </div>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {resource.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucune ressource disponible pour cette catégorie.
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}


