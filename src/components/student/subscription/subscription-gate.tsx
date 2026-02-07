// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Crown,
  Star,
  Clock,
  CheckCircle,
  X,
  Zap,
  Shield,
  Gift,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSubscriptionAccess, useSubscriptionActions, useSubscriptionPlans, getSubscriptionBenefits } from '@/hooks/use-subscription';
import { DataLoadingState } from '@/components/loading-states';
import { cn } from '@/lib/utils';

interface SubscriptionGateProps {
  contentId: number;
  contentType: 'study-pack' | 'course';
  contentTitle: string;
  contentDescription?: string;
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

export function SubscriptionGate({
  contentId,
  contentType,
  contentTitle,
  contentDescription,
  children,
  fallbackComponent
}: SubscriptionGateProps) {
  const router = useRouter();
  const { access, loading, error } = useSubscriptionAccess(contentId, contentType);
  const { plans, loading: plansLoading } = useSubscriptionPlans(contentId, contentType);
  const { startFreeTrial, createCheckoutSession, loading: actionLoading } = useSubscriptionActions();
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // If loading or has access, show content
  if (loading) {
    return <DataLoadingState loading={true} error={null} children={null} />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to verify access. Please try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (access?.hasAccess) {
    return <>{children}</>;
  }

  // Show subscription gate
  return (
    <>
      {fallbackComponent || (
        <div className="min-h-screen" style={{ background: 'var(--background)' }}>
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Premium Content</h1>
              <p className="text-muted-foreground text-lg">
                Unlock "{contentTitle}" with a subscription
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  {contentTitle}
                </CardTitle>
                {contentDescription && (
                  <CardDescription className="text-base">
                    {contentDescription}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium mb-2">Premium Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      Expertly crafted content by medical professionals
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium mb-2">Comprehensive</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete coverage of essential topics and concepts
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Zap className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium mb-2">Interactive</h3>
                    <p className="text-sm text-muted-foreground">
                      Engaging quizzes, videos, and hands-on exercises
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="text-center space-y-4">
                  {access?.trialAvailable && (
                    <Button
                      size="lg"
                      className="gap-2"
                      onClick={() => startFreeTrial(access.subscriptionType || 'premium')}
                      disabled={actionLoading}
                    >
                      <Gift className="h-4 w-4" />
                      Start 7-Day Free Trial
                    </Button>
                  )}
                  
                  <Button
                    size="lg"
                    variant={access?.trialAvailable ? "outline" : "default"}
                    className="gap-2"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Crown className="h-4 w-4" />
                    View Subscription Plans
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Cancel anytime • No long-term commitment
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What's Included Preview */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>
                  Get access to premium features and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getSubscriptionBenefits(access?.subscriptionType || 'premium').map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Subscribe to Access Content
            </DialogTitle>
            <DialogDescription>
              Subscribe to "{contentTitle}" or choose an alternative study pack
            </DialogDescription>
          </DialogHeader>

          <DataLoadingState
            loading={plansLoading}
            error={null}
            data={plans}
            emptyMessage="No study packs available"
          >
            <div className="space-y-8">
              {/* Primary Study Pack (the one they're trying to access) */}
              {plans?.filter(plan => plan.isPrimary).map((plan: any) => (
                <div key={`primary-${plan.id}`} className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Subscribe to Access This Content</h3>
                    <p className="text-sm text-muted-foreground">Get full access to "{plan.name}"</p>
                  </div>

                  <Card className="relative ring-2 ring-primary shadow-lg max-w-md mx-auto">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Required for Access
                      </Badge>
                    </div>

                    <CardHeader className="text-center">
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <div className="text-4xl font-bold">
                        {plan.price} {plan.currency}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{plan.duration}
                        </span>
                      </div>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                      {plan.type && (
                        <Badge variant="outline" className="w-fit mx-auto mt-2">
                          {plan.type} {plan.yearNumber && `- Year ${plan.yearNumber}`}
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.map((feature: string, featureIndex: number) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        {access?.trialAvailable && (
                          <Button
                            size="lg"
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() => startFreeTrial(plan.id.toString())}
                            disabled={actionLoading}
                          >
                            <Gift className="h-4 w-4" />
                            Start Free Trial
                          </Button>
                        )}

                        <Button
                          size="lg"
                          className="w-full gap-2"
                          onClick={() => createCheckoutSession(plan.id.toString())}
                          disabled={actionLoading}
                        >
                          <CreditCard className="h-4 w-4" />
                          Subscribe Now
                        </Button>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          {plan.statistics?.subscribersCount || 0} students already subscribed
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Alternative Study Packs */}
              {plans?.filter(plan => !plan.isPrimary).length > 0 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Or Choose an Alternative</h3>
                    <p className="text-sm text-muted-foreground">Other study packs you might be interested in</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans?.filter(plan => !plan.isPrimary).map((plan: any) => (
                      <Card
                        key={plan.id}
                        className="hover:shadow-lg transition-all duration-200"
                      >
                        <CardHeader className="text-center">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <div className="text-2xl font-bold">
                            {plan.price} {plan.currency}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.duration}
                            </span>
                          </div>
                          <CardDescription className="text-sm">
                            {plan.description}
                          </CardDescription>
                          {plan.type && (
                            <Badge variant="outline" className="w-fit mx-auto mt-2">
                              {plan.type} {plan.yearNumber && `- Year ${plan.yearNumber}`}
                            </Badge>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            {plan.features.slice(0, 4).map((feature: string, featureIndex: number) => (
                              <div key={featureIndex} className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm">{feature}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() => createCheckoutSession(plan.id.toString())}
                            disabled={actionLoading}
                          >
                            <CreditCard className="h-4 w-4" />
                            Subscribe
                          </Button>

                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">
                              {plan.statistics?.subscribersCount || 0} students subscribed
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DataLoadingState>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              All subscriptions include full access • Cancel anytime
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
