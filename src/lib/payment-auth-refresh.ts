// @ts-nocheck
import { AuthAPI } from './auth-api';

const TOKEN_STORAGE_KEY = 'auth_token';
const DEFAULT_MAX_ATTEMPTS = 20;
const DEFAULT_DELAY_MS = 1500;

interface RefreshAfterPaymentOptions {
  maxAttempts?: number;
  delayMs?: number;
  onAttempt?: (attempt: number) => void;
}

interface RefreshAfterPaymentResult {
  ok: boolean;
  hasActiveSubscription: boolean;
  attempts: number;
  error?: string;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return atob(`${normalized}${'='.repeat(padding)}`);
}

function getCurrentAccessTokenPayload(): any | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

function hasActiveSubscription(payload: any | null): boolean {
  if (!payload) {
    return false;
  }

  return (
    Boolean(payload.has_active_subscription) &&
    String(payload.payment_status || '').toLowerCase() === 'active'
  );
}

function isNonRecoverableRefreshError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('no refresh token available') ||
    lower.includes('refresh token not found') ||
    lower.includes('invalid refresh token') ||
    lower.includes('refresh token has expired')
  );
}

export async function refreshAuthForUpdatedSubscription(
  options: RefreshAfterPaymentOptions = {},
): Promise<RefreshAfterPaymentResult> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const onAttempt = options.onAttempt;

  const existingPayload = getCurrentAccessTokenPayload();
  if (hasActiveSubscription(existingPayload)) {
    return {
      ok: true,
      hasActiveSubscription: true,
      attempts: 0,
    };
  }

  let lastError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onAttempt?.(attempt);

    try {
      await AuthAPI.refreshTokens();

      const refreshedPayload = getCurrentAccessTokenPayload();
      if (hasActiveSubscription(refreshedPayload)) {
        return {
          ok: true,
          hasActiveSubscription: true,
          attempts: attempt,
        };
      }
    } catch (error: any) {
      lastError = error?.message || 'Failed to refresh authentication token';

      if (isNonRecoverableRefreshError(lastError)) {
        return {
          ok: false,
          hasActiveSubscription: false,
          attempts: attempt,
          error: lastError,
        };
      }
    }

    if (attempt < maxAttempts) {
      await sleep(delayMs);
    }
  }

  return {
    ok: false,
    hasActiveSubscription: false,
    attempts: maxAttempts,
    error: lastError || 'Subscription update is still processing. Please retry.',
  };
}
