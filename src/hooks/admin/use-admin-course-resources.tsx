/**
 * Hook for managing admin course resources with hierarchical navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminCourseResourcesService } from '@/lib/api-services';
import { toast } from 'sonner';

// Types based on the API documentation
export interface StudyPack {
  id: number;
  name: string;
  description: string;
  type: 'YEAR' | 'RESIDENCY';
  yearNumber: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContentFilters {
  unites: Array<{
    id: number;
    name: string;
    studyPack: {
      id: number;
      name: string;
      yearNumber: string;
      type: string;
    };
    modules: Array<{
      id: number;
      name: string;
      courses: Array<{
        id: number;
        name: string;
        description: string;
      }>;
    }>;
  }>;
  independentModules: Array<{
    id: number;
    name: string;
    studyPack: {
      id: number;
      name: string;
      yearNumber: string;
      type: string;
    };
    courses: Array<{
      id: number;
      name: string;
      description: string;
    }>;
  }>;
}

export interface Unit {
  id: number;
  name: string;
  // Not returned by GET /admin/content/filters
  studyPack?: {
    id: number;
    name: string;
    yearNumber: string;
    type: string;
  };
  modules: Module[];
}

export interface Module {
  id: number;
  name: string;
  courses: Course[];
  isIndependent?: boolean;
}

export interface Course {
  id: number;
  name: string;
  description: string;
}

export interface CourseResource {
  id: number;
  courseId: number;
  type: 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';
  title: string;
  description: string | null;
  filePath: string | null;
  externalUrl: string | null;
  youtubeVideoId: string | null;
  isPaid: boolean;
  price: number | null;
  createdAt: string;
  updatedAt: string;
  course: { name: string };
}

export interface CreateResourceData {
  courseId: number;
  type: 'OFFICIAL_SUPPORT' | 'CHOICE_OF_TEAM' | 'VIDEO' | 'AUDIO' | 'OTHER';
  title: string;
  description?: string;
  filePath?: string;
  externalUrl?: string;
  youtubeVideoId?: string;
  isPaid?: boolean;
  price?: number;
}

export type NavigationLevel = 'year-selection' | 'units' | 'modules' | 'courses' | 'resources' | 'create-resource';

export interface NavigationState {
  level: NavigationLevel;
  selectedYear: string | null;
  selectedUnit: Unit | null;
  selectedModule: Module | null;
  selectedCourse: Course | null;
  breadcrumb: Array<{
    label: string;
    level: NavigationLevel;
    data?: Unit | Module | Course;
  }>;
}

export interface UseAdminCourseResourcesResult {
  // Data
  studyPacks: StudyPack[] | null;
  filters: AdminContentFilters | null;
  navigation: NavigationState;
  courseResources: CourseResource[] | null;

  // Loading states
  loading: boolean;
  creating: boolean;
  loadingResources: boolean;
  deletingResource: boolean;

  // Error states
  error: string | null;

  // Navigation methods
  selectYear: (yearLevel: string) => void;
  navigateToUnits: () => void;
  navigateToModules: (unit: Unit) => void;
  navigateToCourses: (module: Module, isIndependent?: boolean) => void;
  navigateToResources: (course: Course) => void;
  navigateToCreateResource: (course: Course) => void;
  navigateBack: () => void;

  // Resource management
  createResource: (resourceData: CreateResourceData, file?: File, onProgress?: (progress: number) => void) => Promise<boolean>;
  deleteResource: (resourceId: number) => Promise<boolean>;

  // Utility methods
  refetch: () => Promise<void>;
  hasError: boolean;
  hasData: boolean;
}

export function useAdminCourseResources(): UseAdminCourseResourcesResult {
  const [studyPacks, setStudyPacks] = useState<StudyPack[] | null>(null);
  const [filters, setFilters] = useState<AdminContentFilters | null>(null);
  const [courseResources, setCourseResources] = useState<CourseResource[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [deletingResource, setDeletingResource] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [navigation, setNavigation] = useState<NavigationState>({
    level: 'year-selection',
    selectedYear: null,
    selectedUnit: null,
    selectedModule: null,
    selectedCourse: null,
    breadcrumb: [{ label: 'Select Year Level', level: 'year-selection' }]
  });

  // Debug logging for navigation state changes
  useEffect(() => {
    console.log('🔄 [AdminCourseResources] Navigation state changed:', {
      level: navigation.level,
      selectedCourse: navigation.selectedCourse?.name,
      courseResourcesCount: courseResources?.length || 0
    });

    // Clear course resources when not in resources or create-resource level
    if (navigation.level !== 'resources' && navigation.level !== 'create-resource' && courseResources) {
      console.log('🧹 [AdminCourseResources] Clearing course resources for level:', navigation.level);
      setCourseResources(null);
    }
  }, [navigation, courseResources]);

  // Fetch study packs for year selection
  const fetchStudyPacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AdminCourseResourcesService.getStudyPacks();

      if (response.success && response.data) {
        setStudyPacks(response.data.studyPacks);
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to fetch study packs';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching study packs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch study packs';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch admin content filters for selected year
  const fetchFilters = useCallback(async (yearLevel: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [AdminCourseResources] Fetching filters for year:', yearLevel);

      // Residency packs have no yearNumber (selectYear passes 'RESIDENCY'), which is not a
      // YearLevel value: ask for residency content instead of an invalid yearLevel filter.
      const response = await AdminCourseResourcesService.getAdminContentFilters(
        yearLevel === 'RESIDENCY' ? { isResidency: true } : { yearLevel }
      );

      console.log('📊 [AdminCourseResources] API Response:', {
        success: response.success,
        dataExists: !!response.data,
        unites: response.data?.unites?.length || 0,
        independentModules: response.data?.independentModules?.length || 0
      });

      if (response.success && response.data) {
        setFilters(response.data);
        console.log('✅ [AdminCourseResources] Filters set successfully');
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to fetch content filters';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('❌ [AdminCourseResources] Error fetching content filters:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content filters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch course resources
  const fetchCourseResources = useCallback(async (courseId: number) => {
    try {
      setLoadingResources(true);
      setError(null);

      console.log('🔍 [AdminCourseResources] Fetching resources for course:', courseId);

      const response = await AdminCourseResourcesService.getCourseResources(courseId);

      console.log('📊 [AdminCourseResources] Course Resources Response:', {
        success: response.success,
        dataExists: !!response.data,
        resourcesCount: Array.isArray(response.data) ? response.data.length : 0
      });

      if (response.success && response.data) {
        // Map the API response to match our CourseResource interface
        const mappedResources: CourseResource[] = response.data.map(resource => ({
          ...resource,
          course: { name: resource.courseName }
        }));
        setCourseResources(mappedResources);
        console.log('✅ [AdminCourseResources] Course resources set successfully');
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to fetch course resources';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('❌ [AdminCourseResources] Error fetching course resources:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course resources';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingResources(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchStudyPacks();
  }, [fetchStudyPacks]);

  // Navigation methods
  const selectYear = useCallback((yearLevel: string) => {
    console.log('🎯 [AdminCourseResources] Year selected:', yearLevel);

    setNavigation(prev => ({
      level: 'units',
      selectedYear: yearLevel,
      selectedUnit: null,
      selectedModule: null,
      selectedCourse: null,
      breadcrumb: [
        { label: 'Select Year Level', level: 'year-selection' },
        { label: `Year ${yearLevel} - Units & Independent Modules`, level: 'units' }
      ]
    }));
    fetchFilters(yearLevel);
  }, [fetchFilters]);

  const navigateToUnits = useCallback(() => {
    if (navigation.selectedYear) {
      setNavigation(prev => ({
        level: 'units',
        selectedYear: prev.selectedYear,
        selectedUnit: null,
        selectedModule: null,
        selectedCourse: null,
        breadcrumb: [
          { label: 'Select Year Level', level: 'year-selection' },
          { label: `Year ${prev.selectedYear} - Units & Independent Modules`, level: 'units' }
        ]
      }));
    }
  }, [navigation.selectedYear]);

  const navigateToModules = useCallback((unit: Unit) => {
    setNavigation(prev => ({
      level: 'modules',
      selectedYear: prev.selectedYear,
      selectedUnit: unit,
      selectedModule: null,
      selectedCourse: null,
      breadcrumb: [
        { label: 'Select Year Level', level: 'year-selection' },
        { label: `Year ${prev.selectedYear} - Units & Independent Modules`, level: 'units' },
        { label: unit.name, level: 'modules', data: unit }
      ]
    }));
  }, []);

  const navigateToCourses = useCallback((module: Module, isIndependent = false) => {
    const moduleWithFlag = { ...module, isIndependent };
    setNavigation(prev => ({
      level: 'courses',
      selectedYear: prev.selectedYear,
      selectedUnit: prev.selectedUnit,
      selectedModule: moduleWithFlag,
      selectedCourse: null,
      breadcrumb: [
        { label: 'Select Year Level', level: 'year-selection' },
        { label: `Year ${prev.selectedYear} - Units & Independent Modules`, level: 'units' },
        ...(isIndependent
          ? [{ label: module.name, level: 'courses' as NavigationLevel, data: moduleWithFlag }]
          : [
            { label: prev.selectedUnit?.name || '', level: 'modules' as NavigationLevel, data: prev.selectedUnit },
            { label: module.name, level: 'courses' as NavigationLevel, data: moduleWithFlag }
          ]
        )
      ]
    }));
  }, []);

  const navigateToResources = useCallback((course: Course) => {
    setNavigation(prev => ({
      level: 'resources',
      selectedYear: prev.selectedYear,
      selectedUnit: prev.selectedUnit,
      selectedModule: prev.selectedModule,
      selectedCourse: course,
      breadcrumb: [
        ...prev.breadcrumb,
        { label: course.name, level: 'resources', data: course }
      ]
    }));

    // Fetch resources for the selected course
    fetchCourseResources(course.id);
  }, [fetchCourseResources]);

  const navigateToCreateResource = useCallback((course: Course) => {
    setNavigation(prev => ({
      level: 'create-resource',
      selectedYear: prev.selectedYear,
      selectedUnit: prev.selectedUnit,
      selectedModule: prev.selectedModule,
      selectedCourse: course,
      breadcrumb: [
        ...prev.breadcrumb,
        { label: 'Add Resource', level: 'create-resource', data: course }
      ]
    }));
  }, []);

  const navigateBack = useCallback(() => {
    setNavigation(prev => {
      const newBreadcrumb = prev.breadcrumb.slice(0, -1);
      const lastItem = newBreadcrumb[newBreadcrumb.length - 1];

      if (!lastItem || lastItem.level === 'year-selection') {
        return {
          level: 'year-selection',
          selectedYear: null,
          selectedUnit: null,
          selectedModule: null,
          selectedCourse: null,
          breadcrumb: [{ label: 'Select Year Level', level: 'year-selection' }]
        };
      }

      return {
        level: lastItem.level,
        selectedYear: prev.selectedYear,
        selectedUnit: lastItem.level === 'units' || lastItem.level === 'year-selection' ? null : prev.selectedUnit,
        selectedModule: lastItem.level === 'modules' || lastItem.level === 'units' || lastItem.level === 'year-selection' ? null : prev.selectedModule,
        selectedCourse: lastItem.level === 'create-resource' ? null : prev.selectedCourse,
        breadcrumb: newBreadcrumb
      };
    });
  }, []);

  // Resource creation (enhanced from test file pattern)
  const createResource = useCallback(async (resourceData: CreateResourceData, file?: File, onProgress?: (progress: number) => void): Promise<boolean> => {
    try {
      setCreating(true);
      setError(null);

      console.log('🚀 [AdminCourseResources] Creating resource:', {
        title: resourceData.title,
        type: resourceData.type,
        courseId: resourceData.courseId,
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'
      });

      const response = await AdminCourseResourcesService.createCourseResource(resourceData, file, onProgress);

      console.log('📥 [AdminCourseResources] API Response:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error
      });

      if (response.success && response.data) {
        console.log('✅ [AdminCourseResources] Resource created successfully:', {
          id: response.data.resource?.id,
          title: response.data.resource?.title,
          type: response.data.resource?.type
        });
        toast.success(`Course resource "${resourceData.title}" created successfully`);

        // Refresh the course resources list
        if (navigation.selectedCourse) {
          await fetchCourseResources(navigation.selectedCourse.id);
        }

        // Navigate back to resources list after successful creation
        navigateBack();
        return true;
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to create course resource';
        console.error('❌ [AdminCourseResources] API Error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('❌ [AdminCourseResources] Error creating resource:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course resource';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setCreating(false);
    }
  }, [navigateBack, navigation.selectedCourse, fetchCourseResources]);

  // Delete course resource
  const deleteResource = useCallback(async (resourceId: number): Promise<boolean> => {
    try {
      setDeletingResource(true);
      setError(null);

      console.log('🗑️ [AdminCourseResources] Deleting resource:', resourceId);

      const response = await AdminCourseResourcesService.deleteCourseResource(resourceId);

      if (response.success) {
        console.log('✅ [AdminCourseResources] Resource deleted successfully');
        toast.success('Course resource deleted successfully');

        // Remove the deleted resource from the current list
        setCourseResources(prev =>
          prev ? prev.filter(resource => resource.id !== resourceId) : null
        );

        return true;
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Failed to delete course resource';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('❌ [AdminCourseResources] Error deleting resource:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course resource';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setDeletingResource(false);
    }
  }, []);

  return {
    // Data
    studyPacks,
    filters,
    navigation,
    courseResources,

    // Loading states
    loading,
    creating,
    loadingResources,
    deletingResource,

    // Error states
    error,

    // Navigation methods
    selectYear,
    navigateToUnits,
    navigateToModules,
    navigateToCourses,
    navigateToResources,
    navigateToCreateResource,
    navigateBack,

    // Resource management
    createResource,
    deleteResource,

    // Utility methods
    refetch: fetchStudyPacks,
    hasError: !!error,
    hasData: navigation.level === 'year-selection' ? !!studyPacks : !!filters
  };
}
