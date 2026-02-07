/**
 * Course Tracking Utilities
 * Utility functions for calculating progress and managing course tracking data
 */

import { 
  CourseLayer, 
  CourseLayerProgress, 
  CourseProgressDetails, 
  CardProgressResponse,
  StudyCard,
  TrackerSummary
} from '@/types/api';

// ==================== PROGRESS CALCULATION ====================

/**
 * Calculate course progress percentage based on completed layers
 * Formula: (Completed Layers / Total Layers) * 100
 */
export function calculateCourseProgress(layerProgress: CourseLayerProgress): number {
  const totalLayers = 4; // C1, C2, C3, QCM
  const completedLayers = [
    layerProgress.layer1,
    layerProgress.layer2,
    layerProgress.layer3,
    layerProgress.qcmLayer
  ].filter(Boolean).length;

  return totalLayers > 0 ? (completedLayers / totalLayers) * 100 : 0;
}

/**
 * Calculate card progress as average of all course progress percentages
 * Formula: Sum of all course progress percentages / Number of courses
 */
export function calculateCardProgress(courseProgressList: CourseProgressDetails[]): number {
  if (!courseProgressList || courseProgressList.length === 0) {
    return 0;
  }

  const totalProgress = courseProgressList.reduce((sum, course) => {
    return sum + course.progressPercentage;
  }, 0);

  return totalProgress / courseProgressList.length;
}

/**
 * Calculate layer statistics for a card
 */
export function calculateLayerStats(courseProgressList: CourseProgressDetails[]) {
  const stats = {
    c1: { count: 0, percentage: 0 },
    c2: { count: 0, percentage: 0 },
    c3: { count: 0, percentage: 0 },
    qcm: { count: 0, percentage: 0 }
  };

  if (!courseProgressList || courseProgressList.length === 0) {
    return stats;
  }

  const totalCourses = courseProgressList.length;

  courseProgressList.forEach(course => {
    if (course.layerProgress.layer1) stats.c1.count++;
    if (course.layerProgress.layer2) stats.c2.count++;
    if (course.layerProgress.layer3) stats.c3.count++;
    if (course.layerProgress.qcmLayer) stats.qcm.count++;
  });

  stats.c1.percentage = (stats.c1.count / totalCourses) * 100;
  stats.c2.percentage = (stats.c2.count / totalCourses) * 100;
  stats.c3.percentage = (stats.c3.count / totalCourses) * 100;
  stats.qcm.percentage = (stats.qcm.count / totalCourses) * 100;

  return stats;
}

// ==================== DATA TRANSFORMATION ====================

/**
 * Transform course layers array to progress object
 */
export function transformLayersToProgress(layers: CourseLayer[]): CourseLayerProgress {
  const progress: CourseLayerProgress = {
    layer1: false,
    layer2: false,
    layer3: false,
    qcmLayer: false
  };

  layers.forEach(layer => {
    if (layer.isCompleted) {
      switch (layer.layerNumber) {
        case 1:
          progress.layer1 = true;
          break;
        case 2:
          progress.layer2 = true;
          break;
        case 3:
          progress.layer3 = true;
          break;
        case 4:
          progress.qcmLayer = true;
          break;
      }
    }
  });

  return progress;
}

/**
 * Create course progress details from course data and layers
 */
export function createCourseProgressDetails(
  courseId: number,
  courseName: string,
  layers: CourseLayer[]
): CourseProgressDetails {
  const layerProgress = transformLayersToProgress(layers);
  const progressPercentage = calculateCourseProgress(layerProgress);
  const completedLayers = layers.filter(layer => layer.isCompleted).length;

  return {
    courseId,
    courseName,
    progressPercentage,
    layerProgress,
    completedLayers,
    totalLayers: 4
  };
}

/**
 * Transform study card to tracker summary
 */
export function transformCardToTrackerSummary(
  card: StudyCard,
  progress?: CardProgressResponse,
  unitType: 'unite' | 'module' = 'module',
  unitId: number = 0,
  unitName: string = ''
): TrackerSummary {
  const courseCount = card.cardCourses?.length || 0;
  const layerStats = progress ? calculateLayerStats(progress.courseProgress) : {
    c1: { count: 0, percentage: 0 },
    c2: { count: 0, percentage: 0 },
    c3: { count: 0, percentage: 0 },
    qcm: { count: 0, percentage: 0 }
  };

  return {
    id: card.id,
    title: card.title,
    description: card.description,
    unitType,
    unitId,
    unitName,
    courseCount,
    progressBreakdown: layerStats,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt
  };
}

// ==================== VALIDATION ====================

/**
 * Validate layer number (must be 1-4)
 */
export function isValidLayerNumber(layerNumber: number): boolean {
  return layerNumber >= 1 && layerNumber <= 4;
}

/**
 * Validate course tracking data
 */
export function validateCourseTrackingData(data: {
  courseId?: number;
  layerNumber?: number;
  completed?: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.courseId || data.courseId <= 0) {
    errors.push('Course ID is required and must be positive');
  }

  if (data.layerNumber !== undefined && !isValidLayerNumber(data.layerNumber)) {
    errors.push('Layer number must be between 1 and 4');
  }

  if (data.completed === undefined) {
    errors.push('Completed status is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==================== FORMATTING ====================

/**
 * Format progress percentage for display
 */
export function formatProgressPercentage(percentage: number, decimals: number = 0): string {
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format layer name for display
 */
export function formatLayerName(layerNumber: number): string {
  switch (layerNumber) {
    case 1:
      return 'Couche 1';
    case 2:
      return 'Couche 2';
    case 3:
      return 'Couche 3';
    case 4:
      return 'Couche QCM';
    default:
      return `Couche ${layerNumber}`;
  }
}

/**
 * Format layer abbreviation for display
 */
export function formatLayerAbbreviation(layerNumber: number): string {
  switch (layerNumber) {
    case 1:
      return 'C1';
    case 2:
      return 'C2';
    case 3:
      return 'C3';
    case 4:
      return 'QCM';
    default:
      return `C${layerNumber}`;
  }
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-yellow-600';
  if (percentage >= 40) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get progress badge variant based on percentage
 */
export function getProgressBadgeVariant(percentage: number): 'default' | 'secondary' | 'destructive' {
  if (percentage >= 70) return 'default';
  if (percentage >= 40) return 'secondary';
  return 'destructive';
}

// ==================== SORTING AND FILTERING ====================

/**
 * Sort courses by progress (highest first)
 */
export function sortCoursesByProgress(courses: CourseProgressDetails[]): CourseProgressDetails[] {
  return [...courses].sort((a, b) => b.progressPercentage - a.progressPercentage);
}

/**
 * Sort courses by name (alphabetical)
 */
export function sortCoursesByName(courses: CourseProgressDetails[]): CourseProgressDetails[] {
  return [...courses].sort((a, b) => a.courseName.localeCompare(b.courseName));
}

/**
 * Filter courses by completion status
 */
export function filterCoursesByCompletion(
  courses: CourseProgressDetails[], 
  completed: boolean
): CourseProgressDetails[] {
  return courses.filter(course => {
    const isCompleted = course.progressPercentage === 100;
    return completed ? isCompleted : !isCompleted;
  });
}

/**
 * Filter courses by specific layer completion
 */
export function filterCoursesByLayer(
  courses: CourseProgressDetails[], 
  layerNumber: number, 
  completed: boolean
): CourseProgressDetails[] {
  return courses.filter(course => {
    let layerCompleted = false;
    switch (layerNumber) {
      case 1:
        layerCompleted = course.layerProgress.layer1;
        break;
      case 2:
        layerCompleted = course.layerProgress.layer2;
        break;
      case 3:
        layerCompleted = course.layerProgress.layer3;
        break;
      case 4:
        layerCompleted = course.layerProgress.qcmLayer;
        break;
    }
    return completed ? layerCompleted : !layerCompleted;
  });
}

// ==================== EXPORT ====================

export const CourseTrackingUtils = {
  // Progress calculation
  calculateCourseProgress,
  calculateCardProgress,
  calculateLayerStats,
  
  // Data transformation
  transformLayersToProgress,
  createCourseProgressDetails,
  transformCardToTrackerSummary,
  
  // Validation
  isValidLayerNumber,
  validateCourseTrackingData,
  
  // Formatting
  formatProgressPercentage,
  formatLayerName,
  formatLayerAbbreviation,
  getProgressColor,
  getProgressBadgeVariant,
  
  // Sorting and filtering
  sortCoursesByProgress,
  sortCoursesByName,
  filterCoursesByCompletion,
  filterCoursesByLayer
};
