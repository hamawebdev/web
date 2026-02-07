// @ts-nocheck
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DataLoadingState } from '@/components/loading-states';
import { PaymentService, StudentService } from '@/lib/api-services';
import {
  CreditCard,
  Smartphone,
  Shield,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Crown,
  RefreshCw
} from 'lucide-react';
import type { StudyPack, PaymentMethod, PaymentDurationType } from '@/types/api';
import { getPaymentTranslations, formatDuration, type PaymentLocale } from '@/lib/translations/payment';

interface PaymentPageProps { }

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL parameters
  const studyPackId = searchParams.get('studyPackId');
  const durationType = searchParams.get('durationType') as PaymentDurationType;
  const durationValue = searchParams.get('durationValue');

  // State
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('edahabia');
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [networkError, setNetworkError] = useState(false);
  const [locale] = useState<PaymentLocale>(() => {
    // Get locale from URL params or browser language, default to Arabic
    const urlLocale = searchParams.get('locale') as PaymentLocale;
    if (urlLocale && ['ar', 'en', 'fr'].includes(urlLocale)) {
      return urlLocale;
    }

    // Try to detect from browser language
    const browserLang = typeof window !== 'undefined' ? window.navigator.language.split('-')[0] : 'ar';
    if (['ar', 'en', 'fr'].includes(browserLang)) {
      return browserLang as PaymentLocale;
    }

    return 'ar'; // Default to Arabic
  });

  // Get translations for current locale
  const t = getPaymentTranslations(locale);
  const isRTL = locale === 'ar';

  // Redirect if missing required parameters
  useEffect(() => {
    if (!studyPackId || !durationType || !durationValue) {
      router.push('/student/subscriptions/browse');
      return;
    }
  }, [studyPackId, durationType, durationValue, router]);

  // Load study pack data with retry logic
  const loadStudyPack = useCallback(async (isRetry = false) => {
    if (!studyPackId) return;

    try {
      setLoading(true);
      setError(null);
      setNetworkError(false);

      const response = await StudentService.getStudyPacks({ page: 1, limit: 100 });
      const data = (response as any)?.data?.data || (response as any)?.data || response;
      // Handle the response structure where items are nested under data.items
      const packs = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const pack = packs.find((p: StudyPack) => p.id === parseInt(studyPackId));
      if (!pack) {
        throw new Error(t.studyPackNotFound);
      }

      setStudyPack(pack);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      const isNetworkIssue = err?.code === 'NETWORK_ERROR' || err?.message?.includes('fetch') || err?.message?.includes('network');
      setNetworkError(isNetworkIssue);
      setError(err?.message || t.studyPackNotFound);

    } finally {
      setLoading(false);
    }
  }, [studyPackId, t.studyPackNotFound]);

  useEffect(() => {
    loadStudyPack();
  }, [loadStudyPack]);

  // Calculate pricing and duration info
  const pricingInfo = useMemo(() => {
    if (!studyPack || !durationType || !durationValue) return null;

    const duration = parseInt(durationValue);
    let price = 0;
    let totalPrice = 0;
    let periodText = '';

    if (durationType === 'yearly') {
      price = studyPack.pricePerYear || studyPack.price || 0;
      totalPrice = price * duration;
      periodText = formatDuration('yearly', duration, locale);
    } else {
      price = studyPack.pricePerMonth || studyPack.price || 0;
      totalPrice = price * duration;
      periodText = formatDuration('monthly', duration, locale);
    }

    return {
      price,
      totalPrice,
      duration,
      periodText,
      pricePerPeriod: `${price} DA`,
      totalPriceText: `${totalPrice} DA`
    };
  }, [studyPack, durationType, durationValue]);

  // Payment method icon component
  const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
    const iconProps = { className: "h-8 w-8" };

    switch (method) {
      case 'edahabia':
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
            <CreditCard {...iconProps} />
          </div>
        );
      case 'cib':
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <CreditCard {...iconProps} />
          </div>
        );
      case 'chargily_app':
        return (
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-700 text-white">
            <Smartphone {...iconProps} />
          </div>
        );
      default:
        return <CreditCard {...iconProps} className="text-muted-foreground" />;
    }
  };

  // Payment method options
  const paymentMethods = [
    {
      id: 'edahabia' as PaymentMethod,
      name: t.edahabia.name,
      description: t.edahabia.description,
      recommended: true,
      processingTime: t.instant,
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      id: 'cib' as PaymentMethod,
      name: t.cib.name,
      description: t.cib.description,
      recommended: false,
      processingTime: t.oneToTwoMinutes,
      color: 'from-blue-500 to-blue-700'
    },
    {
      id: 'chargily_app' as PaymentMethod,
      name: t.chargilyApp.name,
      description: t.chargilyApp.description,
      recommended: false,
      processingTime: t.instant,
      color: 'from-green-500 to-green-700'
    }
  ];

  // Handle payment submission with retry logic
  const handlePayment = async (isRetry = false) => {
    if (!studyPack || !pricingInfo) return;

    try {
      setIsProcessing(true);
      setNetworkError(false);

      const paymentRequest = {
        studyPackId: studyPack.id,
        paymentDuration: {
          type: durationType,
          ...(durationType === 'monthly' ? { months: pricingInfo.duration } : { years: pricingInfo.duration })
        },
        locale,
        paymentMethod: selectedPaymentMethod
      };

      // Validate request
      const validation = PaymentService.validatePaymentRequest(paymentRequest);
      if (!validation.isValid) {
        return;
      }

      // Create checkout session with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );

      const response = await Promise.race([
        PaymentService.createCheckoutSession(paymentRequest),
        timeoutPromise
      ]) as any;

      if (response.success && response.data?.checkoutUrl) {
        // Redirect to payment provider
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error(response.error || 'Failed to create checkout session');
      }

    } catch (err: any) {
      console.error('Payment error:', err);

      const isNetworkIssue = err?.code === 'NETWORK_ERROR' ||
        err?.message?.includes('fetch') ||
        err?.message?.includes('network') ||
        err?.message?.includes('timeout');

      setNetworkError(isNetworkIssue);

      if (isNetworkIssue && retryCount < 3) {
        setRetryCount(prev => prev + 1);

        // Retry after delay
        setTimeout(() => handlePayment(true), 2000);
        return;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Loading skeleton */}
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="h-9 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                          <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-px bg-muted" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-muted" />
                    <div className="flex justify-between">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !loading) {
    return (
      <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Card>
            <CardContent className={`py-8 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t.paymentSetupError}</h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
              <div className="flex gap-4 justify-center">
                {networkError && (
                  <Button onClick={() => loadStudyPack(true)} variant="outline">
                    <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    Retry
                  </Button>
                )}
                <Button onClick={() => router.push('/student/subscriptions/browse')}>
                  <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.backButton}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`} style={{ background: 'var(--background)' }} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <style jsx>{`
          .payment-method-card {
            transition: all 0.2s ease-in-out;
          }
          .payment-method-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }
          .payment-method-card[data-selected="true"] {
            border-color: hsl(var(--primary));
            background-color: hsl(var(--primary) / 0.05);
          }
          .payment-gradient {
            background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
          }
          .security-badge {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
        `}</style>
        {/* Header */}
        <div className={`flex items-center gap-4 mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/student/subscriptions/browse')}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.backButton}
          </Button>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h1 className="text-3xl font-bold tracking-tight">{t.pageTitle}</h1>
            <p className="text-muted-foreground">
              {t.pageSubtitle}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Order Summary */}
          <div>
            <Card className="sticky top-8 shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
                <CardTitle className={`flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  {t.orderSummaryTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Study Pack Info */}
                <div>
                  <h3 className="font-semibold">{studyPack.name}</h3>
                  <p className="text-sm text-muted-foreground">{studyPack.description}</p>
                </div>

                <Separator />

                {/* Pricing Details */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t.duration}</span>
                    <span>{pricingInfo.periodText}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{durationType === 'yearly' ? t.pricePerYear : t.pricePerMonth}</span>
                    <span>{pricingInfo.pricePerPeriod}</span>
                  </div>
                  {pricingInfo.duration > 1 && (
                    <div className="flex justify-between text-sm">
                      <span>{t.quantity}</span>
                      <span>×{pricingInfo.duration}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>{t.total}</span>
                  <span className="text-lg">{pricingInfo.totalPriceText}</span>
                </div>

                {/* Network Status */}
                {networkError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className={`flex items-center gap-2 text-sm text-destructive ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertCircle className="h-4 w-4" />
                      <span>Network connection issue. Please check your internet and try again.</span>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <Button
                  className="w-full payment-gradient text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                  size="lg"
                  onClick={() => handlePayment()}
                  disabled={isProcessing || networkError}
                >
                  {isProcessing ? (
                    <>
                      <div className={`animate-spin rounded-full h-5 w-5 border-b-2 border-white ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-lg">
                        {retryCount > 0 ? `${t.processing} (${retryCount}/3)` : t.processing}
                      </span>
                    </>
                  ) : networkError ? (
                    <>
                      <AlertCircle className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-lg">Network Error</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                      <span className="text-lg">{t.payButton} {pricingInfo.totalPriceText}</span>
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage({ }: PaymentPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
              <div className="h-9 w-20 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                          <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-px bg-muted" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <div className="h-px bg-muted" />
                    <div className="flex justify-between">
                      <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
