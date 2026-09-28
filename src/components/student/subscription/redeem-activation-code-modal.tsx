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
import { getRedeemErrorMessage, REDEEM_ERROR_MESSAGES } from '@/lib/activation-code-errors';

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

  const handleRedeem = useCallback(async () => {
    if (!activationCode.trim()) {
      setErrorMessage(REDEEM_ERROR_MESSAGES.EMPTY);
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
        setErrorMessage(getRedeemErrorMessage(response));
      }
    } catch (error: any) {
      // The apiClient rejects with { error, statusCode, code?, details? }: the backend's
      // code says why the redemption failed (already used, used up, expired, ...)
      console.error('Failed to redeem activation code:', error);
      setErrorMessage(getRedeemErrorMessage(error));
    } finally {
      setIsRedeeming(false);
    }
  }, [activationCode, onSuccess, router]);

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
              onChange={(e) => {
                setActivationCode(e.target.value);
                setErrorMessage(null);
              }}
              onKeyPress={handleKeyPress}
              disabled={isRedeeming}
              className="font-mono"
            />
            {errorMessage && (
              <p className="text-sm text-red-600 mt-1" role="alert">
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
