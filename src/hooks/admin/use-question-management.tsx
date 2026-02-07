'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '@/lib/api-services';
import { AdminQuestion, AdminQuestionFilters, PaginatedResponse, PaginationParams, CreateQuestionRequest, UpdateQuestionRequest } from '@/types/api';
import { toast } from 'sonner';

// Question management state interface
interface QuestionManagementState {
  questions: AdminQuestion[];
  totalQuestions: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: AdminQuestionFilters;
}

// Hook for managing questions
export function useQuestionManagement() {
  const [state, setState] = useState<QuestionManagementState>({
    questions: [],
    totalQuestions: 0,
    currentPage: 1,
    totalPages: 0,
    loading: true,
    error: null,
    filters: {
      search: '',
      courseId: undefined,
      moduleId: undefined,
      unitId: undefined,
      studyPackId: undefined,
      universityId: undefined,
      examId: undefined,
      questionType: undefined,
      yearLevel: undefined,
      examYear: undefined,
      rotation: undefined,
      sourceId: undefined,
      isActive: undefined,
    },
  });

  // Fetch questions with current filters and pagination
  const fetchQuestions = useCallback(async (page: number = 1, limit: number = 20, filters?: AdminQuestionFilters) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Use provided filters or current state filters
      const currentFilters = filters || state.filters;

      const params: PaginationParams & AdminQuestionFilters = {
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

      console.log('🔍 Fetching questions with params:', params);

      const response = await AdminService.getQuestions(params);
      console.log('🔍 Raw API response:', response);

      if (response.success && response.data) {
        // Handle the response structure safely
        const responseData = response.data.data || response.data;
        const rawQuestions = responseData.items || responseData.questions || [];

        // Normalize the questions data structure
        const questions = rawQuestions.map(question => ({
          ...question,
          // Ensure answers field exists (API returns questionAnswers)
          answers: question.questionAnswers || question.answers || [],
          // Keep original questionAnswers for compatibility
          questionAnswers: question.questionAnswers || question.answers || []
        }));

        // Extract pagination info from the response data
        const total = responseData.total || 0;
        const currentPage = responseData.page || 1;
        const totalPages = responseData.totalPages || 1;

        setState(prev => ({
          ...prev,
          questions,
          totalQuestions: total,
          currentPage: currentPage,
          totalPages: totalPages,
          loading: false,
          error: null,
        }));

        console.log('✅ Questions fetched successfully:', {
          count: questions.length,
          total: total,
          page: currentPage,
          totalPages: totalPages,
          responseStructure: Object.keys(responseData)
        });
      } else {
        console.error('❌ API response not successful:', response);
        throw new Error(response.error || 'Failed to fetch questions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de charger les questions.';
      console.error('❌ Error fetching questions:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });

      setState(prev => ({
        ...prev,
        questions: [],
        totalQuestions: 0,
        currentPage: 1,
        totalPages: 0,
        loading: false,
        error: errorMessage,
      }));

      toast.error('Erreur', {
        description: errorMessage,
      });
    }
  }, []); // Remove state.filters dependency

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AdminQuestionFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      currentPage: 1, // Reset to first page when filters change
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {
        search: '',
        courseId: undefined,
        moduleId: undefined,
        unitId: undefined,
        studyPackId: undefined,
        universityId: undefined,
        examId: undefined,
        questionType: undefined,
        yearLevel: undefined,
        examYear: undefined,
        rotation: undefined,
        sourceId: undefined,
        isActive: undefined,
      },
      currentPage: 1,
    }));
  }, []);

  // Get single question
  const getQuestion = useCallback(async (questionId: number) => {
    try {
      console.log('🔄 Fetching question:', questionId);

      const response = await AdminService.getQuestion(questionId);

      if (response.success && response.data) {
        console.log('✅ Question fetched successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question';
      console.error('❌ Error fetching question:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, []);

  // Create question
  const createQuestion = useCallback(async (questionData: CreateQuestionRequest) => {
    try {
      console.log('🔄 Creating question:', questionData);

      const response = await AdminService.createQuestion(questionData);

      if (response.success && response.data) {
        console.log('✅ Question created successfully:', response.data);
        
        toast.success('Success', {
          description: 'Question created successfully',
        });

        // Refresh the question list
        await fetchQuestions(state.currentPage);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create question';
      console.error('❌ Error creating question:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [fetchQuestions, state.currentPage]);

  // Update question
  const updateQuestion = useCallback(async (questionId: number, questionData: UpdateQuestionRequest) => {
    try {
      console.log('🔄 Updating question:', { questionId, questionData });

      const response = await AdminService.updateQuestion(questionId, questionData);

      if (response.success && response.data) {
        console.log('✅ Question updated successfully:', response.data);
        
        toast.success('Success', {
          description: 'Question updated successfully',
        });

        // Refresh the question list
        await fetchQuestions(state.currentPage);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question';
      console.error('❌ Error updating question:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [fetchQuestions, state.currentPage]);

  // Delete question
  const deleteQuestion = useCallback(async (questionId: number) => {
    try {
      console.log('🔄 Deleting question:', questionId);

      const response = await AdminService.deleteQuestion(questionId);

      if (response.success && response.data) {
        console.log('✅ Question deleted successfully:', response.data);
        
        toast.success('Success', {
          description: 'Question deleted successfully',
        });

        // Refresh the question list
        await fetchQuestions(state.currentPage);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to delete question');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete question';
      console.error('❌ Error deleting question:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [fetchQuestions, state.currentPage]);

  // Refresh questions (reload current page)
  const refreshQuestions = useCallback(async () => {
    await fetchQuestions(state.currentPage, 20, state.filters);
  }, [fetchQuestions, state.currentPage, state.filters]);

  // Update question explanation
  const updateQuestionExplanation = useCallback(async (questionId: number, explanation: string, explanationImages?: File[]) => {
    try {
      console.log('🔄 Updating question explanation:', questionId);

      const response = await AdminService.updateQuestionExplanation(questionId, {
        explanation,
        explanationImages,
      });

      if (response.success && response.data) {
        console.log('✅ Question explanation updated successfully:', response.data);
        
        toast.success('Success', {
          description: 'Question explanation updated successfully',
        });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update question explanation');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question explanation';
      console.error('❌ Error updating question explanation:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, []);

  // Update question images using new endpoint
  const updateQuestionImages = useCallback(async (questionId: number, questionImages?: File[], explanationImages?: File[]) => {
    try {
      console.log('🔄 Updating question images:', questionId);

      const promises: Promise<any>[] = [];

      // Update question images if provided
      if (questionImages && questionImages.length > 0) {
        promises.push(AdminService.updateQuestionImages(questionId, questionImages));
      }

      // Update explanation images if provided
      if (explanationImages && explanationImages.length > 0) {
        promises.push(AdminService.updateQuestionExplanationImages(questionId, explanationImages));
      }

      if (promises.length === 0) {
        throw new Error('No images provided for update');
      }

      const responses = await Promise.all(promises);

      // Check if all responses are successful
      const allSuccessful = responses.every(response => response.success);

      if (allSuccessful) {
        console.log('✅ Question images updated successfully');

        toast.success('Success', {
          description: 'Question images updated successfully',
        });

        // Refresh questions to get updated data
        await refreshQuestions();

        return responses;
      } else {
        const failedResponses = responses.filter(response => !response.success);
        throw new Error(failedResponses.map(r => r.error).join(', ') || 'Failed to update some images');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update question images';
      console.error('❌ Error updating question images:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [refreshQuestions]);

  // Load questions on mount
  useEffect(() => {
    fetchQuestions(1, 20, state.filters);
  }, [fetchQuestions]);

  // Reload questions when filters change
  useEffect(() => {
    fetchQuestions(1, 20, state.filters);
  }, [state.filters, fetchQuestions]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchQuestions(page);
    }
  }, [fetchQuestions, state.totalPages]);

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
    updateQuestionExplanation,
    updateQuestionImages,
    goToPage,

    // Helper flags
    hasQuestions: state.questions.length > 0,
    hasError: !!state.error,
    hasFilters: Object.values(state.filters).some(value => value !== '' && value !== undefined),
  };
}

// Export types
export type { QuestionManagementState, AdminQuestionFilters };
