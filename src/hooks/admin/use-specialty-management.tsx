'use client';

import { useState, useEffect, useCallback } from 'react';
import { UniversityService } from '@/lib/api-services';
import { Specialty, PaginationParams } from '@/types/api';
import { toast } from 'sonner';

// Interface for specialty management state
interface SpecialtyManagementState {
  specialties: Specialty[];
  totalSpecialties: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: {
    search?: string;
  };
}

// Interface for specialty filters
interface SpecialtyFilters {
  search?: string;
}

// Hook for managing specialty data
export function useSpecialtyManagement() {
  const [state, setState] = useState<SpecialtyManagementState>({
    specialties: [],
    totalSpecialties: 0,
    currentPage: 1,
    totalPages: 1,
    loading: true,
    error: null,
    filters: {},
  });

  // Fetch specialties with pagination and filtering
  const fetchSpecialties = useCallback(async (page: number = 1, filters: SpecialtyFilters = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔍 Fetching specialties...', { page, filters });

      const params: PaginationParams & { search?: string } = {
        page,
        limit: 10,
        ...filters,
      };

      const response = await UniversityService.getSpecialties(params);

      if (response.success && response.data) {
        console.log('✅ Specialties fetched successfully:', response.data);

        const { specialties, pagination } = response.data;

        setState(prev => ({
          ...prev,
          specialties: specialties || [],
          totalSpecialties: pagination?.total || 0,
          currentPage: pagination?.page || 1,
          totalPages: pagination?.totalPages || 1,
          loading: false,
          error: null,
          filters,
        }));
      } else {
        throw new Error(response.error || 'Failed to fetch specialties');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch specialties';

      console.error('❌ Specialty fetch error:', error);

      setState(prev => ({
        ...prev,
        specialties: [],
        totalSpecialties: 0,
        currentPage: 1,
        totalPages: 1,
        loading: false,
        error: errorMessage,
      }));

      toast.error('Error', {
        description: errorMessage,
      });
    }
  }, []);

  // Create specialty
  const createSpecialty = useCallback(async (specialtyData: {
    name: string;
  }) => {
    try {
      console.log('🔄 Creating specialty:', specialtyData);

      const response = await UniversityService.createSpecialty(specialtyData);

      if (response.success && response.data) {
        console.log('✅ Specialty created successfully:', response.data);
        
        toast.success('Success', {
          description: 'Specialty created successfully',
        });

        // Refresh the specialty list
        await fetchSpecialties(state.currentPage, state.filters);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create specialty');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create specialty';
      
      console.error('❌ Create specialty error:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [state.currentPage, state.filters, fetchSpecialties]);

  // Update specialty
  const updateSpecialty = useCallback(async (specialtyId: number, updateData: {
    name?: string;
  }) => {
    try {
      console.log('🔄 Updating specialty:', { specialtyId, updateData });

      const response = await UniversityService.updateSpecialty(specialtyId, updateData);

      if (response.success && response.data) {
        console.log('✅ Specialty updated successfully:', response.data);
        
        toast.success('Success', {
          description: 'Specialty updated successfully',
        });

        // Refresh the specialty list
        await fetchSpecialties(state.currentPage, state.filters);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update specialty');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update specialty';
      
      console.error('❌ Update specialty error:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [state.currentPage, state.filters, fetchSpecialties]);

  // Delete specialty
  const deleteSpecialty = useCallback(async (specialtyId: number) => {
    try {
      console.log('🔄 Deleting specialty:', specialtyId);

      const response = await UniversityService.deleteSpecialty(specialtyId);

      if (response.success) {
        console.log('✅ Specialty deleted successfully');
        
        toast.success('Success', {
          description: 'Specialty deleted successfully',
        });

        // Refresh the specialty list
        await fetchSpecialties(state.currentPage, state.filters);
        
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete specialty');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete specialty';
      
      console.error('❌ Delete specialty error:', error);
      
      toast.error('Error', {
        description: errorMessage,
      });
      
      throw error;
    }
  }, [state.currentPage, state.filters, fetchSpecialties]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SpecialtyFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    fetchSpecialties(1, updatedFilters); // Reset to page 1 when filtering
  }, [state.filters, fetchSpecialties]);

  // Clear filters
  const clearFilters = useCallback(() => {
    fetchSpecialties(1, {}); // Reset to page 1 with no filters
  }, [fetchSpecialties]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchSpecialties(page, state.filters);
    }
  }, [state.totalPages, state.filters, fetchSpecialties]);

  // Initial load
  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  return {
    // Data
    specialties: state.specialties,
    totalSpecialties: state.totalSpecialties,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    
    // Actions
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    updateFilters,
    clearFilters,
    goToPage,
    
    // Helper flags
    hasSpecialties: state.specialties.length > 0,
    hasError: !!state.error,
    hasFilters: Object.keys(state.filters).some(key => state.filters[key as keyof SpecialtyFilters]),
  };
}

// Export types for use in components
export type { SpecialtyManagementState, SpecialtyFilters };
