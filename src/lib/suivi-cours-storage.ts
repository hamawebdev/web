// @ts-nocheck
/**
 * Local Storage Service for Suivi-Cours Tracking
 * 
 * Manages course IDs that are currently being tracked in suivi-cours
 * to prevent duplicate course selection across multiple trackers.
 */

interface TrackedCourse {
  courseId: number;
  trackerId: number;
  trackerTitle: string;
  addedAt: Date;
}

interface SuiviCoursStorageMetadata {
  lastUpdated: Date;
  version: number;
}

class SuiviCoursStorageService {
  private readonly STORAGE_KEY = 'suivi_cours_tracked_courses';
  private readonly METADATA_KEY = 'suivi_cours_storage_metadata';
  private readonly STORAGE_VERSION = 1;

  /**
   * Get all tracked courses from localStorage
   */
  getTrackedCourses(): TrackedCourse[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return [];
      }

      const courses = JSON.parse(data, this.dateReviver) as TrackedCourse[];
      return Array.isArray(courses) ? courses : [];
    } catch (error) {
      console.error('Failed to load tracked courses:', error);
      return [];
    }
  }

  /**
   * Save tracked courses to localStorage
   */
  private saveTrackedCourses(courses: TrackedCourse[]): void {
    try {
      const data = JSON.stringify(courses, this.dateReplacer);
      localStorage.setItem(this.STORAGE_KEY, data);
      this.updateMetadata();
      console.log(`💾 Saved ${courses.length} tracked courses to localStorage`);
    } catch (error) {
      console.error('Failed to save tracked courses:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * Get array of tracked course IDs
   */
  getTrackedCourseIds(): number[] {
    return this.getTrackedCourses().map(course => course.courseId);
  }

  /**
   * Check if a course is already being tracked
   */
  isCourseTracked(courseId: number): boolean {
    return this.getTrackedCourseIds().includes(courseId);
  }

  /**
   * Get tracker info for a specific course
   */
  getTrackerForCourse(courseId: number): TrackedCourse | null {
    const courses = this.getTrackedCourses();
    return courses.find(course => course.courseId === courseId) || null;
  }

  /**
   * Add courses to tracking when a tracker is created
   */
  addTrackedCourses(trackerId: number, trackerTitle: string, courseIds: number[]): void {
    const existingCourses = this.getTrackedCourses();
    const newCourses: TrackedCourse[] = courseIds.map(courseId => ({
      courseId,
      trackerId,
      trackerTitle,
      addedAt: new Date()
    }));

    // Filter out any courses that are already tracked (shouldn't happen, but safety check)
    const filteredNewCourses = newCourses.filter(newCourse => 
      !existingCourses.some(existing => existing.courseId === newCourse.courseId)
    );

    if (filteredNewCourses.length > 0) {
      const updatedCourses = [...existingCourses, ...filteredNewCourses];
      this.saveTrackedCourses(updatedCourses);
      console.log(`📚 Added ${filteredNewCourses.length} courses to tracking for tracker ${trackerId}`);
    }
  }

  /**
   * Remove courses from tracking when a tracker is deleted
   */
  removeTrackedCourses(trackerId: number): void {
    const existingCourses = this.getTrackedCourses();
    const updatedCourses = existingCourses.filter(course => course.trackerId !== trackerId);
    
    const removedCount = existingCourses.length - updatedCourses.length;
    if (removedCount > 0) {
      this.saveTrackedCourses(updatedCourses);
      console.log(`🗑️ Removed ${removedCount} courses from tracking for deleted tracker ${trackerId}`);
    }
  }

  /**
   * Remove a specific course from tracking
   */
  removeCourseFromTracking(courseId: number): void {
    const existingCourses = this.getTrackedCourses();
    const updatedCourses = existingCourses.filter(course => course.courseId !== courseId);
    
    if (updatedCourses.length < existingCourses.length) {
      this.saveTrackedCourses(updatedCourses);
      console.log(`🗑️ Removed course ${courseId} from tracking`);
    }
  }

  /**
   * Sync localStorage with actual tracker data from API
   * This should be called periodically to ensure consistency
   */
  async syncWithTrackers(allTrackers: Array<{ id: number; title: string; courses: Array<{ id: number }> }>): Promise<void> {
    try {
      const newTrackedCourses: TrackedCourse[] = [];
      
      allTrackers.forEach(tracker => {
        tracker.courses?.forEach(course => {
          newTrackedCourses.push({
            courseId: course.id,
            trackerId: tracker.id,
            trackerTitle: tracker.title,
            addedAt: new Date() // We don't have the original date, so use current
          });
        });
      });

      this.saveTrackedCourses(newTrackedCourses);
      console.log(`🔄 Synced localStorage with ${newTrackedCourses.length} tracked courses from ${allTrackers.length} trackers`);
    } catch (error) {
      console.error('Failed to sync tracked courses:', error);
    }
  }

  /**
   * Clear all tracked courses (useful for testing or reset)
   */
  clearAllTrackedCourses(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.METADATA_KEY);
      console.log('🧹 Cleared all tracked courses from localStorage');
    } catch (error) {
      console.error('Failed to clear tracked courses:', error);
    }
  }

  /**
   * Debug function to log current state (useful for testing)
   */
  debugLogState(): void {
    const courses = this.getTrackedCourses();
    const stats = this.getStorageStats();

    console.log('📊 [SuiviCoursStorage] Current State:', {
      trackedCourses: courses,
      stats,
      courseIds: this.getTrackedCourseIds()
    });
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalTrackedCourses: number;
    uniqueTrackers: number;
    lastUpdated: Date | null;
    storageSize: number;
  } {
    const courses = this.getTrackedCourses();
    const metadata = this.getMetadata();
    const uniqueTrackers = new Set(courses.map(c => c.trackerId)).size;
    
    return {
      totalTrackedCourses: courses.length,
      uniqueTrackers,
      lastUpdated: metadata.lastUpdated,
      storageSize: this.calculateStorageSize()
    };
  }

  /**
   * Handle storage errors (quota exceeded, etc.)
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded for suivi-cours tracking');
      // For this feature, we don't need complex cleanup since the data is small
      // Just log the error and continue
    }
  }

  /**
   * Calculate storage size used by this service
   */
  private calculateStorageSize(): number {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const metadata = localStorage.getItem(this.METADATA_KEY);
      return (data?.length || 0) + (metadata?.length || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Get/update metadata
   */
  private getMetadata(): SuiviCoursStorageMetadata {
    try {
      const data = localStorage.getItem(this.METADATA_KEY);
      return data ? JSON.parse(data, this.dateReviver) : { lastUpdated: null, version: this.STORAGE_VERSION };
    } catch {
      return { lastUpdated: null, version: this.STORAGE_VERSION };
    }
  }

  private updateMetadata(): void {
    try {
      const metadata: SuiviCoursStorageMetadata = {
        lastUpdated: new Date(),
        version: this.STORAGE_VERSION
      };
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata, this.dateReplacer));
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  /**
   * JSON serialization helpers for Date objects
   */
  private dateReplacer(key: string, value: any): any {
    return value instanceof Date ? value.toISOString() : value;
  }

  private dateReviver(key: string, value: any): any {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return new Date(value);
    }
    return value;
  }
}

// Export singleton instance
export const suiviCoursStorage = new SuiviCoursStorageService();

// Export types for use in components
export type { TrackedCourse, SuiviCoursStorageMetadata };
