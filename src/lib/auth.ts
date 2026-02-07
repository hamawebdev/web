// @ts-nocheck
// Simplified auth module - API only, no mock data or fallbacks
import { LegacyUser } from '@/types/auth';

// Get current user from localStorage only (no API fallback)
export function getCurrentUser(): LegacyUser | null {
  if (typeof window === 'undefined') return null; // SSR check

  const stored = localStorage.getItem('auth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If parsing fails, clear the invalid data
      localStorage.removeItem('auth_user');
    }
  }

  return null;
}

// Async version for compatibility (no API calls)
export async function getCurrentUserAsync(): Promise<LegacyUser | null> {
  return getCurrentUser();
}

// Simple logout function (localStorage only)
export async function logout(): Promise<void> {
  localStorage.removeItem('auth_user');
}