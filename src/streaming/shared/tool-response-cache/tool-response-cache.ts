/**
 * Cache for storing mocked tool responses
 * Maps tool_call_id to mocked response text
 *
 * Supports pluggable cache adapters (in-memory, Redis, etc.)
 */

import { CacheAdapter } from './cache-adapter.interface';
import { InMemoryCacheAdapter } from './in-memory-cache-adapter';

// Default TTL: 5 minutes
const DEFAULT_TTL_MS = 5 * 60 * 1000;

// Global cache adapter instance
let cacheAdapter: CacheAdapter = new InMemoryCacheAdapter();

/**
 * Set the cache adapter to use for tool response caching
 * This should be called during server initialization
 */
export function setCacheAdapter(adapter: CacheAdapter): void {
  cacheAdapter = adapter;
}

/**
 * Get the current cache adapter
 */
export function getCacheAdapter(): CacheAdapter {
  return cacheAdapter;
}

/**
 * Store a mocked response in the cache
 */
export async function storeMockedResponse(callId: string, response: string): Promise<void> {
  const result = cacheAdapter.set(callId, response, DEFAULT_TTL_MS);

  // Handle both sync and async adapters
  if (result instanceof Promise) {
    await result;
  }
}

/**
 * Retrieve a mocked response from the cache
 */
export async function getMockedResponse(callId: string): Promise<string | undefined> {
  const result = cacheAdapter.get(callId);

  // Handle both sync and async adapters
  if (result instanceof Promise) {
    return await result;
  }

  return result;
}

/**
 * Clear a mocked response from the cache
 */
export async function clearMockedResponse(callId: string): Promise<void> {
  const result = cacheAdapter.delete(callId);

  // Handle both sync and async adapters
  if (result instanceof Promise) {
    await result;
  }
}
