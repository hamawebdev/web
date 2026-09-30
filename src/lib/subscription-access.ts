/**
 * Whether a subscription gives access now: status ACTIVE and end date not passed,
 * the rule the API applies. Nothing flips a subscription to EXPIRED when its end
 * date passes, so an ACTIVE status alone can be a lapsed subscription.
 *
 * Free of app imports so `node --test` can load it.
 */
export function subscriptionGrantsAccess(
  subscription: { status?: unknown; endDate?: unknown } | null | undefined,
  now: number = Date.now()
): boolean {
  if (!subscription || String(subscription.status ?? '').toUpperCase() !== 'ACTIVE') return false;
  const end = new Date(subscription.endDate as string).getTime();
  return Number.isFinite(end) && end > now;
}
