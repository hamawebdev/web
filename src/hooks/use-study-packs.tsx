// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContentService, StudentService } from '@/lib/api-services';
import { StudyPack, StudyPackDetails, StudyPackUnit, PaginatedResponse, Course, CourseProgressDetails } from '@/types/api';
import { toast } from 'sonner';
import { useStudentAuth } from './use-auth';
import { apiClient } from '@/lib/api-client';

// Extended StudyPackDetails interface for the actual API response structure
interface ExtendedStudyPackDetails extends StudyPack {
  // Additional computed fields for enhanced display
  totalCourses?: number;
  totalUnits?: number;
  estimatedHours?: number;
  difficulty?: string;
  isPaid?: boolean;
  imageUrl?: string;
  // Use the proper API structure
  units?: StudyPackUnit[];
}

// Interface for study packs filters
export interface StudyPackFilters {
  search?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isPaid?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'difficulty' | 'estimatedHours' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Interface for study packs state
interface StudyPacksState {
  studyPacks: StudyPack[] | null;
  pagination: any | null;
  loading: boolean;
  error: string | null;
}

// Interface for study pack details state
interface StudyPackDetailsState {
  studyPack: StudyPackDetails | null;
  loading: boolean;
  error: string | null;
}

// Interface for course resources state
interface CourseResourcesState {
  courseId: number | null;
  courseName: string | null;
  resources: any[] | null;
  loading: boolean;
  error: string | null;
}

// Hook for managing study packs list with filtering and pagination
export function useStudyPacks(filters: StudyPackFilters = {}) {
  const [state, setState] = useState<StudyPacksState>({
    studyPacks: null,
    pagination: null,
    loading: true,
    error: null,
  });

  const fetchStudyPacks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use the enhanced API service with server-side filtering
      const response = await ContentService.getStudyPacks({
        page: filters.page || 1,
        limit: filters.limit || 12,
        search: filters.search,
        difficulty: filters.difficulty,
        isPaid: filters.isPaid,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (response.success) {
        // Handle nested response structure from API
        // API returns: { success: true, data: { success: true, data: { success: true, data: [...] } } }
        const studyPacksData = response.data?.data?.data || response.data?.data || response.data || [];
        const paginationData = response.data?.data?.pagination || response.data?.pagination || null;

        setState({
          studyPacks: studyPacksData,
          pagination: paginationData,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch study packs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch study packs';
      setState({
        studyPacks: null,
        pagination: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Study packs fetch error:', error);

      // If API filtering fails, fall back to basic fetch with client-side filtering
      if (error instanceof Error && error.message.includes('400')) {
        console.log('Falling back to client-side filtering...');
        try {
          const basicResponse = await ContentService.getStudyPacks({
            page: filters.page || 1,
            limit: filters.limit || 12,
          });

          if (basicResponse.success) {
            // Handle nested response structure from API
            const studyPacksData = basicResponse.data?.data?.data || basicResponse.data?.data || basicResponse.data || [];
            let filteredPacks = studyPacksData;

            // Apply client-side filters as fallback
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              filteredPacks = filteredPacks.filter(pack =>
                pack.name.toLowerCase().includes(searchLower) ||
                pack.description.toLowerCase().includes(searchLower)
              );
            }

            if (filters.difficulty) {
              filteredPacks = filteredPacks.filter(pack => pack.difficulty === filters.difficulty);
            }

            if (filters.isPaid !== undefined) {
              filteredPacks = filteredPacks.filter(pack => pack.isPaid === filters.isPaid);
            }

            if (filters.minPrice !== undefined) {
              filteredPacks = filteredPacks.filter(pack => (pack.price || 0) >= filters.minPrice!);
            }

            if (filters.maxPrice !== undefined) {
              filteredPacks = filteredPacks.filter(pack => (pack.price || 0) <= filters.maxPrice!);
            }

            // Apply sorting
            if (filters.sortBy) {
              filteredPacks.sort((a, b) => {
                let aValue: any = a[filters.sortBy!];
                let bValue: any = b[filters.sortBy!];

                if (filters.sortBy === 'price') {
                  aValue = a.price || 0;
                  bValue = b.price || 0;
                }

                if (typeof aValue === 'string') {
                  aValue = aValue.toLowerCase();
                  bValue = bValue.toLowerCase();
                }

                if (filters.sortOrder === 'desc') {
                  return bValue > aValue ? 1 : -1;
                }
                return aValue > bValue ? 1 : -1;
              });
            }

            setState({
              studyPacks: filteredPacks,
              pagination: basicResponse.data.pagination,
              loading: false,
              error: null,
            });
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    }
  }, [filters.page, filters.limit, filters.search, filters.difficulty, filters.isPaid, filters.minPrice, filters.maxPrice, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    fetchStudyPacks();
  }, [fetchStudyPacks]);

  return {
    ...state,
    refresh: fetchStudyPacks,
  };
}

// Hook for homepage study packs display
export function useHomepageStudyPacks() {
  const [state, setState] = useState<{
    studyPacks: StudyPack[];
    loading: boolean;
    error: string | null;
  }>({
    studyPacks: [],
    loading: false,
    error: null,
  });

  const fetchStudyPacks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Use the direct API endpoint as specified in the documentation
      const response = await apiClient.get<any>('/study-packs');

      // Handle the nested response structure from the API documentation
      const data = response.data?.data?.data || response.data?.data || response.data || [];
      const studyPacks = Array.isArray(data) ? data : [];

      // Filter only active study packs
      const activeStudyPacks = studyPacks.filter((pack: StudyPack) => pack.isActive);

      setState({
        studyPacks: activeStudyPacks,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch study packs for homepage:', error);
      setState({
        studyPacks: [],
        loading: false,
        error: 'Impossible de charger les packs d\'étude.',
      });
    }
  }, []);

  useEffect(() => {
    fetchStudyPacks();
  }, [fetchStudyPacks]);

  return {
    ...state,
    refresh: fetchStudyPacks,
  };
}

// Hook for managing study pack details
export function useStudyPackDetails(studyPackId: number | null) {
  const { isAuthenticated, loading: authLoading } = useStudentAuth();
  const [state, setState] = useState<StudyPackDetailsState>({
    studyPack: null,
    loading: false,
    error: null,
  });

  const fetchStudyPackDetails = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await ContentService.getStudyPackDetails(id);

      if (response.success) {
        // Handle nested response structure from API
        const studyPackData = response.data?.data?.data || response.data?.data || response.data;

        setState({
          studyPack: studyPackData,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch study pack details');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch study pack details';
      setState({
        studyPack: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Study pack details fetch error:', error);
    }
  }, []);

  useEffect(() => {
    // Only fetch if authenticated and not loading auth
    if (studyPackId && isAuthenticated && !authLoading) {
      fetchStudyPackDetails(studyPackId);
    } else if (!studyPackId) {
      setState({
        studyPack: null,
        loading: false,
        error: null,
      });
    } else if (!isAuthenticated && !authLoading) {
      // User is not authenticated and auth loading is complete
      setState({
        studyPack: null,
        loading: false,
        error: 'Authentication required',
      });
    }
  }, [studyPackId, isAuthenticated, authLoading, fetchStudyPackDetails]);

  return {
    ...state,
    loading: state.loading || authLoading, // Include auth loading in overall loading state
    refresh: studyPackId && isAuthenticated ? () => fetchStudyPackDetails(studyPackId) : undefined,
  };
}

// Hook for managing course resources
export function useCourseResources(
  courseId: number | null,
  params: { page?: number; limit?: number; type?: string } = {}
) {
  const [state, setState] = useState<CourseResourcesState>({
    courseId: null,
    courseName: null,
    resources: null,
    loading: false,
    error: null,
  });

  const fetchCourseResources = useCallback(async (id: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await ContentService.getCourseResources(id, {
        page: params.page || 1,
        limit: params.limit || 10,
        type: params.type,
      });

      if (response.success && response.data) {
        // Handle variable nested response structure: API may wrap data inside data.data
        const d: any = (response as any).data
        const inner = d?.data?.data ?? d?.data ?? d
        const resources = Array.isArray(inner?.resources) ? inner.resources : Array.isArray(inner) ? inner : []

        setState({
          courseId: d?.courseId ?? null,
          courseName: d?.courseName ?? null,
          resources,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Failed to fetch course resources');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch course resources';
      setState({
        courseId: null,
        courseName: null,
        resources: null,
        loading: false,
        error: errorMessage,
      });
      console.error('Course resources fetch error:', error);
    }
  }, [params.page, params.limit, params.type]);

  useEffect(() => {
    if (courseId) {
      fetchCourseResources(courseId);
    } else {
      setState({
        courseId: null,
        courseName: null,
        resources: null,
        loading: false,
        error: null,
      });
    }
  }, [courseId, fetchCourseResources]);

  return {
    ...state,
    refresh: courseId ? () => fetchCourseResources(courseId) : undefined,
  };
}

// Hook for managing user's study progress with API integration
export function useStudyProgress() {
  const [progressData, setProgressData] = useState<{
    completedCourses: number[];
    courseProgress: Record<number, number>;
    courseDetails: Record<number, CourseProgressDetails>;
    loading: boolean;
    error: string | null;
  }>({
    completedCourses: [],
    courseProgress: {},
    courseDetails: {},
    loading: true,
    error: null,
  });

  // Fetch course progress details
  const fetchCourseProgress = useCallback(async (courseId: number) => {
    try {
      const response = await StudentService.getCourseProgress(courseId);

      if (response.success) {
        const details = response.data;
        setProgressData(prev => ({
          ...prev,
          courseDetails: {
            ...prev.courseDetails,
            [courseId]: details,
          },
          courseProgress: {
            ...prev.courseProgress,
            [courseId]: details.overallProgress,
          },
          completedCourses: details.overallProgress === 100
            ? [...prev.completedCourses.filter(id => id !== courseId), courseId]
            : prev.completedCourses.filter(id => id !== courseId),
        }));

        return details;
      } else {
        throw new Error(response.error || 'Failed to fetch course progress');
      }
    } catch (error) {
      console.error('Course progress fetch error:', error);
      throw error;
    }
  }, []);

  // Update course progress with layer-based tracking
  const updateCourseProgress = useCallback(async (
    courseId: number,
    progressUpdate: {
      layer?: number;
      progress?: number;
      completed?: boolean;
      timeSpent?: number;
      notes?: string;
    }
  ) => {
    try {
      const response = await StudentService.updateCourseProgress(courseId, progressUpdate);

      if (response.success) {
        // Refresh the course progress details
        await fetchCourseProgress(courseId);
        toast.success('Progress updated successfully');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update progress');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update progress';
      toast.error(errorMessage);
      throw error;
    }
  }, [fetchCourseProgress]);

  // Mark specific layer as complete
  const markLayerComplete = useCallback(async (courseId: number, layer: number) => {
    return updateCourseProgress(courseId, {
      layer,
      completed: true,
      progress: 100,
    });
  }, [updateCourseProgress]);

  // Mark entire course as complete
  const markCourseComplete = useCallback(async (courseId: number) => {
    try {
      // Mark all layers as complete
      await Promise.all([
        updateCourseProgress(courseId, { layer: 1, completed: true, progress: 100 }),
        updateCourseProgress(courseId, { layer: 2, completed: true, progress: 100 }),
        updateCourseProgress(courseId, { layer: 3, completed: true, progress: 100 }),
      ]);

      // Final update to mark overall completion
      return updateCourseProgress(courseId, { completed: true, progress: 100 });
    } catch (error) {
      console.error('Failed to mark course complete:', error);
      throw error;
    }
  }, [updateCourseProgress]);

  // Generate completion certificate
  const generateCertificate = useCallback(async (courseId: number) => {
    try {
      const response = await StudentService.generateCertificate(courseId);

      if (response.success) {
        // Update course details with certificate info
        setProgressData(prev => ({
          ...prev,
          courseDetails: {
            ...prev.courseDetails,
            [courseId]: {
              ...prev.courseDetails[courseId],
              certificate: response.data,
            },
          },
        }));

        toast.success('Certificate generated successfully!');
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to generate certificate');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate certificate';
      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Load initial progress data from API
  useEffect(() => {
    const loadInitialProgress = async () => {
      try {
        setProgressData(prev => ({ ...prev, loading: true, error: null }));

        // In a real implementation, you might fetch a list of user's enrolled courses
        // and then fetch progress for each one. For now, we'll use mock data structure
        // but with real API integration capability

        setProgressData(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load progress data';
        setProgressData(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        console.error('Progress data load error:', error);
      }
    };

    loadInitialProgress();
  }, []);

  return {
    ...progressData,
    updateCourseProgress,
    markLayerComplete,
    markCourseComplete,
    fetchCourseProgress,
    generateCertificate,
  };
}

// Utility functions for study packs
export function getStudyPackPrice(studyPack: ExtendedStudyPackDetails): string {
  if (!studyPack.isPaid) return 'Free';
  if (!studyPack.price) return 'Contact for pricing';
  return `$${studyPack.price}`;
}

export function getStudyPackDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-primary-foreground bg-primary/10 border-primary/20';
    case 'intermediate':
      return 'text-accent-foreground bg-accent/10 border-accent/20';
    case 'advanced':
      return 'text-destructive-foreground bg-destructive/10 border-destructive/20';
    default:
      return 'text-muted-foreground bg-muted/10 border-muted/20';
  }
}

export function calculateStudyPackProgress(
  studyPack: ExtendedStudyPackDetails,
  courseProgress: Record<number, number>
): number {
  // Add null/undefined checks for the nested structure
  if (!studyPack || !studyPack.units || !Array.isArray(studyPack.units)) {
    return 0;
  }

  const allCourses = studyPack.units.flatMap(unit => {
    if (!unit || !unit.modules || !Array.isArray(unit.modules)) {
      return [];
    }
    return unit.modules.flatMap(module => {
      if (!module || !module.courses || !Array.isArray(module.courses)) {
        return [];
      }
      return module.courses;
    });
  });

  if (allCourses.length === 0) return 0;

  const totalProgress = allCourses.reduce((sum, course) => {
    return sum + (courseProgress[course.id] || 0);
  }, 0);

  return Math.round(totalProgress / allCourses.length);
}

export function getEstimatedTimeRemaining(
  studyPack: ExtendedStudyPackDetails,
  courseProgress: Record<number, number>
): number {
  // Add null/undefined checks for the nested structure
  if (!studyPack || !studyPack.units || !Array.isArray(studyPack.units)) {
    return 0;
  }

  const allCourses = studyPack.units.flatMap(unit => {
    if (!unit || !unit.modules || !Array.isArray(unit.modules)) {
      return [];
    }
    return unit.modules.flatMap(module => {
      if (!module || !module.courses || !Array.isArray(module.courses)) {
        return [];
      }
      return module.courses;
    });
  });

  const remainingHours = allCourses.reduce((sum, course) => {
    const progress = courseProgress[course.id] || 0;
    const remainingProgress = (100 - progress) / 100;
    const estimatedHours = course.estimatedHours || 0;
    return sum + (estimatedHours * remainingProgress);
  }, 0);

  return Math.round(remainingHours);
}
