// Copyright (c) 2024 Martin Bechard martin.bechard@DevConsult.ca
// This software is licensed under the MIT License.
// File: src/services/ClaudeCache.ts
// Simple caching utility for Claude API responses
// The cache that remembers so you don't have to!

import { getHeaders } from "../utils/getHeaders";

interface ICacheEntry<T> {
  data: T;
  timestamp: number;
}

export class ClaudeCache {
  private static cache: Map<string, ICacheEntry<any>> = new Map();
  private static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Clears all entries from the cache
   */
  public static clearCache(): void {
    ClaudeCache.cache.clear();
  }

  /**
   * Fetches data with caching support
   * @param url The URL to fetch from
   * @param options Optional fetch configuration
   * @returns Promise resolving to the fetched data
   */
  public static async fetchWithCache<T>(
    url: string,
    options: {
      headers?: HeadersInit;
      timeoutMs?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    const { timeoutMs = ClaudeCache.DEFAULT_TIMEOUT_MS, forceRefresh = false } =
      options;

    // Always use fresh data if requested
    if (forceRefresh) {
      ClaudeCache.cache.delete(url);
    }

    // Check cache first
    const cachedEntry = ClaudeCache.cache.get(url);
    if (cachedEntry) {
      const now = Date.now();
      if (now - cachedEntry.timestamp < timeoutMs) {
        return cachedEntry.data as T;
      }
      // Remove expired entry
      ClaudeCache.cache.delete(url);
    }

    // If not in cache or expired, fetch new data
    const response = await fetch(url, {
      headers: options.headers || getHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the new data
    ClaudeCache.cache.set(url, {
      data,
      timestamp: Date.now(),
    });

    return data as T;
  }

  /**
   * Gets a cached entry directly
   * @param key Cache key to retrieve
   * @returns Cached data if found and not expired
   */
  public static getCached<T>(key: string): T | null {
    const entry = ClaudeCache.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp < ClaudeCache.DEFAULT_TIMEOUT_MS) {
      return entry.data as T;
    }

    // Remove expired entry
    ClaudeCache.cache.delete(key);
    return null;
  }

  /**
   * Sets a cache entry directly
   * @param key Cache key
   * @param data Data to cache
   */
  public static setCached<T>(key: string, data: T): void {
    ClaudeCache.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Removes a specific entry from the cache
   * @param key Cache key to remove
   */
  public static removeCached(key: string): void {
    ClaudeCache.cache.delete(key);
  }
}
