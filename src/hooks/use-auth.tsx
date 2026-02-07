// @ts-nocheck
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginData, AuthState, convertApiUserToLegacy } from '@/types/auth';
import AuthAPI from '@/lib/auth-api';
import { toast } from 'sonner';

// Module-level cache to prevent duplicate /auth/profile calls across components
let cachedAuthResult: { user: User | null; isAuthenticated: boolean } | null = null;
let initializePromise: Promise<User | null> | null = null;

// Custom hook for authentication management
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  });
  const isInitializingRef = useRef(false);

  const router = useRouter();

  // Initialize authentication state (API only)
  const initializeAuth = useCallback(async () => {
    // Return cached result if available to avoid duplicate network calls
    if (cachedAuthResult) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: cachedAuthResult.isAuthenticated,
        user: cachedAuthResult.user,
        loading: false,
        error: null,
      }));
      return cachedAuthResult.user;
    }

    // Prevent multiple simultaneous initialization calls
    if (isInitializingRef.current) {
      console.log('🔐 useAuth.initializeAuth: Already initializing, reusing promise...');
      return initializePromise;
    }

    try {
      isInitializingRef.current = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // Share the in-flight promise so other callers can await the same request
      initializePromise = (async () => {
        // Check if user is authenticated via API
        if (AuthAPI.isAuthenticated()) {
          console.log('🔐 useAuth.initializeAuth: User appears authenticated, fetching profile...');
          const user = await AuthAPI.getCurrentUser();
          if (user) {
            console.log('🔐 useAuth.initializeAuth: User profile fetched successfully', { role: user.role });
            cachedAuthResult = { isAuthenticated: true, user };
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
              error: null,
            });
            return user;
          } else {
            console.log('🔐 useAuth.initializeAuth: Failed to get user profile');
          }
        } else {
          console.log('🔐 useAuth.initializeAuth: User not authenticated');
        }

        cachedAuthResult = { isAuthenticated: false, user: null };
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        });
        return null;
      })();

      const result = await initializePromise;
      return result;
    } catch (error) {
      console.error('🔐 useAuth.initializeAuth: Auth initialization error:', error);
      cachedAuthResult = { isAuthenticated: false, user: null };
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      });
    } finally {
      isInitializingRef.current = false;
      initializePromise = null;
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginData) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await AuthAPI.login(credentials);

      if (response.user) {
        setAuthState({
          isAuthenticated: true,
          user: response.user,
          loading: false,
          error: null,
        });

        toast.success('Login successful!');

        // Redirect based on user role
        const redirectPath = AuthAPI.getRedirectPath(response.user.role);
        router.push(redirectPath);

        return response.user;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast.error(errorMessage);
      throw error;
    }
  }, [router]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      await AuthAPI.logout();
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });

      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
      router.push('/login');
    }
  }, [router]);

  // Update profile function
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const updatedUser = await AuthAPI.updateProfile(profileData);
      
      // Update localStorage with legacy format
      const legacyUser = convertApiUserToLegacy(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(legacyUser));

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
      }));

      toast.success('Profile updated successfully');
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      await AuthAPI.changePassword(currentPassword, newPassword);
      
      setAuthState(prev => ({ ...prev, loading: false }));
      toast.success('Password changed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      toast.error(errorMessage);
      throw error;
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Manual initialization - call initializeAuth when needed
  // No automatic initialization on mount

  return {
    ...authState,
    login,
    logout,
    updateProfile,
    changePassword,
    clearError,
    initializeAuth, // Manual initialization
    refresh: initializeAuth,
  };
}

// Hook for checking if user has specific role (manual check, no automatic redirects)
export function useRequireAuth(requiredRole?: User['role']) {
  const { isAuthenticated, user, loading, initializeAuth } = useAuth();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  // Initialize auth on mount (only once)
  useEffect(() => {
    if (!initialized) {
      console.log('🔐 useRequireAuth: Initializing auth for role:', requiredRole);
      initializeAuth().finally(() => {
        setInitialized(true);
      });
    }
  }, [initializeAuth, initialized, requiredRole]);

  // Manual redirect function instead of automatic
  const checkAndRedirect = useCallback(() => {
    if (!loading && initialized) {
      if (!isAuthenticated) {
        console.log('🔐 useRequireAuth: User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (requiredRole && user?.role !== requiredRole) {
        console.log('🔐 useRequireAuth: User role mismatch', { userRole: user?.role, requiredRole });
        // Redirect to appropriate dashboard based on user role
        const redirectPath = AuthAPI.getRedirectPath(user.role);
        router.push(redirectPath);
        return;
      }
    }
  }, [isAuthenticated, user, loading, requiredRole, router, initialized]);

  return { isAuthenticated, user, loading, checkAndRedirect };
}

// Hook for protecting student routes
export function useStudentAuth() {
  return useRequireAuth('STUDENT');
}

// Hook for protecting admin routes
export function useAdminAuth() {
  return useRequireAuth('ADMIN');
}

// Hook for protecting employee routes
export function useEmployeeAuth() {
  return useRequireAuth('EMPLOYEE');
}
