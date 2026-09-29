// @ts-nocheck
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginData, AuthState, convertApiUserToLegacy } from '@/types/auth';
import AuthAPI from '@/lib/auth-api';
import { AUTH_LOGOUT_EVENT } from '@/lib/api-client';
import { clearCachedResources, fetchFresh, readCache, writeCache } from '@/lib/cached-resource';
import { toast } from 'sonner';

// Module-level cache to prevent duplicate /auth/profile calls across components
let cachedAuthResult: { user: User | null; isAuthenticated: boolean } | null = null;
let initializePromise: Promise<User | null> | null = null;

/**
 * Forget the cached auth result. Call it whenever the stored tokens change
 * outside useAuth().login (registration, OAuth callback, logout, password change)
 * so the next initializeAuth reads the real session again.
 */
export function resetAuthCache() {
  cachedAuthResult = null;
  initializePromise = null;
}

// The API client fires AUTH_LOGOUT_EVENT when the refresh token is rejected and
// the tokens are cleared; drop the cached user so guards stop trusting it.
if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_LOGOUT_EVENT, resetAuthCache);
}

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
    // A cached result is only valid while it still matches the stored tokens:
    // tokens stored after a cached "logged out" (registration, OAuth) or cleared
    // after a cached "logged in" (logout, expired session) invalidate it.
    if (cachedAuthResult && cachedAuthResult.isAuthenticated !== AuthAPI.isAuthenticated()) {
      resetAuthCache();
    }

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
          // Later visits: show the signed-in page with the last profile at once and
          // confirm it in the background. A session that ended is still caught: the
          // API client clears the tokens and fires AUTH_LOGOUT_EVENT.
          const cached = readCache<User>('profile');
          if (cached?.value) {
            cachedAuthResult = { isAuthenticated: true, user: cached.value };
            setAuthState({ isAuthenticated: true, user: cached.value, loading: false, error: null });
            fetchFresh('profile', async () => {
              const fresh = await AuthAPI.getCurrentUser();
              if (!fresh) throw new Error('Profile unavailable');
              return fresh;
            }).then(fresh => {
              if (cachedAuthResult?.isAuthenticated) cachedAuthResult = { isAuthenticated: true, user: fresh };
              setAuthState(prev => prev.isAuthenticated ? { ...prev, user: fresh } : prev);
            }).catch(() => undefined);
            return cached.value;
          }

          console.log('🔐 useAuth.initializeAuth: User appears authenticated, fetching profile...');
          const user = await AuthAPI.getCurrentUser();
          if (user) {
            writeCache('profile', user);
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
      // Temporary failure (network, timeout, 5xx) while the tokens are still stored:
      // do not cache "not authenticated", so the next call retries the profile.
      console.error('🔐 useAuth.initializeAuth: Auth initialization error:', error);
      cachedAuthResult = null;
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: (error as any)?.message || (error as any)?.error || 'Authentication error',
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
        // Update cache immediately to prevent unnecessary refetch and auth states race conditions
        cachedAuthResult = { isAuthenticated: true, user: response.user };
        writeCache('profile', response.user);

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

      // Clear cache on error
      cachedAuthResult = null;

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

      resetAuthCache();
      clearCachedResources();
      await AuthAPI.logout();
      resetAuthCache();
      clearCachedResources();

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
      resetAuthCache();
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

  // When the API client ends the session (refresh token rejected), reflect it here
  useEffect(() => {
    const handleSessionEnded = () => {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleSessionEnded);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleSessionEnded);
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
  const { isAuthenticated, user, loading, error, initializeAuth } = useAuth();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  // The session ended while on a protected page (refresh token rejected): go to login
  useEffect(() => {
    const handleSessionEnded = () => {
      router.replace('/login');
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleSessionEnded);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleSessionEnded);
  }, [router]);

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
        // A temporary profile-fetch failure with tokens still stored is not a logout
        if (error && AuthAPI.isAuthenticated()) {
          console.warn('🔐 useRequireAuth: Could not verify the session right now, not redirecting');
          return;
        }
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
  }, [isAuthenticated, user, loading, error, requiredRole, router, initialized]);

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
