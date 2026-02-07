// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  ExternalLink,
  Eye,
  BarChart3,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ViewResultsButtonProps {
  sessionId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ViewResultsButton({ 
  sessionId, 
  variant = 'default',
  size = 'sm',
  className,
  showIcon = true,
  children
}: ViewResultsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleViewResults = async () => {
    if (!sessionId) {
      toast.error('Session ID is required to view results');
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to the standardized session results route
      const resultsUrl = `/session/${sessionId}/results`;

      // Show loading toast
      const loadingToast = toast.loading('Loading session results...');

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push(resultsUrl);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Redirecting to session results...');

    } catch (error) {
      console.error('Error navigating to results:', error);
      toast.error('Failed to load session results. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleViewResults}
      disabled={isLoading}
      className={cn("btn-modern", className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {showIcon && <Eye className="h-4 w-4 mr-2" />}
          {children || 'View Results'}
          {showIcon && <ArrowRight className="h-4 w-4 ml-2" />}
        </>
      )}
    </Button>
  );
}

// Alternative button variants for different use cases
export function ViewResultsIconButton({ 
  sessionId, 
  className 
}: { 
  sessionId: number; 
  className?: string; 
}) {
  return (
    <ViewResultsButton
      sessionId={sessionId}
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0", className)}
      showIcon={false}
    >
      <ExternalLink className="h-4 w-4" />
    </ViewResultsButton>
  );
}

export function ViewResultsLinkButton({ 
  sessionId, 
  className 
}: { 
  sessionId: number; 
  className?: string; 
}) {
  return (
    <ViewResultsButton
      sessionId={sessionId}
      variant="ghost"
      size="sm"
      className={cn("text-primary hover:text-primary/80 p-0 h-auto font-normal", className)}
      showIcon={false}
    >
      View Detailed Results
      <ExternalLink className="h-3 w-3 ml-1" />
    </ViewResultsButton>
  );
}

export function ViewAnalyticsButton({ 
  sessionId, 
  className 
}: { 
  sessionId: number; 
  className?: string; 
}) {
  return (
    <ViewResultsButton
      sessionId={sessionId}
      variant="outline"
      size="sm"
      className={className}
      showIcon={false}
    >
      <BarChart3 className="h-4 w-4 mr-2" />
      Analytics
    </ViewResultsButton>
  );
}

export function ViewReportButton({ 
  sessionId, 
  className 
}: { 
  sessionId: number; 
  className?: string; 
}) {
  return (
    <ViewResultsButton
      sessionId={sessionId}
      variant="outline"
      size="sm"
      className={className}
      showIcon={false}
    >
      <FileText className="h-4 w-4 mr-2" />
      Report
    </ViewResultsButton>
  );
}
