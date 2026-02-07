// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  AlertCircle,
  Crown,
  Gift
} from 'lucide-react';
import { StudentService } from '@/lib/api-services';
import { useRouter } from 'next/navigation';
import type { UserSubscription } from '@/types/api';
import { useStudentAuth } from '@/hooks/use-auth';
import { DataLoadingState } from '@/components/loading-states';



export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useStudentAuth();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load subscriptions using the working /students/subscriptions endpoint
  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the StudentService to get subscriptions
      const response: any = await StudentService.getSubscriptions();

      // Handle multiple possible API response shapes robustly
      let list: any[] = [];

      if (Array.isArray(response)) {
        // Backend returned a raw array (no wrapper)
        list = response;
      } else if (response && typeof response === 'object') {
        // Common wrapper: { success, data }
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Nested known shapes
          if (Array.isArray(response.data.subscriptions)) {
            list = response.data.subscriptions;
          } else if (Array.isArray(response.data.data)) {
            list = response.data.data;
          } else if (Array.isArray(response.data.items)) {
            list = response.data.items;
          }
        }

        // If wrapper indicates failure
        if (!list.length && response.success === false) {
          setError(typeof response.error === 'string' ? response.error : 'Failed to load subscription data');
        }
      }

      setSubscriptions(Array.isArray(list) ? (list as UserSubscription[]) : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadSubscriptions();
    }
  }, [isAuthenticated, authLoading]);

  if (authLoading) {
    return <DataLoadingState />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">My Subscriptions</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/student/subscriptions/browse')}>
              Browse Plans
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <DataLoadingState />
        ) : error ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Subscriptions</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadSubscriptions}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : subscriptions.length === 0 ? (
          <EmptySubscriptionsState />
        ) : (
          <SubscriptionsDisplay subscriptions={subscriptions} />
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptySubscriptionsState() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-2xl font-semibold mb-2">No Active Subscriptions</h3>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            You don&apos;t have any active subscriptions yet. Browse our study packs to get started with your medical education journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/student/subscriptions/browse')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Plans
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Component to display subscriptions
function SubscriptionsDisplay({ subscriptions }: { subscriptions: UserSubscription[] }) {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
  const inactiveSubscriptions = subscriptions.filter(sub => sub.status !== 'ACTIVE');

  return (
    <div className="space-y-8">
      
      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSubscriptions.map((subscription, index) => (
              <div key={subscription.id} className={`animate-fade-in-up ${index === 0 ? 'animate-delay-100' : index === 1 ? 'animate-delay-200' : 'animate-delay-300'}`}>
                <SubscriptionCard subscription={subscription} />
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}

// Individual subscription card
function SubscriptionCard({ subscription }: { subscription: UserSubscription }) {
  const now = new Date();
  const start = new Date(subscription.startDate);
  const end = new Date(subscription.endDate);

  // Derive active state from dates and status
  const isTimeActive = end.getTime() >= now.getTime();
  const isActive = subscription.status === 'ACTIVE' && isTimeActive;

  const getStatusVariant = (
    status: string,
    isActiveFlag: boolean
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!isActiveFlag) return 'secondary';
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'EXPIRED':
        return 'destructive';
      case 'INACTIVE':
      case 'CANCELLED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={`${isActive ? 'border-chart-2/30 bg-chart-2/5 card-hover-lift' : 'border-border bg-muted/20'} transition-all duration-300`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {subscription.studyPack?.name}
            </CardTitle>
            {subscription.studyPack?.description && (
              <CardDescription>
                {subscription.studyPack.description}
              </CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getStatusVariant(subscription.status, isActive)}>
              {subscription.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />

        {/* Subscription Details */}
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium">
              {new Date(subscription.startDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">End Date</span>
            <span className="font-medium">
              {new Date(subscription.endDate).toLocaleDateString()}
            </span>
          </div>
          {subscription.paymentReference && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment Reference</span>
              <span className="font-medium text-xs font-mono text-muted-foreground">
                {subscription.paymentReference}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
