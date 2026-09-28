'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdminService } from '@/lib/api-services';
import { ApiUser, AdminUserListItem, AdminUserStats, AdminUserStatusFilter, PaginationParams } from '@/types/api';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';

// User filters interface
export interface UserFilters {
  search?: string;
  role?: 'STUDENT' | 'ADMIN' | 'EMPLOYEE' | '';
  university?: number;
  status?: AdminUserStatusFilter | '';
}

// User management state interface
interface UserManagementState {
  users: AdminUserListItem[];
  /** Users matching the filters */
  totalUsers: number;
  /** Counts over every user, whatever the filters; null until the first load */
  stats: AdminUserStats | null;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
}

// Hook for managing users
export function useUserManagement() {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    totalUsers: 0,
    stats: null,
    currentPage: 1,
    totalPages: 0,
    loading: true,
    error: null,
    filters: {
      search: '',
      role: '',
      university: undefined,
      status: '',
    },
  });

  // Fetch users with current filters and pagination. A silent fetch keeps the
  // table (and any dialog opened from it) on screen while it reloads.
  const fetchUsers = useCallback(async (page: number = 1, limit: number = 20, filters?: UserFilters, { silent = false }: { silent?: boolean } = {}) => {
    try {
      if (!silent) {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
          currentPage: page
        }));
      }

      // Use provided filters or get from current state
      const currentFilters = filters || state.filters;
      const params: PaginationParams & UserFilters = {
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

      console.log('🔍 Fetching users with params:', params);

      const response = await AdminService.getUsers(params);

      if (response.success && response.data) {
        // Handle the documented API response structure: { users: [...], total, page, limit, totalPages }
        // Also handle the canonical format: { items: [...], ... }
        const { users, items, total, page, totalPages, stats } = response.data as any;

        // Add safety checks for undefined values
        // Canonical backend returns 'items', legacy might return 'users'
        const safeUsers = users || items || [];
        const safeTotal = total || 0;
        const safePage = page || 1;
        const safeTotalPages = totalPages || 0;

        setState(prev => ({
          ...prev,
          users: safeUsers,
          totalUsers: safeTotal,
          stats: stats ?? prev.stats,
          currentPage: safePage,
          totalPages: safeTotalPages,
          loading: false,
          error: null,
        }));

        console.log('✅ Users fetched successfully:', {
          count: safeUsers.length,
          total: safeTotal,
          responseStructure: Object.keys(response.data)
        });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to fetch users');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to fetch users');
      console.error('❌ Error fetching users:', error);

      setState(prev => ({
        ...prev,
        users: [],
        totalUsers: 0,
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

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    const updatedFilters = { ...state.filters, ...newFilters };
    setState(prev => ({
      ...prev,
      filters: updatedFilters,
      currentPage: 1, // Reset to first page when filters change
    }));
    fetchUsers(1, 20, updatedFilters);
  }, [state.filters, fetchUsers]);

  // Clear filters
  const clearFilters = useCallback(() => {
    const clearedFilters: UserFilters = {
      search: '',
      role: '',
      university: undefined,
      status: '',
    };
    setState(prev => ({
      ...prev,
      filters: clearedFilters,
      currentPage: 1,
    }));
    fetchUsers(1, 20, clearedFilters);
  }, [fetchUsers]);

  // Create user
  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'ADMIN' | 'EMPLOYEE';
    universityId?: number;
    specialtyId?: number;
    currentYear?: string;
  }) => {
    try {
      console.log('🔄 Creating user:', userData);

      const response = await AdminService.createUser(userData);

      if (response.success && response.data) {
        console.log('✅ User created successfully:', response.data);

        toast.success('Success', {
          description: 'User created successfully',
        });

        // Refresh the user list
        await fetchUsers(state.currentPage);

        return response.data;
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to create user');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to create user');
      console.error('❌ Error creating user:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchUsers, state.currentPage]);

  // Update user
  const updateUser = useCallback(async (userId: number, userData: Partial<ApiUser>) => {
    try {
      console.log('🔄 Updating user:', { userId, userData });

      const response = await AdminService.updateUser(userId, userData);

      if (response.success && response.data) {
        console.log('✅ User updated successfully:', response.data);

        toast.success('Success', {
          description: 'User updated successfully',
        });

        // Refresh the user list
        await fetchUsers(state.currentPage);

        return response.data;
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to update user');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to update user');
      console.error('❌ Error updating user:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchUsers, state.currentPage]);

  // Deactivate user
  const deactivateUser = useCallback(async (userId: number) => {
    try {
      console.log('🔄 Deactivating user:', userId);

      const response = await AdminService.deactivateUser(userId);

      if (response.success && response.data) {
        console.log('✅ User deactivated successfully:', response.data);

        toast.success('Success', {
          description: 'User deactivated successfully',
        });

        // Refresh the user list
        await fetchUsers(state.currentPage);

        return response.data;
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to deactivate user');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to deactivate user');
      console.error('❌ Error deactivating user:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchUsers, state.currentPage]);

  // Delete user (permanent)
  const deleteUser = useCallback(async (userId: number) => {
    try {
      console.log('🔄 Deleting user:', userId);

      const response = await AdminService.deleteUser(userId);

      if (response.success) {
        console.log('✅ User deleted successfully:', response.data);

        toast.success('Success', {
          description: 'User deactivated successfully',
        });

        // Refresh the user list
        await fetchUsers(state.currentPage);

        return response.data;
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to delete user');
      console.error('❌ Error deleting user:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchUsers, state.currentPage]);

  // Reset user password
  const resetUserPassword = useCallback(async (userId: number, newPassword: string) => {
    try {
      console.log('🔄 Resetting password for user:', userId);

      const response = await AdminService.resetUserPassword(userId, newPassword);

      if (response.success && response.data) {
        console.log('✅ Password reset successfully');

        toast.success('Success', {
          description: 'Password reset successfully',
        });

        return response.data;
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to reset password');
      console.error('❌ Error resetting password:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, []);

  // Re-activate an expired, cancelled or lapsed subscription with new dates, then
  // reload the list so the user's status and the stats follow
  const reactivateSubscription = useCallback(async (subscriptionId: number, dates: { startDate: string; endDate: string }) => {
    try {
      const response = await AdminService.activateSubscription(subscriptionId, dates);

      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to re-activate subscription');
      }

      toast.success('Subscription re-activated', {
        description: `Access runs until ${new Date(dates.endDate).toLocaleDateString()}`,
      });

      await fetchUsers(state.currentPage, 20, undefined, { silent: true });

      return response.data;
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Failed to re-activate subscription');
      console.error('❌ Error re-activating subscription:', error);

      toast.error('Error', {
        description: errorMessage,
      });

      throw error;
    }
  }, [fetchUsers, state.currentPage]);

  // Load users on mount
  useEffect(() => {
    fetchUsers(1);
  }, []);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchUsers(page);
    }
  }, [fetchUsers, state.totalPages]);

  return {
    // State
    users: state.users,
    totalUsers: state.totalUsers,
    stats: state.stats,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    loading: state.loading,
    error: state.error,
    filters: state.filters,

    // Actions
    fetchUsers,
    updateFilters,
    clearFilters,
    createUser,
    updateUser,
    deactivateUser,
    deleteUser,
    resetUserPassword,
    reactivateSubscription,
    goToPage,

    // Helper flags
    hasUsers: state.users.length > 0,
    hasError: !!state.error,
    hasFilters: Object.values(state.filters).some(value => value !== '' && value !== undefined),
  };
}

// Export types
export type { UserManagementState };
