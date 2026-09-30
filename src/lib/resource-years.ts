/**
 * Which years the student resources page offers, and to whom.
 *
 * A residency student is anyone with an active subscription to a Résidanat pack
 * (type RESIDENCY): status ACTIVE and end date not passed, the rule the API applies.
 * A year pack never makes a student a residency student, whatever its year.
 * Residency students pick any year that has an active year pack; everyone else
 * sees the content of their own packs, with no year to pick.
 *
 * Free of app imports so `node --test` can load it.
 */

export const YEAR_LEVELS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'] as const;
export type YearLevel = typeof YEAR_LEVELS[number];

/** The six study years, offered when the pack list cannot be loaded */
export const FALLBACK_RESOURCE_YEARS: YearLevel[] = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'];

type SubscriptionLike = { status?: unknown; endDate?: unknown; studyPack?: { type?: unknown } | null } | null;
type PackLike = { type?: unknown; yearNumber?: unknown; isActive?: unknown } | null;

/** Whether a subscription is to a Résidanat pack (type RESIDENCY). A year pack never is, whatever its year. */
export function isResidencyPackSubscription(sub: SubscriptionLike): boolean {
  return String(sub?.studyPack?.type ?? '').toUpperCase() === 'RESIDENCY';
}

/** Whether GET /students/subscriptions holds an active Résidanat pack subscription */
export function isResidencyStudent(subscriptions: unknown, now: number = Date.now()): boolean {
  if (!Array.isArray(subscriptions)) return false;
  return subscriptions.some((sub: SubscriptionLike) => {
    if (!sub || String(sub.status ?? '').toUpperCase() !== 'ACTIVE') return false;
    if (!isResidencyPackSubscription(sub)) return false;
    const end = new Date(sub.endDate as string).getTime();
    return Number.isFinite(end) && end > now;
  });
}

/**
 * Years that have an active year pack, in study order. The Résidanat pack has no
 * year: its courses are copies of year courses and carry no resources or books.
 */
export function yearsWithYearPack(packs: unknown): YearLevel[] {
  const list: PackLike[] = Array.isArray(packs) ? packs : [];
  const years = new Set(
    list
      .filter(pack => pack && String(pack.type ?? '').toUpperCase() === 'YEAR' && pack.isActive !== false)
      .map(pack => String(pack?.yearNumber ?? '').toUpperCase())
  );
  return YEAR_LEVELS.filter(year => years.has(year));
}

/** The year the page opens on: 1st year, or the first year offered */
export function defaultResourceYear(years: readonly YearLevel[]): YearLevel | null {
  return years.includes('ONE') ? 'ONE' : years[0] ?? null;
}
