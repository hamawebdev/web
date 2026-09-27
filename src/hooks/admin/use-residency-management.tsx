'use client';

import { useState, useEffect, useCallback } from 'react';
import { ResidencyQuestionsService } from '@/lib/api-services';
import {
  ResidencyQuestion,
  ResidencyQuestionFilters,
  ResidencyQuestionsResponse,
  PaginationParams,
  CreateResidencyQuestionRequest,
  UpdateResidencyQuestionRequest
} from '@/types/api';
import { toast } from 'sonner';

// Residency management state interface
interface ResidencyManagementState {
  questions: ResidencyQuestion[];
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ResidencyQuestionFilters;
}

// Hook for managing residency questions
export function useResidencyManagement() {
  const [state, setState] = useState<ResidencyManagementState>({
    questions: [],
    totalQuestions: 0,
    currentPage: 1,
    totalPages: 0,
    loading: true,
    error: null,
    filters: {
      search: '',
      part: undefined,
      examYear: undefined,
      universityId: undefined,
    },
  });

  // Fetch residency questions with current filters and pagination
  const fetchQuestions = useCallback(async (page: number = 1, limit: number = 20, filters?: ResidencyQuestionFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Use provided filters or current state filters
      const currentFilters = filters || state.filters;

      const params: PaginationParams & ResidencyQuestionFilters = {
        page,
        limit,
        ...currentFilters,
      };

      // Clean up empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '' || params[key as keyof typeof params] === undefined) {
          delete params[key as keyof typeof params];
        }
      });

      console.log('🔍 Fetching residency questions with params:', params);

      const response = await ResidencyQuestionsService.getResidencyQuestions(params);

      if (response.success && response.data) {
        console.log('✅ Residency questions fetched successfully:', response.data);

        // API returns: { questions: [...], pagination: { currentPage, totalPages, total, limit } }
        const questions = response.data.questions || [];
        const pagination = response.data.pagination || { currentPage: page, totalPages: 0, total: 0, limit };

        setState(prev => ({
          ...prev,
          questions,
          totalQuestions: pagination.total,
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          loading: false,
          error: null,
          filters: currentFilters,
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch residency questions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch residency questions';
      console.error('❌ Error fetching residency questions:', error);

      setState(prev => ({
        ...prev,
        questions: [],
        totalQuestions: 0,
        currentPage: 1,
        totalPages: 0,
        loading: false,
        error: errorMessage,
      }));

      toast.error('Error', {
        description: errorMessage,
      });
    }
  }, [state.filters]);

  // Refresh questions (reload current page)
  const refreshQuestions = useCallback(() => {
    fetchQuestions(state.currentPage, 20, state.filters);
  }, [fetchQuestions, state.currentPage, state.filters]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ResidencyQuestionFilters>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
      },
    }));
    // Fetch with new filters starting from page 1
    fetchQuestions(1, 20, {
      ...state.filters,
      ...newFilters,
    });
  }, [fetchQuestions, state.filters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const emptyFilters: ResidencyQuestionFilters = {
      search: '',
      part: undefined,
      examYear: undefined,
      universityId: undefined,
    };
    setState(prev => ({
      ...prev,
      filters: emptyFilters,
    }));
    fetchQuestions(1, 20, emptyFilters);
  }, [fetchQuestions]);

  // Get single residency question
  const getQuestion = useCallback(async (id: number) => {
    try {
      console.log('🔍 Fetching residency question:', id);

      const response = await ResidencyQuestionsService.getResidencyQuestion(id);

      // The service wraps the raw question body, so response.data is the question itself
      if (response.success && response.data) {
        console.log('✅ Residency question fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch residency question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch residency question';
      console.error('❌ Error fetching residency question:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, []);

  // Create residency question
  const createQuestion = useCallback(async (questionData: CreateResidencyQuestionRequest) => {
    try {
      console.log('🔄 Creating residency question:', questionData);

      // apiClient throws on non-2xx; the service wraps the raw 201 body as { success, data }
      const response = await ResidencyQuestionsService.createResidencyQuestion(questionData);

      if (response.success && response.data) {
        console.log('✅ Residency question created successfully:', response.data);
        
        toast.success('Success', {
          description: 'Residency question created successfully',
        });
        if (response.imageUploadError) {
          toast.warning('Images not saved', { description: response.imageUploadError });
        }

        // Refresh the question list
        await fetchQuestions(state.currentPage, 20, state.filters);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create residency question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create residency question';
      console.error('❌ Error creating residency question:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchQuestions, state.currentPage, state.filters]);

  // Update residency question
  const updateQuestion = useCallback(async (id: number, questionData: UpdateResidencyQuestionRequest) => {
    try {
      console.log('🔄 Updating residency question:', id, questionData);

      const response = await ResidencyQuestionsService.updateResidencyQuestion(id, questionData);

      if (response.success && response.data) {
        console.log('✅ Residency question updated successfully:', response.data);
        
        toast.success('Success', {
          description: 'Residency question updated successfully',
        });
        if (response.imageUploadError) {
          toast.warning('Images not saved', { description: response.imageUploadError });
        }

        // Refresh the question list
        await refreshQuestions();
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update residency question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update residency question';
      console.error('❌ Error updating residency question:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestions]);

  // Delete residency question
  const deleteQuestion = useCallback(async (id: number) => {
    try {
      console.log('🔄 Deleting residency question:', id);

      const response = await ResidencyQuestionsService.deleteResidencyQuestion(id);

      if (response.success) {
        console.log('✅ Residency question deleted successfully');
        
        toast.success('Success', {
          description: 'Residency question deleted successfully',
        });

        // Refresh the question list
        await refreshQuestions();
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete residency question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete residency question';
      console.error('❌ Error deleting residency question:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestions]);

  // Load questions on mount
  useEffect(() => {
    fetchQuestions(1, 20, state.filters);
  }, []);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchQuestions(page, 20, state.filters);
    }
  }, [fetchQuestions, state.totalPages, state.filters]);

  return {
    // State
    questions: state.questions,
    totalQuestions: state.totalQuestions,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loading: state.loading,
    error: state.error,
    filters: state.filters,

    // Actions
    fetchQuestions,
    refreshQuestions,
    updateFilters,
    clearFilters,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    goToPage,

    // Helper flags
    hasQuestions: state.questions.length > 0,
    hasError: !!state.error,
    hasFilters: Object.values(state.filters).some(value => value !== '' && value !== undefined),
  };
}

// Export types
export type { ResidencyManagementState, ResidencyQuestionFilters };

