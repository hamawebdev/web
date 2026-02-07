'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  School,
  Layers,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Plus,
  ChevronRight,
  GraduationCap,
  Trash2,
  FileText,
  Download,
  ExternalLink,
  Video,
  Image,
  File
} from 'lucide-react';
import { useAdminCourseResources } from '@/hooks/admin/use-admin-course-resources';
import { UnitCard } from '@/components/admin/course-resources/unit-card';
import { ModuleCard } from '@/components/admin/course-resources/module-card';
import { CourseCard } from '@/components/admin/course-resources/course-card';
import { YearSelectionCard } from '@/components/admin/course-resources/year-selection-card';
import { CreateResourceForm } from '@/components/admin/course-resources/create-resource-form';
import { BookManagementList } from '@/components/admin/course-resources/book-management-list';
import { AddBookModal } from '@/components/admin/course-resources/add-book-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSpinner } from '@/components/loading-states';

/**
 * Admin Course Resources Management Page
 *
 * Implements hierarchical navigation: Units → Modules → Courses → Resource Creation
 * Uses only the endpoints defined in COURSE_RESOURCES_ADMIN_API_DOCUMENTATION.md
 */
export default function AdminCourseResourcesPage() {
  try {

    const [resourceToDelete, setResourceToDelete] = useState<{ id: number, title: string } | null>(null);
    const [addBookModalOpen, setAddBookModalOpen] = useState(false);
    const [refreshBooksTrigger, setRefreshBooksTrigger] = useState(0);

    const {
      studyPacks,
      filters,
      navigation,
      courseResources,
      loading,
      creating,
      loadingResources,
      deletingResource,
      error,
      selectYear,
      navigateToUnits,
      navigateToModules,
      navigateToCourses,
      navigateToResources,
      navigateToCreateResource,
      navigateBack,
      createResource,
      deleteResource,
      refetch,
      hasError,
      hasData
    } = useAdminCourseResources();

    const handleDeleteResource = async () => {
      if (resourceToDelete) {
        const success = await deleteResource(resourceToDelete.id);
        if (success) {
          setResourceToDelete(null);
        }
      }
    };

    // Loading state
    if (loading) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Course Resources</h1>
          </div>
          <LoadingSpinner message={navigation.level === 'year-selection' ? "Loading study packs..." : "Loading course structure..."} />
        </div>
      );
    }

    // Error state
    if (hasError) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Course Resources</h1>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load course resources. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    // No data state
    if (!hasData) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Course Resources</h1>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
          <EmptyState
            icon={School}
            title={navigation.level === 'year-selection' ? "No Study Packs Available" : "No Course Structure Available"}
            description={navigation.level === 'year-selection' ? "No study packs are available for year selection." : "No units or modules are available for course resource management."}
          />
        </div>
      );
    }

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Course Resources</h1>
          <div className="flex gap-2">
            {navigation.level !== 'year-selection' && (
              <Button onClick={navigateBack} variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            {navigation.breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === navigation.breadcrumb.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => {
                        if (item.level === 'year-selection') {
                          // Reset to year selection
                          refetch();
                        } else if (item.level === 'units') {
                          navigateToUnits();
                        } else if (item.level === 'modules' && item.data) {
                          navigateToModules(item.data as any);
                        } else if (item.level === 'courses' && item.data) {
                          const module = item.data as any;
                          navigateToCourses(module, module.isIndependent);
                        } else if (item.level === 'resources' && item.data) {
                          navigateToResources(item.data as any);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Content based on navigation level */}
        {navigation.level === 'year-selection' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Select Year Level</h2>
            </div>

            {studyPacks && studyPacks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studyPacks
                  .filter(pack => pack.isActive)
                  .map((studyPack) => (
                    <YearSelectionCard
                      key={studyPack.id}
                      studyPack={studyPack}
                      onClick={() => {
                        console.log('🎯 [YearSelection] Selected study pack:', studyPack);
                        selectYear(studyPack.yearNumber || 'RESIDENCY');
                      }}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="No Study Packs Available"
                description="No active study packs are available for selection."
              />
            )}
          </div>
        )}

        {navigation.level === 'units' && filters && (
          <div className="space-y-6">
            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-muted p-4 rounded-lg text-sm">
                <strong>Debug Info:</strong>
                <br />Units: {filters.unites?.length || 0}
                <br />Independent Modules: {filters.independentModules?.length || 0}
                <br />Selected Year: {navigation.selectedYear}
              </div>
            )}

            {/* Units Section */}
            {filters.unites && filters.unites.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Units</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.unites.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      onClick={() => navigateToModules(unit)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Independent Modules Section */}
            {filters.independentModules && filters.independentModules.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Independent Modules</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filters.independentModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onClick={() => navigateToCourses(module, true)}
                      isIndependent={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for units level */}
            {(!filters.unites || filters.unites.length === 0) &&
              (!filters.independentModules || filters.independentModules.length === 0) && (
                <EmptyState
                  icon={School}
                  title="No Units or Modules Available"
                  description={`No units or independent modules are available for Year ${navigation.selectedYear}. This might be because the content hasn't been created yet or the year level filter didn't return any results.`}
                />
              )}
          </div>
        )}

        {navigation.level === 'modules' && navigation.selectedUnit && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Modules in {navigation.selectedUnit.name}</h2>
            </div>

            {navigation.selectedUnit.modules && navigation.selectedUnit.modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {navigation.selectedUnit.modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onClick={() => navigateToCourses(module)}
                  />
                ))}
              </div>
            ) : (

              <EmptyState
                icon={Layers}
                title="No Modules Available"
                description="No modules are available in this unit."
              />
            )}
          </div>
        )}

        {/* Book Management Modal */}
        {navigation.level === 'courses' && navigation.selectedModule && (
          <AddBookModal
            open={addBookModalOpen}
            onOpenChange={setAddBookModalOpen}
            moduleId={navigation.selectedModule.id}
            moduleName={navigation.selectedModule.name}
            onBookAdded={() => setRefreshBooksTrigger(prev => prev + 1)}
          />
        )}

        {navigation.level === 'courses' && navigation.selectedModule && (
          <div className="space-y-6">
            <div className="space-y-8">
              {/* Module Books Section */}
              <BookManagementList
                moduleId={navigation.selectedModule.id}
                moduleName={navigation.selectedModule.name}
                onAddBook={() => setAddBookModalOpen(true)}
                refreshTrigger={refreshBooksTrigger}
              />

              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Courses in {navigation.selectedModule.name}</h2>
                </div>

                {navigation.selectedModule.courses && navigation.selectedModule.courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {navigation.selectedModule.courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => navigateToResources(course)}
                      />
                    ))}
                  </div>
                ) : (

                  <EmptyState
                    icon={BookOpen}
                    title="No Courses Available"
                    description="No courses are available in this module."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {navigation.level === 'resources' && navigation.selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Resources for {navigation.selectedCourse.name}</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigateToCreateResource(navigation.selectedCourse!)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Resource
                </Button>
              </div>
            </div>

            {loadingResources ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading resources...</span>
              </div>
            ) : deletingResource ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Deleting resource...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : courseResources && Array.isArray(courseResources) && courseResources.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {courseResources.map((resource) => {
                  if (!resource || !resource.id) {
                    console.warn('Invalid resource found:', resource);
                    return null;
                  }
                  console.log('Rendering resource with buttons:', {
                    id: resource.id,
                    title: resource.title,
                    hasFilePath: !!resource.filePath,
                    hasExternalUrl: !!resource.externalUrl,
                    hasYoutubeId: !!resource.youtubeVideoId
                  });

                  // Helper function to get file type icon
                  const getFileIcon = (filePath: string | null, resourceType: string) => {
                    if (!filePath) return File;

                    const extension = filePath.toLowerCase().split('.').pop();
                    switch (extension) {
                      case 'pdf':
                        return FileText;
                      case 'jpg':
                      case 'jpeg':
                      case 'png':
                      case 'gif':
                      case 'bmp':
                      case 'tiff':
                      case 'webp':
                      case 'svg':
                        return Image;
                      default:
                        return File;
                    }
                  };

                  // Helper function to get file name from path
                  const getFileName = (filePath: string | null) => {
                    if (!filePath) return null;
                    return filePath.split('/').pop() || filePath;
                  };

                  // Helper function to get file size (if available in future)
                  const getFileSize = (filePath: string | null) => {
                    // This would need to be provided by the API in the future
                    return null;
                  };

                  const FileIcon = getFileIcon(resource.filePath, resource.type);
                  const fileName = getFileName(resource.filePath);

                  return (
                    <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {resource.type}
                            </Badge>
                            {resource.filePath && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <FileIcon className="h-3 w-3" />
                                {fileName?.split('.').pop()?.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mb-1">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                          )}

                          {/* File Information */}
                          {resource.filePath && (
                            <div className="bg-muted/50 rounded-lg p-3 mb-2">
                              <div className="flex items-center gap-2 text-sm">
                                <FileIcon className="h-4 w-4 text-primary" />
                                <span className="font-medium">Uploaded File:</span>
                                <span className="text-muted-foreground">{fileName}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Created: {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            {resource.filePath && (
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                File Available
                              </span>
                            )}
                            {resource.externalUrl && (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                External Link
                              </span>
                            )}
                            {resource.youtubeVideoId && (
                              <span className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                YouTube Video
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          {resource.filePath && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(resource.filePath!, '_blank')}
                                className="flex items-center gap-1"
                              >
                                <FileIcon className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Create download link
                                  const link = document.createElement('a');
                                  link.href = resource.filePath!;
                                  link.download = fileName || resource.title;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Download className="h-3 w-3" />
                                Download
                              </Button>
                            </>
                          )}
                          {resource.externalUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(resource.externalUrl!, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Open Link
                            </Button>
                          )}
                          {resource.youtubeVideoId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://www.youtube.com/watch?v=${resource.youtubeVideoId}`, '_blank')}
                              className="flex items-center gap-1"
                            >
                              <Video className="h-3 w-3" />
                              Watch
                            </Button>
                          )}
                          {/* Always render delete button */}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              console.log('Delete button clicked for resource:', resource.id);
                              setResourceToDelete({ id: resource.id, title: resource.title });
                            }}
                            disabled={deletingResource}
                            className="ml-2"
                            data-testid={`delete-resource-${resource.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Resources Available"
                description="No resources are available for this course. Click 'Add Resource' to create the first one."
              />
            )}
          </div>
        )}

        {navigation.level === 'create-resource' && navigation.selectedCourse && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Create Course Resource</h2>
            </div>

            <CreateResourceForm
              course={navigation.selectedCourse}
              onSubmit={createResource}
              onCancel={navigateBack}
              loading={creating}
            />
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {resourceToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Delete Resource
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. This will permanently delete the resource.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{resourceToDelete.title}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setResourceToDelete(null)}
                    disabled={deletingResource}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteResource}
                    disabled={deletingResource}
                    className="flex-1"
                  >
                    {deletingResource ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error in AdminCourseResourcesPage:', error);
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Course Resources</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            An error occurred while loading the page. Please refresh and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
