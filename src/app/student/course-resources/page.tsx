'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Download, BookOpen, ExternalLink, DollarSign, ChevronRight, ArrowLeft, Home, GraduationCap, Users, Layers } from 'lucide-react'
import { FolderOpen } from '@solar-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/loading-states'
import { useStudentAuth } from '@/hooks/use-auth'
import { useContentFilters } from '@/hooks/use-content-filters'
import { NewApiService } from '@/lib/api/new-api-services'
import { ContentService } from '@/lib/api-services'
import { CourseResource } from '@/types/api'
import { UnitModuleGrid } from '@/components/student/shared/unit-module-grid'
import { UnitModuleItem } from '@/components/student/shared/unit-module-compact-card'
import { CourseCard } from '@/components/student/course-resources/course-card'
import { BreadcrumbNavigation } from '@/components/student/course-resources/breadcrumb-navigation'
import { LoadingState } from '@/components/student/course-resources/loading-state'
import { ErrorState } from '@/components/student/course-resources/error-state'
import { ModuleBooksSection } from '@/components/student/course-resources/module-books-section'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useYearLevel } from '@/hooks/use-year-level'
import { YearLevelSelector } from '@/components/student/shared/year-level-selector'

// Navigation types
type NavigationLevel = 'units' | 'modules' | 'courses'

interface NavigationState {
  level: NavigationLevel
  selectedUnit?: { id: number; name: string }
  selectedModule?: { id: number; name: string; isIndependent?: boolean }
}

interface BreadcrumbItem {
  label: string
  level: NavigationLevel
  onClick: () => void
}

// Course and resource types
interface Course {
  id: number
  name: string
  description?: string
  moduleId?: number
  moduleName?: string
  statistics?: {
    questionsCount: number
    quizzesCount: number
  }
}



export default function CourseResourcesPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useStudentAuth()

  // Detect year level from subscription
  // Only apply filtering for SEVEN (Résidanat) students
  const {
    yearLevel: detectedYearLevel,
    effectiveYearLevel,
    shouldApplyFilter,
    loading: yearLevelLoading
  } = useYearLevel()

  const [selectedYearLevel, setSelectedYearLevel] = useState<string | null>(null)

  // Use selected year level if set, otherwise use effective year level (only SEVEN)
  const activeYearLevel = selectedYearLevel || effectiveYearLevel

  const { filters, loading: filtersLoading, error: filtersError, refetch } = useContentFilters({
    yearLevel: activeYearLevel
  })

  // Navigation state
  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'units'
  })

  // Data states
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI states
  const [courseSearchQuery, setCourseSearchQuery] = useState('')

  // Resource dialog states
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [selectedResources, setSelectedResources] = useState<CourseResource[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [currentResourceType, setCurrentResourceType] = useState<'OFFICIAL_SUPPORT' | 'VIDEO' | 'CHOICE_OF_TEAM' | 'AUDIO' | 'OTHER' | null>(null)

  // Navigation functions
  const navigateToModules = (unit: { id: number; name: string }) => {
    setNavigation({
      level: 'modules',
      selectedUnit: unit
    })
    setCourses([])
    setError(null)
  }

  const navigateToCoursesFromModule = (module: { id: number; name: string; isIndependent?: boolean }) => {
    setNavigation(prev => ({
      level: 'courses',
      selectedUnit: prev.selectedUnit,
      selectedModule: module
    }))
    setError(null)
    fetchCourses(module.id, module.isIndependent)
  }

  // Handle unit/module selection using UnitModuleGrid
  const handleUnitModuleSelection = (item: UnitModuleItem) => {
    if (item.type === 'unite') {
      navigateToModules({ id: item.id, name: item.name })
    } else if (item.type === 'module') {
      navigateToCoursesFromModule({
        id: item.id,
        name: item.name,
        isIndependent: item.isIndependent
      })
    }
  }

  const navigateBack = () => {
    switch (navigation.level) {
      case 'modules':
        setNavigation({ level: 'units' })
        break
      case 'courses':
        // If the current module is independent, go directly back to units
        // Otherwise, go back to modules level
        if (navigation.selectedModule?.isIndependent) {
          setNavigation({ level: 'units' })
        } else {
          setNavigation(prev => ({
            level: 'modules',
            selectedUnit: prev.selectedUnit
          }))
        }
        setCourses([])
        break
    }
    setError(null)
  }

  // Data fetching functions
  const fetchCourses = useCallback(async (moduleId: number, isIndependent?: boolean) => {
    try {
      setLoading(true)
      setError(null)

      // For independent modules, courses come from the content filters structure
      if (isIndependent) {
        // Try to read from already-fetched filters first
        let coursesFromFilters = filters?.independentModules?.find(m => m.id === moduleId)?.courses

        // If not present, refetch content filters and extract
        if (!coursesFromFilters) {
          const cfResp = await NewApiService.getContentFilters()
          if (cfResp.success && cfResp.data) {
            coursesFromFilters = cfResp.data.independentModules?.find(m => m.id === moduleId)?.courses
          }
        }

        setCourses(Array.isArray(coursesFromFilters) ? coursesFromFilters : [])
        return
      }

      // For child modules (modules within units), extract courses from content filters
      // Find the module in the current unit's modules
      let coursesFromFilters: any[] = []

      if (navigation.selectedUnit) {
        const unit = filters?.unites?.find(u => u.id === navigation.selectedUnit?.id)
        const selectedModule = unit?.modules?.find(m => m.id === moduleId)
        coursesFromFilters = selectedModule?.courses || []
      }

      // If we found courses in the filters, use them
      if (coursesFromFilters.length > 0) {
        setCourses(coursesFromFilters)
        return
      }

      // Fallback: try API call for unit-bound modules (in case courses are not in filters)
      const response = await NewApiService.getStudentCourses({ moduleId })

      if (response.success && response.data) {
        const coursesData = (response.data as any).courses || response.data
        setCourses(Array.isArray(coursesData) ? coursesData : [])
      } else {
        throw new Error(response.error || 'Failed to fetch courses')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters, navigation.selectedUnit])

  const fetchCourseResourcesByType = async (courseId: number, type: 'OFFICIAL_SUPPORT' | 'VIDEO' | 'CHOICE_OF_TEAM' | 'AUDIO' | 'OTHER') => {
    try {
      setLoadingResources(true)

      const response = await ContentService.getCourseResources(courseId, {
        page: 1,
        limit: 100,
        type
      })

      if (response.success && response.data) {
        const d: any = response.data
        const inner = d?.data?.data ?? d?.data ?? d
        const resources = Array.isArray(inner?.resources) ? inner.resources : Array.isArray(inner) ? inner : []
        // Filter by type on client side as well to ensure only matching resources are shown
        const filteredResources = Array.isArray(resources) ? resources.filter((r: CourseResource) => r.type === type) : []
        return filteredResources
      } else {
        const errorMessage = typeof response.error === 'string' ? response.error : 'Failed to fetch course resources'
        throw new Error(errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course resources'
      toast.error(errorMessage)
      return []
    } finally {
      setLoadingResources(false)
    }
  }

  const navigateToLevel = useCallback((level: NavigationLevel) => {
    if (level === 'units') {
      setNavigation({ level: 'units' })
      setCourses([])
    } else if (level === 'modules' && navigation.selectedUnit) {
      setNavigation({
        level: 'modules',
        selectedUnit: navigation.selectedUnit
      })
      setCourses([])
    } else if (level === 'courses' && navigation.selectedModule) {
      setNavigation(prev => ({
        level: 'courses',
        selectedUnit: prev.selectedUnit,
        selectedModule: prev.selectedModule
      }))
    }
    setError(null)
  }, [navigation.selectedUnit, navigation.selectedModule])

  // Handle course fetching when navigating to courses level
  useEffect(() => {
    if (navigation.level === 'courses' && navigation.selectedModule) {
      fetchCourses(navigation.selectedModule.id, navigation.selectedModule.isIndependent)
    }
  }, [navigation.level, navigation.selectedModule, fetchCourses])

  // Generate breadcrumbs - moved after navigateToLevel definition
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        label: 'Course Resources',
        level: 'units',
        onClick: () => navigateToLevel('units')
      }
    ]

    // For independent modules, skip the unit breadcrumb and go directly to module
    if (navigation.selectedModule?.isIndependent) {
      items.push({
        label: navigation.selectedModule.name,
        level: 'courses',
        onClick: () => navigateToLevel('courses')
      })
    } else {
      // For regular modules, show unit first, then module
      if (navigation.selectedUnit) {
        items.push({
          label: navigation.selectedUnit.name,
          level: 'modules',
          onClick: () => navigateToLevel('modules')
        })
      }

      if (navigation.selectedModule) {
        items.push({
          label: navigation.selectedModule.name,
          level: 'courses',
          onClick: () => navigateToLevel('courses')
        })
      }
    }

    return items
  }, [navigation, navigateToLevel])

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!courses) return []

    return courses
      .filter(course => {
        if (courseSearchQuery && !course.name.toLowerCase().includes(courseSearchQuery.toLowerCase()) &&
          !course.description?.toLowerCase().includes(courseSearchQuery.toLowerCase())) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [courses, courseSearchQuery])

  const handleOfficialCourse = async (course: Course) => {
    const resources = await fetchCourseResourcesByType(course.id, 'OFFICIAL_SUPPORT')
    if (resources.length === 0) {
      toast.info('No official course resources available')
      return
    }
    setSelectedResources(resources)
    setCurrentResourceType('OFFICIAL_SUPPORT')
    setResourceDialogOpen(true)
  }

  const handleVideoCourse = async (course: Course) => {
    const resources = await fetchCourseResourcesByType(course.id, 'VIDEO')
    if (resources.length === 0) {
      toast.info('No video course resources available')
      return
    }
    setSelectedResources(resources)
    setCurrentResourceType('VIDEO')
    setVideoDialogOpen(true)
  }

  const handleSummaryCourse = async (course: Course) => {
    const resources = await fetchCourseResourcesByType(course.id, 'CHOICE_OF_TEAM')
    if (resources.length === 0) {
      toast.info('No summary course resources available')
      return
    }
    setSelectedResources(resources)
    setCurrentResourceType('CHOICE_OF_TEAM')
    setResourceDialogOpen(true)
  }

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

  // Handle authentication redirect - moved after all hooks
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-heading-primary">
              Course Resources
            </h2>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation
        items={breadcrumbs.map((item, index) => ({
          label: item.label,
          onClick: item.onClick,
          isActive: index === breadcrumbs.length - 1
        }))}
      />

      {/* Back Button */}
      {navigation.level !== 'units' && (
        <Button
          variant="outline"
          onClick={navigateBack}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <Separator />

      {/* Main Content */}
      {filtersLoading ? (
        <LoadingState message="Loading content..." />
      ) : filtersError ? (
        <ErrorState
          message={filtersError}
          onRetry={refetch}
        />
      ) : (
        <>
          {/* Units Level */}
          {navigation.level === 'units' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Select a Unit or Module</h3>
              </div>

              {/* Year Level Selection - Only show for SEVEN (Résidanat) students */}
              {shouldApplyFilter && (
                <YearLevelSelector
                  value={selectedYearLevel as any}
                  onChange={(yearLevel) => setSelectedYearLevel(yearLevel)}
                  loading={yearLevelLoading}
                  showAllOption={false}
                  placeholder={
                    yearLevelLoading
                      ? "Chargement..."
                      : "Select year"
                  }
                />
              )}

              {/* Use UnitModuleGrid for consistent layout */}
              <UnitModuleGrid
                units={filters?.unites}
                independentModules={filters?.independentModules}
                onItemClick={handleUnitModuleSelection}
                variant="practice"
                layout="compact"
                loading={false}
                error={null}
                showSessionCounts={false}
                selectedItem={null}
              />
            </div>
          )}
          {/* Modules Level */}
          {navigation.level === 'modules' && navigation.selectedUnit && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Modules in {navigation.selectedUnit.name}</h3>
              </div>

              {/* Display child modules from the selected unit */}
              {(() => {
                const selectedUnit = filters?.unites?.find(u => u.id === navigation.selectedUnit?.id)
                const childModules = selectedUnit?.modules || []

                if (childModules.length === 0) {
                  return (
                    <EmptyState
                      icon={Layers}
                      title="No Modules Available"
                      description="No modules are available in this unit."
                    />
                  )
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {childModules.map((module) => (
                      <Card
                        key={module.id}
                        className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-primary/30"
                        onClick={() => navigateToCoursesFromModule({
                          id: module.id,
                          name: module.name,
                          isIndependent: false // Child modules are not independent
                        })}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <BookOpen className="h-4 w-4 text-primary" />
                            {module.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {module.description || 'Module description'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-xs">
                              Module
                            </Badge>
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Courses Level */}
          {navigation.level === 'courses' && navigation.selectedModule && (
            <div className="space-y-6">
              {/* Module Books Section */}
              <ModuleBooksSection
                moduleId={navigation.selectedModule.id}
                moduleName={navigation.selectedModule.name}
              />

              <Separator />

              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Courses in {navigation.selectedModule.name}</h3>
              </div>

              {/* Course Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <LoadingState message="Loading courses..." />
              ) : error ? (
                <ErrorState
                  message={error}
                  onRetry={() => fetchCourses(navigation.selectedModule!.id, navigation.selectedModule!.isIndependent)}
                />
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOfficialCourse={() => handleOfficialCourse(course)}
                      onVideoCourse={() => handleVideoCourse(course)}
                      onSummaryCourse={() => handleSummaryCourse(course)}
                    />
                  ))}
                </div>
              ) : courseSearchQuery ? (
                <EmptyState
                  icon={Search}
                  title="No Courses Found"
                  description={`No courses match "${courseSearchQuery}". Try adjusting your search terms.`}
                />
              ) : (
                <EmptyState
                  icon={BookOpen}
                  title="No Courses Available"
                  description="No courses are available in this module."
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Unified Resource Dialog */}
      <Dialog open={resourceDialogOpen || videoDialogOpen} onOpenChange={(open) => {
        setResourceDialogOpen(open)
        setVideoDialogOpen(open)
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentResourceType === 'OFFICIAL_SUPPORT' && 'Official Course Resources'}
              {currentResourceType === 'VIDEO' && 'Video Course Resources'}
              {currentResourceType === 'CHOICE_OF_TEAM' && 'Summary Course Resources'}
            </DialogTitle>
            <DialogDescription>
              {loadingResources ? 'Loading resources...' : `${selectedResources.length} resource(s) available`}
            </DialogDescription>
          </DialogHeader>

          {loadingResources ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedResources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No resources available
            </div>
          ) : (
            <div className="space-y-3">
              {selectedResources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base truncate">{resource.title}</h4>
                        {resource.description && (
                          <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                        )}
                      </div>
                      {resource.isPaid && (
                        <Badge variant="outline" className="flex-shrink-0">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {resource.price ? `$${resource.price}` : 'Paid'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {resource.externalUrl && (
                        <Button
                          onClick={() => handleOpenLink(resource.externalUrl!)}
                          variant="default"
                          size="sm"
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Link
                        </Button>
                      )}
                      {resource.filePath && (
                        <Button
                          onClick={() => handleDownloadResource(resource)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download Resource
                        </Button>
                      )}
                      {!resource.externalUrl && !resource.filePath && (
                        <p className="text-sm text-muted-foreground">No resource link available</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
