/**
 * Central runtime configuration for the web app.
 *
 * NEXT_PUBLIC_* values are inlined into the client bundle at build time, so they
 * must be referenced literally as `process.env.NEXT_PUBLIC_X` (no destructuring,
 * no dynamic keys) for Next.js to replace them. They are public by design:
 * never put secrets in NEXT_PUBLIC_* variables.
 */

const DEFAULT_API_BASE_URL = 'https://api.med-adn.com/api/v1';
const DEFAULT_APP_URL = 'https://med-adn.com';

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

/** Backend REST base URL, e.g. https://api.med-adn.com/api/v1 (no trailing slash). */
export const API_BASE_URL: string = stripTrailingSlashes(
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL,
);

/** Backend origin, e.g. https://api.med-adn.com. Media paths (/api/v1/media/...) resolve against it. */
export const API_ORIGIN: string = new URL(API_BASE_URL).origin;

/** Public URL of this web app, e.g. https://med-adn.com (no trailing slash). */
export const APP_URL: string = stripTrailingSlashes(
  process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL,
);
