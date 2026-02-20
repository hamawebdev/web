// @ts-nocheck
'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';
import { VerifiedCheck } from '@solar-icons/react';
import { refreshAuthForUpdatedSubscription } from '@/lib/payment-auth-refresh';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [syncState, setSyncState] = useState<'syncing' | 'ready' | 'failed'>('syncing');
    const [syncMessage, setSyncMessage] = useState('Finalizing payment and syncing your subscription...');
    const [attemptNumber, setAttemptNumber] = useState(0);
    const [isNavigating, setIsNavigating] = useState(false);

    const syncSubscriptionAccess = useCallback(async (): Promise<boolean> => {
        setSyncState('syncing');
        setSyncMessage('Finalizing payment and syncing your subscription...');
        setAttemptNumber(0);

        const result = await refreshAuthForUpdatedSubscription({
            maxAttempts: 20,
            delayMs: 1500,
            onAttempt: (attempt) => setAttemptNumber(attempt),
        });

        if (result.hasActiveSubscription) {
            setSyncState('ready');
            setSyncMessage('Subscription activated. Redirecting to your dashboard...');
            return true;
        }

        setSyncState('failed');
        setSyncMessage(
            result.error || 'Subscription sync is still pending. Please retry to refresh your access.',
        );
        return false;
    }, []);

    useEffect(() => {
        let isMounted = true;

        const runInitialSync = async () => {
            const synced = await syncSubscriptionAccess();
            if (!isMounted || !synced) {
                return;
            }

            setIsNavigating(true);
            router.replace('/student/dashboard');
        };

        runInitialSync();

        return () => {
            isMounted = false;
        };
    }, [router, syncSubscriptionAccess]);

    const handlePrimaryAction = async () => {
        if (isNavigating || syncState === 'syncing') {
            return;
        }

        if (syncState === 'failed') {
            const synced = await syncSubscriptionAccess();
            if (!synced) {
                return;
            }
        }

        setIsNavigating(true);
        router.push('/student/dashboard');
    };

    const buttonLabel =
        syncState === 'syncing'
            ? `Syncing Access${attemptNumber ? ` (${attemptNumber}/20)` : ''}`
            : syncState === 'failed'
                ? 'Retry Access Sync'
                : 'Go to Dashboard';

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
                        <p className="text-sm md:text-base text-muted-foreground text-center max-w-lg">
                            {syncMessage}
                        </p>

                        {/* Dashboard Button */}
                        <div className="flex justify-center">
                            <Button
                                onClick={handlePrimaryAction}
                                disabled={syncState === 'syncing' || isNavigating}
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
                                {syncState === 'syncing' || isNavigating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                                    {isNavigating ? 'Opening Dashboard...' : buttonLabel}
                                </span>
                                {syncState !== 'syncing' && !isNavigating ? (
                                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                                ) : null}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
