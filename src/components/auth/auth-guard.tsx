// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth, useAdminAuth } from '@/hooks/use-auth';
import { FullPageLoading } from '@/components/loading-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, LogIn, Home, Clock } from 'lucide-react';
import { User } from '@/types/auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: User['role'];
  fallbackPath?: string;
  loadingMessage?: string;
  customUnauthorizedComponent?: React.ReactNode;
}

/**
 * AuthGuard component that protects routes with authentication and role-based authorization
 * 
 * Features:
 * - Enforces authentication before allowing access
 * - Supports role-based authorization (STUDENT, ADMIN, EMPLOYEE)
 * - Provides user-friendly error screens
 * - Handles loading states gracefully
 * - Maintains session management
 * - Customizable fallback paths and messages
 */
export function AuthGuard({
  children,
  requiredRole = 'STUDENT',
  fallbackPath = '/',
  loadingMessage = 'Authenticating...',
  customUnauthorizedComponent
}: AuthGuardProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // useStudentAuth/useAdminAuth/useEmployeeAuth are thin wrappers around
  // useRequireAuth(role). Resolve the role first and call the hook once,
  // unconditionally, so the hook order never depends on props.
  const authRole: User['role'] =
    requiredRole === 'ADMIN' ? 'ADMIN' :
      requiredRole === 'EMPLOYEE' ? 'EMPLOYEE' :
        'STUDENT';
  const authHook = useRequireAuth(authRole);

  const { isAuthenticated, user, loading: authLoading, checkAndRedirect } = authHook;

  // Initialize authentication check
  useEffect(() => {
    if (!authLoading && !authChecked) {
      console.log('🔐 AuthGuard: Performing authentication check for role:', requiredRole);
      checkAndRedirect();
      setAuthChecked(true);
    }
  }, [authLoading, authChecked, checkAndRedirect, requiredRole]);

  // Show loading state while authentication is being checked
  if (authLoading || !authChecked) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <FullPageLoading message={loadingMessage} />
      </div>
    );
  }

  // Show custom unauthorized component if provided
  if (!isAuthenticated && customUnauthorizedComponent) {
    return <>{customUnauthorizedComponent}</>;
  }

  // Show authentication required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Please log in to continue.
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(fallbackPath)}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show role validation error if user doesn't have required role
  if (user && requiredRole && user.role !== requiredRole) {
    const getRoleDisplayName = (role: string) => {
      switch (role) {
        case 'STUDENT': return 'student';
        case 'ADMIN': return 'administrator';
        case 'EMPLOYEE': return 'employee';
        default: return 'user';
      }
    };

    const getDashboardPath = (userRole: string) => {
      switch (userRole) {
        case 'ADMIN': return '/admin/content/';
        case 'EMPLOYEE': return '/admin/question-sources';
        case 'STUDENT': return '/student/dashboard';
        default: return '/';
      }
    };

    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription>
              This page is only available to {getRoleDisplayName(requiredRole)}s.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Your account role ({getRoleDisplayName(user.role)}) does not have access to this page.
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push(getDashboardPath(user.role))}
                className="w-full"
                size="lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(fallbackPath)}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render protected content if all checks pass
  return <>{children}</>;
}

/**
 * Higher-order component for wrapping pages with authentication
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

/**
 * Specialized AuthGuard for student-only routes
 */
export function StudentAuthGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="STUDENT" {...props}>
      {children}
    </AuthGuard>
  );
}

/**
 * Specialized AuthGuard for admin-only routes
 * Also allows EMPLOYEE role access to admin routes
 */
export function AdminAuthGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  const { isAuthenticated, user, loading: authLoading, checkAndRedirect } = useAdminAuth();

  // Initialize authentication check
  useEffect(() => {
    if (!authLoading && !authChecked) {
      setAuthChecked(true);
    }
  }, [authLoading, authChecked]);

  // Show loading state while authentication is being checked
  if (authLoading || !authChecked) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <FullPageLoading message="Authenticating..." />
      </div>
    );
  }

  // Allow both ADMIN and EMPLOYEE roles
  if (isAuthenticated && user && (user.role === 'ADMIN' || user.role === 'EMPLOYEE')) {
    return <>{children}</>;
  }

  // Show authentication required screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>
              You must be logged in to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Please log in to continue.
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                size="lg"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If authenticated but wrong role, show access denied
  return (
    <div className="h-screen w-full bg-gradient-to-br from-background via-muted/20 to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
          <CardDescription>
            This page is only available to administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                const redirectPath = user?.role === 'STUDENT' ? '/student/dashboard' : '/';
                router.push(redirectPath);
              }}
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Specialized AuthGuard for employee-only routes
 */
export function EmployeeAuthGuard({ children, ...props }: Omit<AuthGuardProps, 'requiredRole'>) {
  return (
    <AuthGuard requiredRole="EMPLOYEE" {...props}>
      {children}
    </AuthGuard>
  );
}
