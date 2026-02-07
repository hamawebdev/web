// @ts-nocheck
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/loading-states/api-loading-states';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { SubscriptionService } from '@/lib/api-services';

interface RedeemActivationCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RedeemActivationCodeModal({
  open,
  onOpenChange,
  onSuccess
}: RedeemActivationCodeModalProps) {
  const router = useRouter();
  const [activationCode, setActivationCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to get French error messages based on API response
  const getErrorMessage = useCallback((error: any): string => {
    // Check if it's an API error with specific error codes
    if (error?.response?.data?.error?.details?.code) {
      const errorCode = error.response.data.error.details.code;
      switch (errorCode) {
        case 'ALREADY_REDEEMED':
          return 'Vous avez déjà utilisé ce code d\'activation.';
        case 'INVALID_CODE':
          return 'Code d\'activation invalide.';
        case 'EXPIRED':
          return 'Ce code d\'activation a expiré.';
        case 'EXHAUSTED':
          return 'Ce code a atteint sa limite d\'utilisation.';
        default:
          return 'Une erreur est survenue. Veuillez réessayer.';
      }
    }

    // Check status codes
    if (error?.response?.status === 401) {
      return 'Vous devez être connecté pour utiliser un code.';
    }
    if (error?.response?.status === 429) {
      return 'Trop de tentatives. Réessayez plus tard.';
    }

    // Default error message
    return 'Une erreur est survenue. Veuillez réessayer.';
  }, []);

  const handleRedeem = useCallback(async () => {
    if (!activationCode.trim()) {
      setErrorMessage('Please enter an activation code');
      return;
    }

    setIsRedeeming(true);
    setErrorMessage(null);

    try {
      const response = await SubscriptionService.redeemActivationCode(activationCode.trim());

      if (response.success) {
        // Success - redirect to payment-success page
        onSuccess?.();
        router.push('/payment-success');
      } else {
        // Handle API error response
        const errorMsg = getErrorMessage({ response: { data: response } });
        setErrorMessage(errorMsg);
      }
    } catch (error: any) {
      console.error('Failed to redeem activation code:', error);
      const errorMsg = getErrorMessage(error);
      setErrorMessage(errorMsg);
    } finally {
      setIsRedeeming(false);
    }
  }, [activationCode, onSuccess, router, getErrorMessage]);

  const handleClose = useCallback(() => {
    if (!isRedeeming) {
      setActivationCode('');
      setErrorMessage(null);
      onOpenChange(false);
    }
  }, [isRedeeming, onOpenChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRedeeming) {
      handleRedeem();
    }
  }, [handleRedeem, isRedeeming]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="activation-code">Activation Code</Label>
            <Input
              id="activation-code"
              placeholder="Enter your activation code"
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isRedeeming}
              className="font-mono"
            />
            {errorMessage && (
              <p className="text-sm text-red-600 mt-1">
                {errorMessage}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRedeem}
              disabled={isRedeeming || !activationCode.trim()}
            >
              {isRedeeming ? (
                <>
                  <LoadingSpinner size="sm" />
                  Redeeming...
                </>
              ) : (
                'Redeem'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
