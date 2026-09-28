'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { AdminService } from '@/lib/api-services';
import { getApiErrorMessage } from '@/lib/api-error';
import { AdminSubscription, AdminUserListItem } from '@/types/api';

interface UserSubscriptionsDialogProps {
  user: AdminUserListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReactivate: (subscriptionId: number, dates: { startDate: string; endDate: string }) => Promise<unknown>;
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * How a subscription reads for the admin. grantsAccess comes from the API (ACTIVE and
 * not past its end date). An ACTIVE one past its end date is expired: nothing flips
 * those to EXPIRED. Expired and cancelled subscriptions can be re-activated.
 */
function subscriptionState(subscription: AdminSubscription): { label: string; variant: BadgeVariant; canReactivate: boolean } {
  if (subscription.grantsAccess) return { label: 'Active', variant: 'default', canReactivate: false };
  switch (subscription.status) {
    case 'ACTIVE':
    case 'EXPIRED':
      return { label: 'Expired', variant: 'secondary', canReactivate: true };
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'outline', canReactivate: true };
    default:
      return { label: 'Pending payment', variant: 'outline', canReactivate: false };
  }
}

/** yyyy-mm-dd of a local date, the value format of <input type="date"> */
function toDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Local start or end of a yyyy-mm-dd day: access runs from the first to the last picked day included */
function dayBoundary(value: string, end: boolean): Date {
  const [year, month, day] = value.split('-').map(Number);
  return end ? new Date(year, month - 1, day, 23, 59, 59, 999) : new Date(year, month - 1, day);
}

function defaultDates() {
  const start = new Date();
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1); // packs are sold yearly
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

export function UserSubscriptionsDialog({ user, open, onOpenChange, onReactivate }: UserSubscriptionsDialogProps) {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: number; startDate: string; endDate: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoadError(null);
      const response = await AdminService.getSubscriptions({ userId: user.id, limit: 100 });
      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : 'Failed to load subscriptions');
      }
      setSubscriptions(((response.data as any)?.items ?? []) as AdminSubscription[]);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Failed to load subscriptions'));
    }
  }, [user.id]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const startEditing = (subscriptionId: number) => {
    setFormError(null);
    setEditing({ id: subscriptionId, ...defaultDates() });
  };

  const handleReactivate = async () => {
    if (!editing) return;
    if (!editing.startDate || !editing.endDate) {
      setFormError('Pick a start date and an end date.');
      return;
    }
    const start = dayBoundary(editing.startDate, false);
    const end = dayBoundary(editing.endDate, true);
    if (end <= start) {
      setFormError('The end date must be on or after the start date.');
      return;
    }
    if (end <= new Date()) {
      setFormError('The end date must be today or later.');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      await onReactivate(editing.id, { startDate: start.toISOString(), endDate: end.toISOString() });
      setEditing(null);
      await loadSubscriptions();
    } catch {
      // The error is shown by onReactivate; keep the form open
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subscriptions</DialogTitle>
          <DialogDescription>
            {user.fullName} ({user.email})
          </DialogDescription>
        </DialogHeader>

        {!user.isActive && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This account is deactivated. It stays non-active and cannot sign in until you
              re-activate the account with Edit User, even with an active subscription.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          {loadError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between gap-2">
                {loadError}
                <Button variant="outline" size="sm" onClick={loadSubscriptions}>Retry</Button>
              </AlertDescription>
            </Alert>
          ) : subscriptions === null ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">This user has no subscriptions.</p>
          ) : (
            subscriptions.map((subscription) => {
              const state = subscriptionState(subscription);
              const isEditing = editing?.id === subscription.id;
              return (
                <div key={subscription.id} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{subscription.studyPack.name}</span>
                        <Badge variant={state.variant}>{state.label}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {new Date(subscription.startDate).toLocaleDateString()} to {new Date(subscription.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    {state.canReactivate && !isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(subscription.id)}
                        disabled={saving}
                        className="shrink-0"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Re-activate
                      </Button>
                    )}
                  </div>

                  {isEditing && editing && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`start-${subscription.id}`}>Start date</Label>
                          <Input
                            id={`start-${subscription.id}`}
                            type="date"
                            value={editing.startDate}
                            onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`end-${subscription.id}`}>End date</Label>
                          <Input
                            id={`end-${subscription.id}`}
                            type="date"
                            value={editing.endDate}
                            min={toDateInput(new Date())}
                            onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The student can open this pack again as soon as you confirm, until the end of the end date.
                      </p>
                      {formError && <p className="text-sm text-destructive">{formError}</p>}
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(null)} disabled={saving}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleReactivate} disabled={saving}>
                          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Re-activate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
