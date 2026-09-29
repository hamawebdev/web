'use client';

/**
 * Minimal IndexedDB key-value store for values too large for localStorage (the
 * payload of a long exam session). Every call resolves (undefined / no-op) when
 * IndexedDB is unavailable, e.g. in a private window.
 */

const DB_NAME = 'medadn-cache';
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise(resolve => {
      try {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(db => new Promise<T | undefined>(resolve => {
    if (!db) return resolve(undefined);
    try {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => resolve(undefined);
      tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  }));
}

export function idbGet<T>(key: string): Promise<T | undefined> {
  return run<T>('readonly', store => store.get(key));
}

export function idbSet(key: string, value: unknown): Promise<void> {
  return run('readwrite', store => { store.put(value, key); }).then(() => undefined);
}

export function idbDelete(key: string): Promise<void> {
  return run('readwrite', store => { store.delete(key); }).then(() => undefined);
}

export function idbClear(): Promise<void> {
  return run('readwrite', store => { store.clear(); }).then(() => undefined);
}
