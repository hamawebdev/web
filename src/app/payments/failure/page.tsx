// @ts-nocheck
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, RotateCcw, AlertCircle } from 'lucide-react';

export default function PaymentFailurePage() {
    const router = useRouter();

    const handleRetryPayment = () => {
        // Navigate back to the subscription/pricing page to retry
        router.push('/student/subscription');
    };

    const handleGoBack = () => {
        // Navigate to the student dashboard
        router.push('/student/dashboard');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-background to-secondary/5" />

            <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
                <Card className="glass border-border/20 card-hover-lift animate-fade-in-up shadow-lg sm:shadow-xl md:shadow-2xl mx-auto">
                    <CardHeader className="text-center space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 pb-4 sm:pb-5 md:pb-6 lg:pb-8 px-4 sm:px-6 md:px-8">
                        {/* Failure Icon */}
                        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-destructive" />
                        </div>

                        {/* Failure Title */}
                        <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-foreground text-center">
                            Échec du Paiement
                        </CardTitle>

                        <CardDescription className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground text-center max-w-md mx-auto">
                            {"Une erreur s'est produite lors du traitement de votre paiement. Votre compte n'a pas été débité."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10 lg:pb-12 flex flex-col items-center">
                        {/* Retry Button */}
                        <div className="flex justify-center w-full">
                            <Button
                                onClick={handleRetryPayment}
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
                                <RotateCcw className="mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Réessayer le Paiement</span>
                            </Button>
                        </div>

                        {/* Go Back Button */}
                        <div className="flex justify-center w-full">
                            <Button
                                onClick={handleGoBack}
                                variant="outline"
                                className="
                  w-full md:w-auto md:min-w-[240px] lg:w-[280px] xl:w-[320px]
                  h-10 sm:h-11 md:h-12 lg:h-13 xl:h-14
                  text-sm sm:text-base md:text-lg lg:text-xl
                  touch-target
                "
                            >
                                <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                Retour au Tableau de Bord
                            </Button>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-sm">
                            Si le problème persiste, veuillez contacter notre support à support@med-adn.com
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
