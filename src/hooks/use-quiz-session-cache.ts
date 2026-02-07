/**
 * Smart Quiz Session Caching Hook
 * 
 * Provides intelligent caching for quiz sessions to reduce redundant API calls
 * and improve performance, especially on mobile networks.
 */

import { useState, useCallback, useEffect } from 'react';

interface CachedSession {
  data: any;
  cachedAt: number;
  expiresAt: number;
  version: number; // For cache invalidation
}

interface CacheStats {
  hits: number;
  misses: number;
  expired: number;
}

export function useQuizSessionCache() {
  const [cache, setCache] = useState<Map<number, CachedSession>>(new Map());
  const [stats, setStats] = useState<CacheStats>({ hits: 0, misses: 0, expired: 0 });

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_CACHE_SIZE = 10; // Maximum number of sessions to cache
  const CLEANUP_INTERVAL = 60 * 1000; // Cleanup every minute

  /**
   * Get cached session data if available and not expired
   */
  const getCachedSession = useCallback((sessionId: number): any | null => {
    const cached = cache.get(sessionId);
    
    if (!cached) {
      setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }
    
    // Check if cache is expired
    if (cached.expiresAt <= Date.now()) {
      console.log(`⏰ Cache expired for session ${sessionId}`);
      setStats(prev => ({ ...prev, expired: prev.expired + 1 }));
      
      // Remove expired cache
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(sessionId);
        return newCache;
      });
      
      return null;
    }
    
    console.log(`✅ Cache hit for session ${sessionId}`);
    setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return cached.data;
  }, [cache]);

  /**
   * Cache session data with expiration
   */
  const setCachedSession = useCallback((sessionId: number, sessionData: any) => {
    const cached: CachedSession = {
      data: sessionData,
      cachedAt: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION,
      version: 1
    };
    
    setCache(prev => {
      const newCache = new Map(prev);
      
      // Implement LRU eviction if cache is full
      if (newCache.size >= MAX_CACHE_SIZE && !newCache.has(sessionId)) {
        // Remove oldest entry
        const oldestKey = newCache.keys().next().value;
        if (oldestKey !== undefined) {
          newCache.delete(oldestKey);
          console.log(`🗑️ Evicted oldest cache entry: ${oldestKey}`);
        }
      }
      
      newCache.set(sessionId, cached);
      return newCache;
    });
    
    console.log(`💾 Cached session ${sessionId} (expires in ${CACHE_DURATION / 1000}s)`);
  }, [CACHE_DURATION, MAX_CACHE_SIZE]);

  /**
   * Update cached session data (for answer submissions)
   */
  const updateCachedSession = useCallback((sessionId: number, updates: Partial<any>) => {
    setCache(prev => {
      const cached = prev.get(sessionId);
      if (!cached) return prev;
      
      const newCache = new Map(prev);
      const updatedCached: CachedSession = {
        ...cached,
        data: { ...cached.data, ...updates },
        version: cached.version + 1
      };
      
      newCache.set(sessionId, updatedCached);
      console.log(`🔄 Updated cached session ${sessionId} (v${updatedCached.version})`);
      return newCache;
    });
  }, []);

  /**
   * Invalidate cache for specific session or all sessions
   */
  const invalidateCache = useCallback((sessionId?: number) => {
    if (sessionId) {
      setCache(prev => {
        const newCache = new Map(prev);
        const removed = newCache.delete(sessionId);
        if (removed) {
          console.log(`🗑️ Invalidated cache for session ${sessionId}`);
        }
        return newCache;
      });
    } else {
      setCache(new Map());
      console.log('🗑️ Invalidated all session cache');
    }
  }, []);

  /**
   * Check if session is cached and valid
   */
  const isCacheValid = useCallback((sessionId: number): boolean => {
    const cached = cache.get(sessionId);
    return cached ? cached.expiresAt > Date.now() : false;
  }, [cache]);

  /**
   * Get cache statistics for monitoring
   */
  const getCacheStats = useCallback(() => {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;
    
    return {
      ...stats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: cache.size,
      cachedSessions: Array.from(cache.keys())
    };
  }, [stats, cache]);

  /**
   * Preload session data into cache
   */
  const preloadSession = useCallback((sessionId: number, sessionData: any) => {
    if (!cache.has(sessionId)) {
      setCachedSession(sessionId, sessionData);
      console.log(`⚡ Preloaded session ${sessionId} into cache`);
    }
  }, [cache, setCachedSession]);

  // Cleanup expired cache entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      let expiredCount = 0;
      
      setCache(prev => {
        const newCache = new Map();
        prev.forEach((cached, sessionId) => {
          if (cached.expiresAt > now) {
            newCache.set(sessionId, cached);
          } else {
            expiredCount++;
          }
        });
        return newCache;
      });
      
      if (expiredCount > 0) {
        console.log(`🧹 Cleaned up ${expiredCount} expired cache entries`);
        setStats(prev => ({ ...prev, expired: prev.expired + expiredCount }));
      }
    }, CLEANUP_INTERVAL);

    return () => clearInterval(cleanup);
  }, [CLEANUP_INTERVAL]);

  // Cache statistics are tracked silently

  return {
    getCachedSession,
    setCachedSession,
    updateCachedSession,
    invalidateCache,
    isCacheValid,
    getCacheStats,
    preloadSession
  };
}
