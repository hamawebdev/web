/**
 * Error Boundary Component for New API Integration
 * 
 * Provides comprehensive error handling for the new API structure
 * with specific handling for different types of API errors.
 */

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error details
    console.error('API Error Boundary caught an error:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error('An unexpected error occurred. Please try refreshing the page.');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/student/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                {this.state.error?.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Technical Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error?.stack}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling API errors consistently across components
 */
export function useApiErrorHandler() {
  const handleError = React.useCallback((error: any, context?: string) => {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

    let errorMessage = 'An unexpected error occurred';
    
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Handle specific API error types
    if (error?.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
      // Redirect to login or refresh auth token
    } else if (error?.response?.status === 403) {
      errorMessage = 'You do not have permission to access this resource.';
    } else if (error?.response?.status === 404) {
      errorMessage = 'The requested resource was not found.';
    } else if (error?.response?.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error?.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    toast.error(errorMessage);
    return errorMessage;
  }, []);

  return { handleError };
}

/**
 * Loading state component for API operations
 */
interface ApiLoadingStateProps {
  loading: boolean;
  error?: string | null;
  children: ReactNode;
  loadingMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

export function ApiLoadingState({
  loading,
  error,
  children,
  loadingMessage = 'Loading...',
  errorMessage,
  onRetry
}: ApiLoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="mt-2">
          {errorMessage || error}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for wrapping components with API error handling
 */
export function withApiErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ApiErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ApiErrorBoundary>
    );
  };
}
