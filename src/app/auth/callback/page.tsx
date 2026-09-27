'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AuthAPI } from '@/lib/auth-api';
import { resetAuthCache } from '@/hooks/use-auth';
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

/**
 * The API delivers the OAuth result in the URL fragment (#accessToken=...&refreshToken=...),
 * which browsers never send to a server or put in a Referer header. Older API versions
 * used the query string, so fall back to it when the fragment carries nothing.
 */
function readCallbackParams(): URLSearchParams {
  const fromFragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (fromFragment.has('accessToken') || fromFragment.has('refreshToken') || fromFragment.has('error')) {
    return fromFragment;
  }
  return new URLSearchParams(window.location.search);
}

function AuthCallbackContent() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The callback must be processed once (the URL is scrubbed below, and React may
  // re-run effects), so a second run can never re-store the tokens
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleOAuthCallback = async () => {
      try {
        const params = readCallbackParams();
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const isNewUser = params.get('isNewUser') === 'true';
        const errorParam = params.get('error');

        // Remove the tokens from the address bar and browser history right away,
        // so the tokenized URL cannot be replayed from history later
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', '/auth/callback');
        }

        // Only accept tokens for a sign-in this tab started (see AuthAPI.beginGoogleSignIn)
        const signInStartedHere = AuthAPI.consumeGoogleSignInPending();

        // Handle OAuth errors
        if (errorParam) {
          setError('Authentication failed. Please try again.');
          toast.error('Authentication failed. Please try again.');
          setTimeout(() => {
            router.replace('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        // Validate tokens
        if (!accessToken || !refreshToken) {
          setError('Invalid authentication response. Please try again.');
          toast.error('Invalid authentication response. Please try again.');
          setTimeout(() => {
            router.replace('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        if (!signInStartedHere) {
          setError('This sign-in link was not started from this browser. Please sign in again.');
          toast.error('This sign-in link was not started from this browser. Please sign in again.');
          setTimeout(() => {
            router.replace('/login?error=oauth_failed');
          }, 2000);
          return;
        }

        // Store tokens
        AuthAPI.setTokens(accessToken, refreshToken);
        resetAuthCache();

        // Get user profile
        const user = await AuthAPI.getCurrentUser();

        if (!user) {
          setError('Failed to retrieve user profile. Please try again.');
          toast.error('Failed to retrieve user profile. Please try again.');
          setTimeout(() => {
            router.replace('/login?error=oauth_failed');
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
        router.replace(redirectPath);
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
        toast.error(err.message || 'Authentication failed. Please try again.');
        setTimeout(() => {
          router.replace('/login?error=oauth_failed');
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [router]);

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
