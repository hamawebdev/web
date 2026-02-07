'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthAPI } from '@/lib/auth-api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-rose-600" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const errorParam = searchParams.get('error');

        // Handle OAuth errors
        if (errorParam) {
          setError('Authentication failed. Please try again.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => {
            router.push('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        // Validate tokens
        if (!accessToken || !refreshToken) {
          setError('Invalid authentication response. Please try again.');
          toast.error('Invalid authentication response. Please try again.');
          setTimeout(() => {
            router.push('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        // Store tokens
        AuthAPI.setTokens(accessToken, refreshToken);

        // Get user profile
        const user = await AuthAPI.getCurrentUser();

        if (!user) {
          setError('Failed to retrieve user profile. Please try again.');
          toast.error('Failed to retrieve user profile. Please try again.');
          setTimeout(() => {
            router.push('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        // Show success message
        if (isNewUser) {
          toast.success('Account created successfully! Welcome to Med-ADN.');
        } else {
          toast.success('Successfully signed in with Google!');
        }

        // Redirect based on user role
        const redirectPath = AuthAPI.getRedirectPath(user.role);
        router.push(redirectPath);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        toast.error(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => {
          router.push('/login?error=oauth_failed');
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-rose-600" />
            <h2 className="text-xl font-semibold text-foreground">
              Completing sign in...
            </h2>
            <p className="text-muted-foreground">
              Please wait while we authenticate you.
            </p>
          </>
        ) : error ? (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Authentication Failed
            </h2>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 mx-auto rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 text-xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Authentication Successful!
            </h2>
            <p className="text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
