'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTH_LOGOUT_EVENT, AUTH_TOKEN_STORAGE_KEY } from '@/lib/api-client';
import { idbClear } from '@/lib/idb-cache';

/**
 * Stale-while-revalidate cache for API reads the student pages need on every
 * visit (profile, subscriptions, content and session filters). A page shows the
 * last value it got right away, from memory or localStorage, and refreshes it in
 * the background; only the first visit waits for the network.
 *
 * Values are stored per signed-in user (the user id in the access token) and
 * cleared when the session ends. Concurrent requests for the same value share
 * one network call.
 */

const PREFIX = 'medadn:cache:v1:';
const MAX_STORED_ENTRIES = 40;

type Entry<T> = { value: T; savedAt: number };

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Map<string, Set<(entry: Entry<unknown>) => void>>();

/** Id of the signed-in user, read from the stored access token (null when signed out) */
export function cacheUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const part = token.split('.')[1];
    const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
    const id = payload?.user_data?.id ?? payload?.userId;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

function fullKey(key: string): string | null {
  const userId = cacheUserId();
  return userId ? `${PREFIX}${userId}:${key}` : null;
}

/** The key under which a value of the signed-in user is stored (null when signed out) */
export function userScopedKey(key: string): string | null {
  return fullKey(key);
}

export function readCache<T>(key: string): Entry<T> | null {
  const k = fullKey(key);
  if (!k) return null;
  const inMemory = memory.get(k);
  if (inMemory) return inMemory as Entry<T>;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Entry<T>;
    memory.set(k, entry);
    return entry;
  } catch {
    return null;
  }
}

function pruneStorage() {
  try {
    const entries: Array<{ key: string; savedAt: number }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      let savedAt = 0;
      try { savedAt = JSON.parse(localStorage.getItem(key) || '{}').savedAt || 0; } catch { /* unreadable: drop first */ }
      entries.push({ key, savedAt });
    }
    if (entries.length <= MAX_STORED_ENTRIES) return;
    entries.sort((a, b) => a.savedAt - b.savedAt);
    for (const { key } of entries.slice(0, entries.length - MAX_STORED_ENTRIES)) localStorage.removeItem(key);
  } catch {
    // storage unavailable
  }
}

export function writeCache<T>(key: string, value: T, options?: { persist?: boolean }): void {
  const k = fullKey(key);
  if (!k) return;
  const entry: Entry<T> = { value, savedAt: Date.now() };
  memory.set(k, entry);
  // Memory only (large values): drop an older stored copy so it is not read later
  if (options?.persist === false) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
    listeners.get(k)?.forEach(listener => listener(entry));
    return;
  }
  try {
    localStorage.setItem(k, JSON.stringify(entry));
  } catch {
    // Full or unavailable storage: make room once, the memory copy still works
    pruneStorage();
    try { localStorage.setItem(k, JSON.stringify(entry)); } catch { /* ignore */ }
  }
  pruneStorage();
  listeners.get(k)?.forEach(listener => listener(entry));
}

/** Forget one cached value (for example after a change the user made) */
export function invalidateCache(key: string): void {
  const k = fullKey(key);
  if (!k) return;
  memory.delete(k);
  try { localStorage.removeItem(k); } catch { /* ignore */ }
}

/** Forget every cached value of every user (logout, session ended) */
export function clearCachedResources(): void {
  memory.clear();
  inflight.clear();
  idbClear().catch(() => undefined);
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach(key => localStorage.removeItem(key));
  } catch {
    // storage unavailable
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(AUTH_LOGOUT_EVENT, clearCachedResources);
}

/**
 * Fetch a fresh value (one request at a time per key and user), store it and
 * hand it to every mounted hook reading the same key
 */
export function fetchFresh<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const k = fullKey(key) ?? `anonymous:${key}`;
  const running = inflight.get(k);
  if (running) return running as Promise<T>;
  const request = fetcher()
    .then(value => {
      writeCache(key, value);
      return value;
    })
    .finally(() => { inflight.delete(k); });
  inflight.set(k, request);
  return request;
}

function subscribe(key: string, listener: (entry: Entry<unknown>) => void): () => void {
  const k = fullKey(key);
  if (!k) return () => undefined;
  let set = listeners.get(k);
  if (!set) listeners.set(k, (set = new Set()));
  set.add(listener);
  return () => { set!.delete(listener); };
}

export type CachedResource<T> = {
  data: T | undefined;
  /** True only while nothing (not even a cached value) can be shown */
  loading: boolean;
  /** True while a fresh value is being fetched in the background */
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Read a value through the cache. `key` null disables the hook (nothing loaded).
 * The fetcher must return the unwrapped value and throw on failure.
 */
export function useCachedResource<T>(key: string | null, fetcher: () => Promise<T>): CachedResource<T> {
  const [state, setState] = useState<{ key: string | null; data: T | undefined; loading: boolean; refreshing: boolean; error: string | null }>(
    { key, data: undefined, loading: key !== null, refreshing: false, error: null }
  );
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (currentKey: string, hasValue: boolean) => {
    setState(prev => prev.key === currentKey ? { ...prev, refreshing: true } : prev);
    try {
      const value = await fetchFresh(currentKey, () => fetcherRef.current());
      setState(prev => prev.key === currentKey ? { key: currentKey, data: value, loading: false, refreshing: false, error: null } : prev);
    } catch (error: any) {
      const message = error?.message || error?.error || 'Request failed';
      // A failed refresh keeps showing the cached value
      setState(prev => prev.key === currentKey
        ? { ...prev, loading: false, refreshing: false, error: hasValue ? null : String(message) }
        : prev);
    }
  }, []);

  useEffect(() => {
    if (key === null) {
      setState({ key, data: undefined, loading: false, refreshing: false, error: null });
      return;
    }
    const cached = readCache<T>(key);
    setState({ key, data: cached?.value, loading: !cached, refreshing: false, error: null });
    const unsubscribe = subscribe(key, entry => {
      setState(prev => prev.key === key ? { ...prev, data: entry.value as T, loading: false, error: null } : prev);
    });
    load(key, !!cached);
    return unsubscribe;
  }, [key, load]);

  const refresh = useCallback(async () => {
    if (key !== null) await load(key, state.data !== undefined);
  }, [key, load, state.data]);

  // A key change is visible before its effect runs: never show another key's value
  const current = state.key === key;
  return {
    data: current ? state.data : undefined,
    loading: current ? state.loading : key !== null,
    refreshing: current ? state.refreshing : false,
    error: current ? state.error : null,
    refresh
  };
}
