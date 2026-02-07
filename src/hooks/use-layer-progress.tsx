'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentService } from '@/lib/api-services';
import { useStudentAuth } from './use-auth';
import { toast } from 'sonner';

interface LayerProgressState {
  layer1Completed: boolean;
  layer2Completed: boolean;
  layer3Completed: boolean;
  progressPercentage: number;
  lastUpdated?: string;
}

interface CourseLayerProgress {
  [courseId: number]: LayerProgressState;
}

interface LayerProgressHookState {
  courseProgress: CourseLayerProgress;
  loading: boolean;
  error: string | null;
  updating: Record<string, boolean>; // Track which course+layer is updating
}

interface LayerUpdateParams {
  layer: number;
  completed: boolean;
  progress?: number;
  timeSpent?: number;
}

export function useLayerProgress() {
  const { isAuthenticated, loading: authLoading } = useStudentAuth();
  const [state, setState] = useState<LayerProgressHookState>({
    courseProgress: {},
    loading: true,
    error: null,
    updating: {}
  });

  // Fetch progress overview and extract layer data
  const fetchProgressOverview = useCallback(async () => {
    if (!isAuthenticated || authLoading) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await StudentService.getProgressOverview();

      if (response.success) {
        // Extract the actual progress data from the nested response structure
        const progressData = response.data?.data?.data || response.data?.data || response.data || null;
        
        if (progressData?.completedCourses) {
          const courseProgress: CourseLayerProgress = {};
          
          progressData.completedCourses.forEach((course: any) => {
            courseProgress[course.courseId] = {
              layer1Completed: course.layer1Completed || false,
              layer2Completed: course.layer2Completed || false,
              layer3Completed: course.layer3Completed || false,
              progressPercentage: course.progressPercentage || 0,
              lastUpdated: course.lastUpdated || new Date().toISOString()
            };
          });

          setState(prev => ({
            ...prev,
            courseProgress,
            loading: false,
            error: null
          }));
        } else {
          setState(prev => ({
            ...prev,
            courseProgress: {},
            loading: false,
            error: null
          }));
        }
      } else {
        throw new Error(response.error || 'Failed to fetch progress overview');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress overview';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      console.error('Progress overview fetch error:', error);
    }
  }, [isAuthenticated, authLoading]);

  // Update layer progress for a specific course
  const updateLayerProgress = useCallback(async (
    courseId: number, 
    updateParams: LayerUpdateParams
  ): Promise<void> => {
    const updateKey = `${courseId}-${updateParams.layer}`;
    
    try {
      setState(prev => ({
        ...prev,
        updating: { ...prev.updating, [updateKey]: true }
      }));

      const response = await StudentService.updateCourseProgress(courseId, updateParams);

      if (response.success) {
        // Optimistically update the local state
        setState(prev => {
          const currentCourseProgress = prev.courseProgress[courseId] || {
            layer1Completed: false,
            layer2Completed: false,
            layer3Completed: false,
            progressPercentage: 0
          };

          // Update the specific layer
          const updatedProgress = { ...currentCourseProgress };
          switch (updateParams.layer) {
            case 1:
              updatedProgress.layer1Completed = updateParams.completed;
              break;
            case 2:
              updatedProgress.layer2Completed = updateParams.completed;
              break;
            case 3:
              updatedProgress.layer3Completed = updateParams.completed;
              break;
          }

          // Calculate new overall progress
          const completedLayers = [
            updatedProgress.layer1Completed,
            updatedProgress.layer2Completed,
            updatedProgress.layer3Completed
          ].filter(Boolean).length;
          
          updatedProgress.progressPercentage = Math.round((completedLayers / 3) * 100);
          updatedProgress.lastUpdated = new Date().toISOString();

          return {
            ...prev,
            courseProgress: {
              ...prev.courseProgress,
              [courseId]: updatedProgress
            },
            updating: { ...prev.updating, [updateKey]: false }
          };
        });

        // Refresh the full progress data to ensure consistency
        setTimeout(() => {
          fetchProgressOverview();
        }, 1000);

      } else {
        throw new Error(response.error || 'Failed to update layer progress');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        updating: { ...prev.updating, [updateKey]: false }
      }));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update layer progress';
      console.error('Layer progress update error:', error);
      throw error; // Re-throw to let the component handle the error
    }
  }, [fetchProgressOverview]);

  // Get progress for a specific course
  const getCourseProgress = useCallback((courseId: number): LayerProgressState => {
    return state.courseProgress[courseId] || {
      layer1Completed: false,
      layer2Completed: false,
      layer3Completed: false,
      progressPercentage: 0
    };
  }, [state.courseProgress]);

  // Check if a specific layer is updating
  const isLayerUpdating = useCallback((courseId: number, layer: number): boolean => {
    const updateKey = `${courseId}-${layer}`;
    return state.updating[updateKey] || false;
  }, [state.updating]);

  // Get overall statistics
  const getOverallStats = useCallback(() => {
    const courses = Object.values(state.courseProgress);
    const totalCourses = courses.length;
    const completedCourses = courses.filter(course => course.progressPercentage === 100).length;
    const inProgressCourses = courses.filter(course => 
      course.progressPercentage > 0 && course.progressPercentage < 100
    ).length;
    
    const totalLayers = totalCourses * 3;
    const completedLayers = courses.reduce((sum, course) => {
      return sum + [
        course.layer1Completed,
        course.layer2Completed,
        course.layer3Completed
      ].filter(Boolean).length;
    }, 0);

    const overallProgress = totalLayers > 0 ? Math.round((completedLayers / totalLayers) * 100) : 0;

    return {
      totalCourses,
      completedCourses,
      inProgressCourses,
      totalLayers,
      completedLayers,
      overallProgress
    };
  }, [state.courseProgress]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchProgressOverview();
  }, [fetchProgressOverview]);

  // Initialize data on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchProgressOverview();
    }
  }, [isAuthenticated, authLoading, fetchProgressOverview]);

  return {
    courseProgress: state.courseProgress,
    loading: state.loading,
    error: state.error,
    updateLayerProgress,
    getCourseProgress,
    isLayerUpdating,
    getOverallStats,
    refresh
  };
}

// Hook for managing progress of a single course
export function useCourseLayerProgress(courseId: number) {
  const {
    courseProgress,
    loading,
    error,
    updateLayerProgress,
    getCourseProgress,
    isLayerUpdating,
    refresh
  } = useLayerProgress();

  const currentProgress = getCourseProgress(courseId);

  const updateLayer = useCallback(async (layer: number, completed: boolean) => {
    return updateLayerProgress(courseId, { layer, completed });
  }, [courseId, updateLayerProgress]);

  const isUpdating = useCallback((layer: number) => {
    return isLayerUpdating(courseId, layer);
  }, [courseId, isLayerUpdating]);

  return {
    progress: currentProgress,
    loading,
    error,
    updateLayer,
    isUpdating,
    refresh
  };
}
