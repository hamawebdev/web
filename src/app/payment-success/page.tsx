// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { VerifiedCheck } from '@solar-icons/react';
import { AuthAPI } from '@/lib/auth-api';
import { toast } from 'sonner';

export default function PaymentSuccessPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();

  // Handle keyboard navigation and accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !isLoading) {
        handleGoToDashboard();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading]);

  const handleGoToDashboard = async (isRetry = false) => {
    setIsLoading(true);
    if (!isRetry) {
      setError(null);
    }

    try {
      // Refresh user token using the auth API
      console.log('🔄 PaymentSuccess: Refreshing user token...', { attempt: retryCount + 1 });
      await AuthAPI.refreshTokens();
      console.log('✅ PaymentSuccess: Token refresh successful');

      // Reset retry count on success
      setRetryCount(0);

      // Show success message
      toast.success('Session actualisée avec succès');

      // Redirect to student dashboard
      router.push('/student/dashboard');
    } catch (error) {
      console.error('❌ PaymentSuccess: Token refresh failed:', error);

      // Default user-facing message per requirements
      let errorMessage = 'Impossible d’actualiser la session. Veuillez réessayer.';

      // Increment retry counter (manual retries only)
      setRetryCount(prev => prev + 1);

      // Refine message based on known API error patterns
      if (error instanceof Error) {
        if (error.message.includes('No refresh token available') ||
            error.message.includes('Invalid refresh token') ||
            error.message.includes('Refresh token has expired')) {
          errorMessage = 'Votre session a expiré. Redirection vers la page de connexion...';
        } else if (error.message.includes('User account not found') ||
                   error.message.includes('account has been deactivated')) {
          errorMessage = 'Problème avec votre compte. Veuillez contacter le support.';
        }
      }

      // If multiple failures, redirect to login
      const failures = retryCount + 1;
      if (failures >= 2 || errorMessage.includes('session a expiré')) {
        setError('Échec après plusieurs tentatives. Redirection vers la page de connexion...');
        toast.error('Échec après plusieurs tentatives. Redirection vers la page de connexion...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
        <Card className="glass border-border/20 card-hover-lift animate-fade-in-up shadow-lg sm:shadow-xl md:shadow-2xl mx-auto">
          <CardHeader className="text-center space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 pb-4 sm:pb-5 md:pb-6 lg:pb-8 px-4 sm:px-6 md:px-8">
            {/* Success Icon */}
            <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <VerifiedCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-primary" />
            </div>

            {/* Success Title */}
            <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-foreground text-center">
              Welcome To MedADN ❤️
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10 lg:pb-12 flex flex-col items-center">
            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 md:p-5 lg:p-6 bg-destructive/10 border border-destructive/20 rounded-xl animate-slide-up">
                <p className="text-destructive text-xs sm:text-sm md:text-base lg:text-lg font-medium text-center leading-relaxed">{error}</p>
              </div>
            )}

            {/* Dashboard Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleGoToDashboard}
                disabled={isLoading}
                className="
                  w-full md:w-auto md:min-w-[280px] lg:w-[320px] xl:w-[360px]
                  h-11 sm:h-12 md:h-13 lg:h-14 xl:h-16
                  bg-primary hover:bg-primary/90 text-primary-foreground font-semibold
                  transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                  text-sm sm:text-base md:text-lg lg:text-xl
                  touch-target
                "
                size="lg"
              >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 animate-spin" />
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">Actualisation en cours...</span>
                </>
              ) : (
                <>
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Go to Dashboard</span>
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                </>
              )}
              </Button>
            </div>

            {/* Retry Button (shown on error) */}
            {error && (
              <div className="flex justify-center">
                <Button
                  onClick={() => handleGoToDashboard(true)}
                  disabled={isLoading}
                  variant="outline"
                  className="
                    w-full md:w-auto md:min-w-[240px] lg:w-[280px] xl:w-[320px]
                    h-10 sm:h-11 md:h-12 lg:h-13 xl:h-14
                    mt-2 text-sm sm:text-base md:text-lg lg:text-xl
                    touch-target
                  "
                >
                  R\u00e9essayer
                </Button>
              </div>
            )}



          </CardContent>
        </Card>
      </div>
    </div>
  );
}
