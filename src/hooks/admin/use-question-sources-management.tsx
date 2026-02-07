'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '@/lib/api-services';
import { QuestionSource, QuestionSourceFilters, PaginationParams, CreateQuestionSourceRequest, UpdateQuestionSourceRequest } from '@/types/api';
import { toast } from 'sonner';

// Question sources filters interface
export interface QuestionSourcesFilters extends QuestionSourceFilters {
  page?: number;
  limit?: number;
}

// Question sources management state interface
interface QuestionSourcesManagementState {
  questionSources: QuestionSource[];
  totalQuestionSources: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: QuestionSourcesFilters;
}

// Hook for managing question sources
export function useQuestionSourcesManagement() {
  const [state, setState] = useState<QuestionSourcesManagementState>({
    questionSources: [],
    totalQuestionSources: 0,
    currentPage: 1,
    totalPages: 0,
    loading: true,
    error: null,
    filters: {
      search: '',
      page: 1,
      limit: 10,
    },
  });

  // Fetch question sources with current filters and pagination
  const fetchQuestionSources = useCallback(async (page: number = 1, limit: number = 10, filters?: QuestionSourcesFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Use provided filters or current state filters
      const currentFilters = filters || state.filters;

      const params: PaginationParams & QuestionSourceFilters = {
        page,
        limit,
        search: currentFilters.search,
      };

      // Clean up empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === undefined) {
          delete params[key as keyof typeof params];
        }
      });

      const response = await AdminService.getQuestionSources(params);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          questionSources: response.data.items || [],
          totalQuestionSources: response.data.total,
          currentPage: response.data.page,
          totalPages: response.data.totalPages,
          loading: false,
          error: null,
          filters: { ...currentFilters, page, limit },
        }));
      } else {
        throw new Error(response.error?.toString() || 'Failed to fetch question sources');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question sources';
      console.error('❌ Error fetching question sources:', error);

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast.error('Error', {
        description: errorMessage,
      });
    }
  }, [state.filters]);

  // Refresh question sources (re-fetch with current filters)
  const refreshQuestionSources = useCallback(() => {
    fetchQuestionSources(state.currentPage, state.filters.limit || 10, state.filters);
  }, [fetchQuestionSources, state.currentPage, state.filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<QuestionSourcesFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        search: '',
        page: 1,
        limit: 10,
      },
    }));
  }, []);

  // Create question source
  const createQuestionSource = useCallback(async (data: CreateQuestionSourceRequest) => {
    try {
      const response = await AdminService.createQuestionSource(data);

      if (response.success) {
        toast.success('Success', {
          description: 'Question source created successfully',
        });

        // Refresh the list
        await refreshQuestionSources();
        return response.data;
      } else {
        throw new Error(response.error?.toString() || 'Failed to create question source');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create question source';
      console.error('❌ Error creating question source:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestionSources]);

  // Update question source
  const updateQuestionSource = useCallback(async (id: number, data: UpdateQuestionSourceRequest) => {
    try {
      const response = await AdminService.updateQuestionSource(id, data);

      if (response.success) {
        toast.success('Success', {
          description: 'Question source updated successfully',
        });

        // Refresh the list
        await refreshQuestionSources();
        return response.data;
      } else {
        throw new Error(response.error?.toString() || 'Failed to update question source');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question source';
      console.error('❌ Error updating question source:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestionSources]);

  // Delete question source
  const deleteQuestionSource = useCallback(async (id: number) => {
    try {
      const response = await AdminService.deleteQuestionSource(id);

      if (response.success) {
        toast.success('Success', {
          description: 'Question source deleted successfully',
        });

        // Refresh the list
        await refreshQuestionSources();
        return response.data;
      } else {
        throw new Error(response.error?.toString() || 'Failed to delete question source');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete question source';
      console.error('❌ Error deleting question source:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestionSources]);

  // Load question sources on mount
  useEffect(() => {
    fetchQuestionSources(1, 10, state.filters);
  }, []);

  // Reload question sources when filters change
  useEffect(() => {
    if (state.filters.search !== undefined) {
      fetchQuestionSources(1, state.filters.limit || 10, state.filters);
    }
  }, [state.filters.search]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchQuestionSources(page, state.filters.limit || 10, state.filters);
    }
  }, [fetchQuestionSources, state.totalPages, state.filters]);

  return {
    // State
    questionSources: state.questionSources,
    totalQuestionSources: state.totalQuestionSources,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loading: state.loading,
    error: state.error,
    filters: state.filters,

    // Actions
    fetchQuestionSources,
    refreshQuestionSources,
    updateFilters,
    clearFilters,
    createQuestionSource,
    updateQuestionSource,
    deleteQuestionSource,
    goToPage,

    // Helper flags
    hasQuestionSources: state.questionSources.length > 0,
    hasError: !!state.error,
    hasFilters: Object.values(state.filters).some(value =>
      value !== '' && value !== undefined && value !== 1 && value !== 10
    ),
  };
}

// Export types
export type { QuestionSourcesManagementState };
