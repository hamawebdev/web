// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner, FullPageLoading } from '@/components/loading-states';
import { ErrorBoundary } from '@/components/error-boundary';

import {
  ArrowLeft,
  BookOpen,
  Target,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { NewApiService } from '@/lib/api/new-api-services';
import { StudyCard, CardProgressResponse, CourseProgressDetails } from '@/types/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
// Note: Using manual collapsible implementation since @/components/ui/collapsible may not exist
// We'll implement this inline or use a different approach

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  className?: string;
  color?: string;
}

function CircularProgress({
  value,
  size = 100,
  strokeWidth = 10,
  label,
  className,
  color
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Determine color based on label or use provided color
  const getProgressColor = () => {
    if (color) return color;

    switch (label) {
      case 'Couche 1':
        return '#f97316'; // Orange
      case 'Couche 2':
        return '#eab308'; // Yellow
      case 'Couche 3':
        return '#3b82f6'; // Blue
      case 'Couche QCM':
        return '#8b5cf6'; // Purple
      default:
        return '#10b981'; // Green
    }
  };

  const progressColor = getProgressColor();

  return (
    <div className={cn("flex flex-col items-center space-y-3", className)}>
      <div className="relative">
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 drop-shadow-sm"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
            opacity={0.3}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: progressColor }}>
            {Math.round(value)}%
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold text-center" style={{ color: progressColor }}>
        {label}
      </span>
    </div>
  );
}

interface CourseItemProps {
  course: CourseProgressDetails;
  onLayerToggle: (courseId: number, layerNumber: number, completed: boolean) => void;
  checkboxLoadingStates: Record<string, boolean>;
  optimisticUpdates: Record<string, boolean>;
}

function CourseItem({ course, onLayerToggle, checkboxLoadingStates, optimisticUpdates }: CourseItemProps) {
  const handleLayerChange = (layerNumber: number, checked: boolean) => {
    onLayerToggle(course.courseId, layerNumber, checked);
  };

  // Helper function to get the current checkbox state (optimistic or actual)
  const getCheckboxState = (layerNumber: number): boolean => {
    const checkboxKey = `${course.courseId}-${layerNumber}`;

    // If there's an optimistic update, use that
    if (checkboxKey in optimisticUpdates) {
      return optimisticUpdates[checkboxKey];
    }

    // Otherwise use the actual data
    switch (layerNumber) {
      case 1: return course.layerProgress.layer1;
      case 2: return course.layerProgress.layer2;
      case 3: return course.layerProgress.layer3;
      case 4: return course.layerProgress.qcmLayer;
      default: return false;
    }
  };

  // Helper function to check if a checkbox is loading
  const isCheckboxLoading = (layerNumber: number): boolean => {
    const checkboxKey = `${course.courseId}-${layerNumber}`;
    return checkboxLoadingStates[checkboxKey] || false;
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground truncate">
          {course.courseName}
        </h4>
        <div className="flex items-center space-x-2 mt-1">
          <Progress value={course.progressPercentage} className="flex-1 h-2" />
          <span className="text-xs text-muted-foreground font-medium min-w-[3rem]">
            {Math.round(course.progressPercentage)}%
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 ml-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Checkbox
              id={`c1-${course.courseId}`}
              checked={getCheckboxState(1)}
              onCheckedChange={(checked) => handleLayerChange(1, checked as boolean)}
              disabled={isCheckboxLoading(1)}
              className={cn(
                "size-7 border-2 transition-all duration-200 shadow-sm hover:shadow-md",
                getCheckboxState(1)
                  ? "border-green-500 bg-green-500 hover:bg-green-600 shadow-green-200"
                  : "border-orange-400 hover:border-orange-500 hover:bg-orange-50 shadow-orange-100",
                isCheckboxLoading(1) && "opacity-50"
              )}
            />
            {isCheckboxLoading(1) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="xs" />
              </div>
            )}
          </div>
          <label
            htmlFor={`c1-${course.courseId}`}
            className="text-sm font-semibold cursor-pointer text-orange-600 hover:text-orange-700 transition-colors"
          >
            C1
          </label>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Checkbox
              id={`c2-${course.courseId}`}
              checked={getCheckboxState(2)}
              onCheckedChange={(checked) => handleLayerChange(2, checked as boolean)}
              disabled={isCheckboxLoading(2)}
              className={cn(
                "size-7 border-2 transition-all duration-200 shadow-sm hover:shadow-md",
                getCheckboxState(2)
                  ? "border-green-500 bg-green-500 hover:bg-green-600 shadow-green-200"
                  : "border-yellow-400 hover:border-yellow-500 hover:bg-yellow-50 shadow-yellow-100",
                isCheckboxLoading(2) && "opacity-50"
              )}
            />
            {isCheckboxLoading(2) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="xs" />
              </div>
            )}
          </div>
          <label
            htmlFor={`c2-${course.courseId}`}
            className="text-sm font-semibold cursor-pointer text-yellow-600 hover:text-yellow-700 transition-colors"
          >
            C2
          </label>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Checkbox
              id={`c3-${course.courseId}`}
              checked={getCheckboxState(3)}
              onCheckedChange={(checked) => handleLayerChange(3, checked as boolean)}
              disabled={isCheckboxLoading(3)}
              className={cn(
                "size-7 border-2 transition-all duration-200 shadow-sm hover:shadow-md",
                getCheckboxState(3)
                  ? "border-green-500 bg-green-500 hover:bg-green-600 shadow-green-200"
                  : "border-blue-400 hover:border-blue-500 hover:bg-blue-50 shadow-blue-100",
                isCheckboxLoading(3) && "opacity-50"
              )}
            />
            {isCheckboxLoading(3) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="xs" />
              </div>
            )}
          </div>
          <label
            htmlFor={`c3-${course.courseId}`}
            className="text-sm font-semibold cursor-pointer text-blue-600 hover:text-blue-700 transition-colors"
          >
            C3
          </label>
        </div>

        <div className="flex flex-col items-center space-y-2">
          <div className="relative">
            <Checkbox
              id={`qcm-${course.courseId}`}
              checked={getCheckboxState(4)}
              onCheckedChange={(checked) => handleLayerChange(4, checked as boolean)}
              disabled={isCheckboxLoading(4)}
              className={cn(
                "size-7 border-2 transition-all duration-200 shadow-sm hover:shadow-md",
                getCheckboxState(4)
                  ? "border-green-500 bg-green-500 hover:bg-green-600 shadow-green-200"
                  : "border-purple-400 hover:border-purple-500 hover:bg-purple-50 shadow-purple-100",
                isCheckboxLoading(4) && "opacity-50"
              )}
            />
            {isCheckboxLoading(4) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="xs" />
              </div>
            )}
          </div>
          <label
            htmlFor={`qcm-${course.courseId}`}
            className="text-sm font-semibold cursor-pointer text-purple-600 hover:text-purple-700 transition-colors"
          >
            QCM
          </label>
        </div>
      </div>
    </div>
  );
}

export default function TrackerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const trackerId = parseInt(params.id as string);

  const [tracker, setTracker] = useState<StudyCard | null>(null);
  const [progress, setProgress] = useState<CardProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for individual checkbox loading and optimistic updates
  const [checkboxLoadingStates, setCheckboxLoadingStates] = useState<Record<string, boolean>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({});



  // Fetch tracker details and progress (with global loading)
  const fetchTrackerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tracker details
      const trackerResponse = await NewApiService.getCardById(trackerId);
      if (!trackerResponse.success || !trackerResponse.data) {
        throw new Error(trackerResponse.error || 'Failed to fetch tracker');
      }

      setTracker(trackerResponse.data);

      // Fetch progress
      const progressResponse = await NewApiService.getCardProgress(trackerId);
      console.log('📊 [TrackerDetailPage] Progress response:', {
        success: progressResponse.success,
        hasData: !!progressResponse.data,
        dataKeys: progressResponse.data ? Object.keys(progressResponse.data) : 'no data',
        totalCourses: progressResponse.data?.totalCourses,
        courseProgressCount: progressResponse.data?.courseProgress?.length || 0,
        courseProgressExists: !!progressResponse.data?.courseProgress,
        courseProgressType: typeof progressResponse.data?.courseProgress,
        courseProgressIsArray: Array.isArray(progressResponse.data?.courseProgress),
        firstCourse: progressResponse.data?.courseProgress?.[0] || 'no courses',
        // Check for nested structure
        hasNestedData: !!progressResponse.data?.data,
        nestedDataKeys: progressResponse.data?.data ? Object.keys(progressResponse.data.data) : 'no nested data',
        nestedCourseProgress: progressResponse.data?.data?.courseProgress,
        nestedCoursesCount: progressResponse.data?.data?.courseProgress?.length || 0,
        fullProgressData: progressResponse.data
      });

      if (progressResponse.success && progressResponse.data) {
        // Handle potential nested response structure like other APIs
        const actualProgressData = progressResponse.data?.data || progressResponse.data;
        console.log('📊 [TrackerDetailPage] Using progress data:', {
          isNested: !!progressResponse.data?.data,
          actualTotalCourses: actualProgressData?.totalCourses,
          actualCourseProgressCount: actualProgressData?.courseProgress?.length || 0,
          actualProgressData
        });
        setProgress(actualProgressData);
      } else {
        console.warn('⚠️ [TrackerDetailPage] No progress data received:', progressResponse);
      }
    } catch (err) {
      console.error('Error fetching tracker data:', err);
      setError('Failed to load tracker details');
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh function without global loading (for checkbox updates)
  const refreshProgressData = async () => {
    try {
      console.log('🔄 [TrackerDetailPage] Refreshing progress data silently...');

      // Fetch progress without setting global loading state
      const progressResponse = await NewApiService.getCardProgress(trackerId);

      if (progressResponse.success && progressResponse.data) {
        const actualProgressData = progressResponse.data?.data || progressResponse.data;
        setProgress(actualProgressData);

        // Clear any optimistic updates since we now have fresh data
        setOptimisticUpdates({});

        console.log('✅ [TrackerDetailPage] Progress data refreshed silently');
      } else {
        console.warn('⚠️ [TrackerDetailPage] Failed to refresh progress data:', progressResponse);
      }
    } catch (err) {
      console.error('💥 [TrackerDetailPage] Error refreshing progress data:', err);
      // Don't throw error here to avoid breaking the UI
    }
  };

  useEffect(() => {
    if (trackerId) {
      fetchTrackerData();
    }
  }, [trackerId]);

  const handleBack = () => {
    router.back();
  };




  const handleLayerToggle = async (courseId: number, layerNumber: number, completed: boolean) => {
    const checkboxKey = `${courseId}-${layerNumber}`;

    try {
      console.log(`🎯 [TrackerDetailPage] Toggling layer ${layerNumber} for course ${courseId} to ${completed}`);

      // 1. Optimistic update - immediately update the UI
      setOptimisticUpdates(prev => ({
        ...prev,
        [checkboxKey]: completed
      }));

      // 2. Set loading state for this specific checkbox
      setCheckboxLoadingStates(prev => ({
        ...prev,
        [checkboxKey]: true
      }));

      // 3. Make the API call
      const response = await NewApiService.upsertCourseLayer({
        courseId,
        layerNumber,
        completed
      });

      if (response.success) {
        // 4. Success - refresh progress data silently (no global loading)
        await refreshProgressData();
        toast.success(`Couche ${layerNumber} ${completed ? 'complétée' : 'marquée comme incomplète'}`);

        console.log(`✅ [TrackerDetailPage] Successfully updated layer ${layerNumber} for course ${courseId}`);
      } else {
        throw new Error(response.error || 'Failed to update layer');
      }
    } catch (err) {
      console.error(`💥 [TrackerDetailPage] Error updating layer ${layerNumber} for course ${courseId}:`, err);

      // 5. Error - revert the optimistic update
      setOptimisticUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[checkboxKey];
        return newUpdates;
      });

      toast.error('Erreur lors de la mise à jour de la couche');
    } finally {
      // 6. Clear loading state for this checkbox
      setCheckboxLoadingStates(prev => {
        const newStates = { ...prev };
        delete newStates[checkboxKey];
        return newStates;
      });
    }
  };



  if (loading) {
    return <FullPageLoading message="Chargement du suivi de cours..." />;
  }

  if (error || !tracker) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error || 'Suivi de cours introuvable'}</p>
            <Button onClick={() => router.back()}>
              Retourner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  // Calculate layer progress percentages
  const totalCourses = progress?.totalCourses || 0;
  const layerStats = progress?.courseProgress?.reduce((acc, course) => {
    if (course.layerProgress.layer1) acc.c1++;
    if (course.layerProgress.layer2) acc.c2++;
    if (course.layerProgress.layer3) acc.c3++;
    if (course.layerProgress.qcmLayer) acc.qcm++;
    return acc;
  }, { c1: 0, c2: 0, c3: 0, qcm: 0 }) || { c1: 0, c2: 0, c3: 0, qcm: 0 };

  const layerPercentages = {
    c1: totalCourses > 0 ? (layerStats.c1 / totalCourses) * 100 : 0,
    c2: totalCourses > 0 ? (layerStats.c2 / totalCourses) * 100 : 0,
    c3: totalCourses > 0 ? (layerStats.c3 / totalCourses) * 100 : 0,
    qcm: totalCourses > 0 ? (layerStats.qcm / totalCourses) * 100 : 0,
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retourner
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {tracker.title}
              </h1>
              {tracker.description && (
                <p className="text-muted-foreground mt-2">
                  {tracker.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Progress Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Résumé des progrès</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <CircularProgress
                value={layerPercentages.c1}
                label="Couche 1"
              />
              <CircularProgress
                value={layerPercentages.c2}
                label="Couche 2"
              />
              <CircularProgress
                value={layerPercentages.c3}
                label="Couche 3"
              />
              <CircularProgress
                value={layerPercentages.qcm}
                label="Couche QCM"
              />
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {totalCourses} cours au total
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Progrès global: {Math.round(progress?.cardProgressPercentage || 0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span>Liste des cours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!progress?.courseProgress || progress.courseProgress.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun cours trouvé dans ce suivi.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {progress.courseProgress.map((course) => (
                  <CourseItem
                    key={course.courseId}
                    course={course}
                    onLayerToggle={handleLayerToggle}
                    checkboxLoadingStates={checkboxLoadingStates}
                    optimisticUpdates={optimisticUpdates}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </ErrorBoundary>
  );
}
