import { CacheAdapter } from './cache-adapter.interface';

/**
 * In-memory cache adapter using a Map
 * Default cache implementation for the open-source version
 */
export class InMemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, string>;
  private timers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key: string, value: string, ttlMs?: number): void {
    this.cache.set(key, value);

    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set auto-expiration timer if TTL provided
    if (ttlMs) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttlMs);

      this.timers.set(key, timer);
    }
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  delete(key: string): void {
    this.cache.delete(key);

    // Clear timer if exists
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }
}
