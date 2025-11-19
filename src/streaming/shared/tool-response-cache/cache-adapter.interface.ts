/**
 * Cache adapter interface for tool response caching
 * Allows pluggable cache implementations (in-memory, Redis, etc.)
 */
export interface CacheAdapter {
  /**
   * Store a value in the cache with optional TTL
   * @param key - Cache key
   * @param value - Value to store
   * @param ttlMs - Time to live in milliseconds (optional)
   */
  set(key: string, value: string, ttlMs?: number): Promise<void> | void;

  /**
   * Retrieve a value from the cache
   * @param key - Cache key
   * @returns The cached value or undefined if not found
   */
  get(key: string): Promise<string | undefined> | string | undefined;

  /**
   * Delete a value from the cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void> | void;
}
