/**
 * Session Error Alert Component
 * 
 * Displays user-friendly error messages with suggested actions
 * for session creation failures.
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Settings, HelpCircle } from 'lucide-react';
import { SessionErrorDetails } from '@/utils/session-error-handler';

interface SessionErrorAlertProps {
  errorDetails: SessionErrorDetails;
  onRetry?: () => void;
  onAdjustFilters?: () => void;
  className?: string;
}

export function SessionErrorAlert({
  errorDetails,
  onRetry,
  onAdjustFilters,
  className = ''
}: SessionErrorAlertProps) {
  const getIcon = () => {
    switch (errorDetails.type) {
      case 'NO_QUESTIONS':
        return <HelpCircle className="h-4 w-4" />;
      case 'NETWORK_ERROR':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (errorDetails.type) {
      case 'NO_QUESTIONS':
        return 'default';
      case 'NETWORK_ERROR':
        return 'default';
      case 'SERVER_ERROR':
        return 'destructive';
      default:
        return 'destructive';
    }
  };

  return (
    <Alert variant={getVariant()} className={className}>
      {getIcon()}
      <AlertTitle>
        {errorDetails.type === 'NO_QUESTIONS' && 'No questions found'}
        {errorDetails.type === 'VALIDATION_ERROR' && 'Validation error'}
        {errorDetails.type === 'NETWORK_ERROR' && 'Connection problem'}
        {errorDetails.type === 'SERVER_ERROR' && 'Server error'}
        {errorDetails.type === 'UNKNOWN' && 'Unexpected error'}
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{errorDetails.userMessage}</p>
        
        {errorDetails.suggestedActions.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-2">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {errorDetails.suggestedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Retry
            </Button>
          )}
          
          {onAdjustFilters && errorDetails.type === 'NO_QUESTIONS' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAdjustFilters}
              className="flex items-center gap-2"
            >
              <Settings className="h-3 w-3" />
              Adjust filters
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook to manage session error state
 */
export function useSessionError() {
  const [errorDetails, setErrorDetails] = React.useState<SessionErrorDetails | null>(null);

  const showError = React.useCallback((details: SessionErrorDetails) => {
    setErrorDetails(details);
  }, []);

  const clearError = React.useCallback(() => {
    setErrorDetails(null);
  }, []);

  return {
    errorDetails,
    showError,
    clearError,
    hasError: !!errorDetails
  };
}
