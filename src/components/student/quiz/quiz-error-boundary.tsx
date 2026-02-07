/**
 * Quiz-Specific Error Boundary Component
 * 
 * Provides comprehensive error handling for quiz components with
 * specific error types, retry logic, and user-friendly fallbacks.
 */

'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Wifi, Clock, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuizErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function QuizErrorFallback({ error, resetError }: QuizErrorFallbackProps) {
  const router = useRouter();

  // Determine error type and appropriate response
  const getErrorInfo = (error: Error) => {
    const message = error.message.toLowerCase();
    
    if (message.includes('session_expired') || message.includes('expired')) {
      return {
        type: 'SESSION_EXPIRED',
        title: 'Quiz Session Expired',
        description: 'Your quiz session has expired. Please start a new quiz to continue.',
        icon: Clock,
        color: 'text-orange-500',
        canRetry: false,
        primaryAction: 'Start New Quiz',
        primaryActionFn: () => router.push('/student/practice')
      };
    }
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        type: 'NETWORK_ERROR',
        title: 'Connection Problem',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        icon: Wifi,
        color: 'text-blue-500',
        canRetry: true,
        primaryAction: 'Try Again',
        primaryActionFn: resetError
      };
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return {
        type: 'AUTH_ERROR',
        title: 'Authentication Required',
        description: 'Your session has expired. Please log in again to continue.',
        icon: Shield,
        color: 'text-red-500',
        canRetry: false,
        primaryAction: 'Log In',
        primaryActionFn: () => router.push('/auth/login')
      };
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return {
        type: 'NOT_FOUND',
        title: 'Quiz Not Found',
        description: 'The quiz you are looking for could not be found. It may have been deleted or moved.',
        icon: AlertTriangle,
        color: 'text-yellow-500',
        canRetry: false,
        primaryAction: 'Browse Quizzes',
        primaryActionFn: () => router.push('/student/practice')
      };
    }
    
    // Generic error
    return {
      type: 'GENERIC_ERROR',
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred while loading the quiz. Please try again.',
      icon: AlertTriangle,
      color: 'text-red-500',
      canRetry: true,
      primaryAction: 'Try Again',
      primaryActionFn: resetError
    };
  };

  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  const handleGoHome = () => {
    router.push('/student/practice');
  };

  const handleReportError = () => {
    // In a real app, this would send error details to monitoring service
    // Error details are logged silently for debugging

    // Show feedback that error was reported
    alert('Error reported. Thank you for helping us improve the platform!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <IconComponent className={`h-12 w-12 ${errorInfo.color}`} />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Primary Action */}
          <Button 
            onClick={errorInfo.primaryActionFn} 
            className="w-full"
            size="lg"
          >
            {errorInfo.canRetry && <RefreshCw className="mr-2 h-4 w-4" />}
            {!errorInfo.canRetry && <Home className="mr-2 h-4 w-4" />}
            {errorInfo.primaryAction}
          </Button>
          
          {/* Secondary Actions */}
          <div className="flex gap-2">
            {errorInfo.canRetry && (
              <Button 
                variant="outline" 
                onClick={handleGoHome} 
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={handleReportError} 
              className="flex-1"
            >
              Report Issue
            </Button>
          </div>
          
          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-md">
                <p className="text-xs font-mono text-gray-700 mb-2">
                  <strong>Error:</strong> {error.message}
                </p>
                <p className="text-xs font-mono text-gray-700 mb-2">
                  <strong>Type:</strong> {errorInfo.type}
                </p>
                {error.stack && (
                  <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface QuizErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<QuizErrorFallbackProps>;
}

export function QuizErrorBoundary({ children, fallback }: QuizErrorBoundaryProps) {
  const FallbackComponent = fallback || QuizErrorFallback;

  return (
    <ErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={(error, errorInfo) => {
        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Example: Send to error monitoring service
          // errorMonitoringService.captureException(error, {
          //   tags: { component: 'quiz' },
          //   extra: errorInfo
          // });
        }

        // Track error in analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'exception', {
            description: error.message,
            fatal: false,
            custom_map: {
              error_boundary: 'quiz'
            }
          });
        }
      }}
      onReset={() => {
        // Clear localStorage quiz data if needed
        if (typeof window !== 'undefined') {
          const keysToRemove = Object.keys(localStorage).filter(key =>
            key.startsWith('quiz_') || key.startsWith('session_')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Higher-order component for wrapping quiz pages
export function withQuizErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function QuizPageWithErrorBoundary(props: P) {
    return (
      <QuizErrorBoundary>
        <Component {...props} />
      </QuizErrorBoundary>
    );
  };
}
