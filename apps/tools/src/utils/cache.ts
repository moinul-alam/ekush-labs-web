/**
 * Stale-While-Revalidate (SWR) LocalStorage & Memory Cache Utility for Ekush Tools.
 * Provides instant 0ms paints on return visits with seamless background revalidation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();

// Default max age: 12 hours
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * Retrieve cached item from memory or localStorage.
 * Returns { data, isFresh } if found, or null if no cache exists.
 */
export function getLocalCache<T>(
  key: string,
  maxAgeMs: number = DEFAULT_TTL_MS,
): { data: T; isFresh: boolean } | null {
  // 1. Check in-memory cache first (fastest)
  if (MEMORY_CACHE.has(key)) {
    const entry = MEMORY_CACHE.get(key) as CacheEntry<T>;
    const isFresh = Date.now() - entry.timestamp < maxAgeMs;
    return { data: entry.data, isFresh };
  }

  // 2. Check localStorage if in browser environment
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: CacheEntry<T> = JSON.parse(raw);
    if (!parsed || typeof parsed.timestamp !== "number" || parsed.data === undefined) {
      return null;
    }

    // Populate memory cache for subsequent fast reads
    MEMORY_CACHE.set(key, parsed as CacheEntry<unknown>);

    const isFresh = Date.now() - parsed.timestamp < maxAgeMs;
    return { data: parsed.data, isFresh };
  } catch {
    // If parsing fails or localStorage is blocked (e.g. private mode)
    return null;
  }
}

/**
 * Persist an item to both in-memory cache and localStorage.
 */
export function setLocalCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };

  // Update in-memory cache
  MEMORY_CACHE.set(key, entry as CacheEntry<unknown>);

  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    // Gracefully handle storage quota exceeded or disabled storage
    console.warn(`[Cache] Storage quota exceeded or disabled for key "${key}":`, err);
  }
}
