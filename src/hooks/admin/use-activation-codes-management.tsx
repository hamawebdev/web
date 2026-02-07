'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminService } from '@/lib/api-services';
import { ActivationCode, CreateActivationCodeRequest, UpdateActivationCodeRequest, ActivationCodeFilters, PaginationParams } from '@/types/api';
import { toast } from 'sonner';
import { getActivationCodeErrorMessage } from '@/lib/activation-code-errors';

// Interface for activation codes management state
interface ActivationCodesState {
  codes: ActivationCode[];
  totalCodes: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ActivationCodeFilters & PaginationParams;
}

// Hook for managing activation codes data
export function useActivationCodesManagement() {
  const [state, setState] = useState<ActivationCodesState>({
    codes: [],
    totalCodes: 0,
    currentPage: 1,
    totalPages: 1,
    loading: true,
    error: null,
    filters: {
      page: 1,
      limit: 20,
    },
  });

  // Fetch activation codes
  const fetchCodes = useCallback(async (page?: number) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const params = {
        ...state.filters,
        page: page || state.filters.page || 1,
      };

      console.log('🔍 Fetching activation codes with params:', params);

      const response = await AdminService.getActivationCodes(params);
      console.log('🔍 Raw API response:', response);

      // Cast response to any to handle different shapes
      const resp = response as any;

      // Check if it's a direct canonical response (has items array) OR a standard success response
      const isCanonical = Array.isArray(resp.items);
      const isStandardSuccess = resp.success && resp.data;

      if (isCanonical || isStandardSuccess) {
        let rawCodes: ActivationCode[] = [];
        let pagination: any = {};

        if (isCanonical) {
          // Type C: Direct canonical
          rawCodes = resp.items;
          pagination = resp; // contains total, page, limit, totalPages
        } else {
          // Type A or B: Wrapped
          const responseData = (resp.data.data) || resp.data;
          rawCodes = responseData.activationCodes || responseData.items || [];
          pagination = responseData.pagination || responseData;
        }

        console.log('✅ Activation codes fetched successfully:', {
          codesCount: rawCodes.length,
          pagination,
        });

        setState(prev => ({
          ...prev,
          codes: rawCodes,
          totalCodes: pagination.totalItems || pagination.total || 0,
          currentPage: pagination.currentPage || pagination.page || 1,
          totalPages: pagination.totalPages || 1,
          loading: false,
          error: null,
        }));
      } else {
        const errorMsg = resp.error ? String(resp.error) : 'Failed to fetch activation codes';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('❌ Error fetching activation codes:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

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

  // Initial load
  useEffect(() => {
    fetchCodes();
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ActivationCodeFilters & PaginationParams>) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
        page: newFilters.page || 1, // Reset to page 1 when filters change (except when explicitly setting page)
      },
    }));

    // Fetch with new filters
    setTimeout(() => {
      fetchCodes(newFilters.page || 1);
    }, 0);
  }, [fetchCodes]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      page: 1,
      limit: 20,
    };

    setState(prev => ({
      ...prev,
      filters: clearedFilters,
    }));

    setTimeout(() => {
      fetchCodes(1);
    }, 0);
  }, [fetchCodes]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  // Create activation code
  const createCode = useCallback(async (codeData: CreateActivationCodeRequest) => {
    try {
      console.log('🔄 Creating activation code:', codeData);

      const response = await AdminService.createActivationCode(codeData);
      const resp = response as any;

      // Handle both canonical (direct object) and standard (success wrapper) response formats
      // Canonical: { id: 2, code: "SZNO-1KK1-IU2L", ... }
      // Standard: { success: true, data: { activationCode: {...} } }
      const isCanonical = resp.id !== undefined && resp.code !== undefined;
      const isStandardSuccess = resp.success && resp.data;

      if (isCanonical) {
        console.log('✅ Activation code created successfully (canonical):', resp);

        toast.success('Succès', {
          description: `Code d'activation créé: ${resp.code}`,
        });

        // Refresh the codes list
        await fetchCodes(state.currentPage);

        return resp;
      } else if (isStandardSuccess) {
        console.log('✅ Activation code created successfully (standard):', resp.data);

        toast.success('Succès', {
          description: 'Code d\'activation créé avec succès',
        });

        // Refresh the codes list
        await fetchCodes(state.currentPage);

        return resp.data.activationCode || resp.data;
      } else {
        throw new Error(resp.error ? String(resp.error) : 'Failed to create activation code');
      }
    } catch (err) {
      console.error('❌ Error creating activation code:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

      toast.error('Erreur', {
        description: errorMessage,
      });

      throw err;
    }
  }, [fetchCodes, state.currentPage]);

  // Deactivate activation code using the correct PATCH endpoint
  const deactivateCode = useCallback(async (codeId: number) => {
    try {
      console.log('🔄 Deactivating activation code:', codeId);

      const response = await AdminService.deactivateActivationCode(codeId);
      const resp = response as any;

      // Handle both canonical and standard response formats
      const isCanonical = resp.id !== undefined;
      const isStandardSuccess = resp.success && resp.data;

      if (isCanonical || isStandardSuccess) {
        console.log('✅ Activation code deactivated successfully:', resp);

        toast.success('Succès', {
          description: 'Code d\'activation désactivé avec succès',
        });

        // Refresh the codes list
        await fetchCodes(state.currentPage);

        return isCanonical ? resp : (resp.data.activationCode || resp.data);
      } else {
        throw new Error(resp.error ? String(resp.error) : 'Failed to deactivate activation code');
      }
    } catch (err) {
      console.error('❌ Error deactivating activation code:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

      toast.error('Erreur', {
        description: errorMessage,
      });

      throw err;
    }
  }, [fetchCodes, state.currentPage]);

  // Get activation code by ID
  const getCodeById = useCallback(async (codeId: number) => {
    try {
      console.log('🔄 Getting activation code by ID:', codeId);

      const response = await AdminService.getActivationCodeById(codeId);
      const resp = response as any;

      // Handle both canonical and standard response formats
      const isCanonical = resp.id !== undefined && resp.code !== undefined;
      const isStandardSuccess = resp.success && resp.data;

      if (isCanonical) {
        console.log('✅ Activation code fetched successfully (canonical):', resp);
        return resp;
      } else if (isStandardSuccess) {
        console.log('✅ Activation code fetched successfully (standard):', resp.data);
        return resp.data.activationCode || resp.data;
      } else {
        throw new Error(resp.error ? String(resp.error) : 'Failed to get activation code');
      }
    } catch (err) {
      console.error('❌ Error getting activation code:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

      toast.error('Erreur', {
        description: errorMessage,
      });

      throw err;
    }
  }, []);

  // Update activation code
  const updateCode = useCallback(async (codeId: number, codeData: UpdateActivationCodeRequest) => {
    try {
      console.log('🔄 Updating activation code:', codeId, codeData);

      const response = await AdminService.updateActivationCode(codeId, codeData);
      const resp = response as any;

      // Handle both canonical and standard response formats
      const isCanonical = resp.id !== undefined && resp.code !== undefined;
      const isStandardSuccess = resp.success && resp.data;

      if (isCanonical || isStandardSuccess) {
        console.log('✅ Activation code updated successfully:', resp);

        toast.success('Succès', {
          description: 'Code d\'activation mis à jour avec succès',
        });

        // Refresh the codes list
        await fetchCodes(state.currentPage);

        return isCanonical ? resp : (resp.data.activationCode || resp.data);
      } else {
        throw new Error(resp.error ? String(resp.error) : 'Failed to update activation code');
      }
    } catch (err) {
      console.error('❌ Error updating activation code:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

      toast.error('Erreur', {
        description: errorMessage,
      });

      throw err;
    }
  }, [fetchCodes, state.currentPage]);

  // Delete activation code
  const deleteCode = useCallback(async (codeId: number) => {
    try {
      console.log('🔄 Deleting activation code:', codeId);

      const response = await AdminService.deleteActivationCode(codeId);
      const resp = response as any;

      // Handle both canonical ({ message: "..." }) and standard ({ success: true }) response formats
      const isCanonical = resp.message !== undefined;
      const isStandardSuccess = resp.success;

      if (isCanonical || isStandardSuccess) {
        console.log('✅ Activation code deleted successfully');

        toast.success('Succès', {
          description: 'Code d\'activation supprimé avec succès',
        });

        // Refresh the codes list
        await fetchCodes(state.currentPage);

        return true;
      } else {
        throw new Error(resp.error ? String(resp.error) : 'Failed to delete activation code');
      }
    } catch (err) {
      console.error('❌ Error deleting activation code:', err);
      const errorMessage = getActivationCodeErrorMessage(err);

      toast.error('Erreur', {
        description: errorMessage,
      });

      throw err;
    }
  }, [fetchCodes, state.currentPage]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchCodes(state.currentPage);
  }, [fetchCodes, state.currentPage]);

  // Computed properties
  const hasCodes = state.codes.length > 0;
  const hasError = !!state.error;
  const hasFilters = Object.keys(state.filters).some(key =>
    key !== 'page' && key !== 'limit' && state.filters[key as keyof typeof state.filters] !== undefined
  );

  return {
    // Data
    codes: state.codes,
    totalCodes: state.totalCodes,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loading: state.loading,
    error: state.error,
    filters: state.filters,

    // Actions
    updateFilters,
    clearFilters,
    createCode,
    getCodeById,
    updateCode,
    deleteCode,
    deactivateCode,
    goToPage,
    refresh,

    // Computed
    hasCodes,
    hasError,
    hasFilters,
  };
}
