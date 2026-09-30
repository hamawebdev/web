/**
 * Reading admin content answers whose shape differs from what the pages expected.
 *
 * Free of app imports so `node --test` can load it.
 */

/**
 * The resources in an answer of GET /courses/:id/resources. The API wraps a page
 * `{ items, total, page, limit, totalPages }` in the `{ success, data }` envelope;
 * a bare page or a bare array is accepted too.
 */
export function courseResourceItems<T = unknown>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  const payload: any = body && typeof body === 'object' && 'data' in body ? (body as any).data : body;
  if (Array.isArray(payload)) return payload as T[];
  const items = payload?.items ?? payload?.data?.items ?? payload?.data;
  return Array.isArray(items) ? (items as T[]) : [];
}

/**
 * The admin resources page lists a whole course at once (no paging), so it asks for
 * this many. The largest course holds 83 resources (2026-09).
 */
export const ADMIN_COURSE_RESOURCES_LIMIT = 1000;
