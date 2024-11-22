// Copyright (c) 2024 Martin Bechard martin.bechard@DevConsult.ca
// This software is licensed under the MIT License.
// File: src/services/ClaudeCache.ts
// Simple caching utility for Claude API responses
// The cache that remembers so you don't have to!

import { getHeaders } from "../utils/getHeaders";
import { StorageService } from "./StorageService";

interface ICacheEntry<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  headers?: HeadersInit;
  timeoutMs?: number;
}

export class ClaudeCache {
  private static readonly CACHE_KEY_PREFIX = "claude_cache_";
  private static readonly DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  public static readonly NO_TIMEOUT = -1; // Special value to indicate no timeout

  /**
   * Clears all entries from the cache
   */
  public static async clearCache(): Promise<void> {
    try {
      // Get all keys from storage
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      const cacheKeys = allKeys.filter((key) =>
        key.startsWith(this.CACHE_KEY_PREFIX)
      );
      await Promise.all(cacheKeys.map((key) => StorageService.remove(key)));
      // Clear the keys list
      await StorageService.set("all_cache_keys", []);
    } catch (error) {
      console.error("Error clearing cache:", error);
      throw new Error("Failed to clear cache");
    }
  }

  /**
   * Invalidates cache entries matching a URL pattern
   * @param urlPattern Regular expression pattern to match URLs against
   */
  public static async invalidateByUrlPattern(
    urlPattern: RegExp
  ): Promise<void> {
    try {
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      const keysToRemove: string[] = [];

      for (const key of allKeys) {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          const url = atob(key.replace(this.CACHE_KEY_PREFIX, ""));
          if (urlPattern.test(url)) {
            keysToRemove.push(key);
          }
        }
      }

      await Promise.all(keysToRemove.map((key) => StorageService.remove(key)));
      await StorageService.set(
        "all_cache_keys",
        allKeys.filter((key) => !keysToRemove.includes(key))
      );
    } catch (error) {
      console.error("Error invalidating cache entries:", error);
      throw new Error("Failed to invalidate cache entries");
    }
  }

  /**
   * Gets the cache key for a URL
   */
  private static getCacheKey(url: string): string {
    if (!url) {
      throw new Error("URL is required for cache key generation");
    }
    return this.CACHE_KEY_PREFIX + btoa(url);
  }

  /**
   * Fetches data with caching support
   * @param url The URL to fetch from
   * @param options Optional fetch configuration
   * @returns Promise resolving to the fetched data
   */
  public static async fetchWithCache<T>(
    url: string,
    options: CacheOptions = {}
  ): Promise<T> {
    if (!url) {
      throw new Error("URL is required for fetching data");
    }

    const { timeoutMs = ClaudeCache.DEFAULT_TIMEOUT_MS } = options;
    const cacheKey = this.getCacheKey(url);

    try {
      // Check cache first
      const cachedEntry = await StorageService.get<ICacheEntry<T>>(cacheKey);
      if (cachedEntry?.data) {
        // Check timeout unless NO_TIMEOUT is specified
        if (
          timeoutMs === ClaudeCache.NO_TIMEOUT ||
          Date.now() - cachedEntry.timestamp < timeoutMs
        ) {
          return cachedEntry.data;
        }
        // Remove expired entry
        await StorageService.remove(cacheKey);
        // Update keys list
        const allKeys =
          (await StorageService.get<string[]>("all_cache_keys")) || [];
        await StorageService.set(
          "all_cache_keys",
          allKeys.filter((k) => k !== cacheKey)
        );
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
      const entry: ICacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };

      await StorageService.set(cacheKey, entry);
      // Update keys list
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      if (!allKeys.includes(cacheKey)) {
        allKeys.push(cacheKey);
        await StorageService.set("all_cache_keys", allKeys);
      }

      return data as T;
    } catch (error) {
      console.error("Error in fetchWithCache:", error);
      throw new Error(
        `Failed to fetch or cache data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Gets a cached entry directly
   * @param key Cache key to retrieve
   * @returns Cached data if found and not expired
   */
  public static async getCached<T>(key: string): Promise<T | null> {
    if (!key) {
      throw new Error("Key is required for getting cached data");
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const entry = await StorageService.get<ICacheEntry<T>>(cacheKey);

      if (!entry?.data) return null;

      const now = Date.now();
      if (now - entry.timestamp < this.DEFAULT_TIMEOUT_MS) {
        return entry.data;
      }

      // Remove expired entry
      await StorageService.remove(cacheKey);
      // Update keys list
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      await StorageService.set(
        "all_cache_keys",
        allKeys.filter((k) => k !== cacheKey)
      );
      return null;
    } catch (error) {
      console.warn("Error in getCached:", error);
      return null;
    }
  }

  /**
   * Sets a cache entry directly
   * @param key Cache key
   * @param data Data to cache
   */
  public static async setCached<T>(key: string, data: T): Promise<void> {
    if (!key) {
      throw new Error("Key is required for setting cached data");
    }

    try {
      const cacheKey = this.getCacheKey(key);
      const entry: ICacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };

      await StorageService.set(cacheKey, entry);
      // Update keys list
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      if (!allKeys.includes(cacheKey)) {
        allKeys.push(cacheKey);
        await StorageService.set("all_cache_keys", allKeys);
      }
    } catch (error) {
      console.error("Error in setCached:", error);
      throw new Error(
        `Failed to set cache entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Removes a specific entry from the cache
   * @param key Cache key to remove
   */
  public static async removeCached(key: string): Promise<void> {
    if (!key) {
      throw new Error("Key is required for removing cached data");
    }

    try {
      const cacheKey = this.getCacheKey(key);
      await StorageService.remove(cacheKey);
      // Update keys list
      const allKeys =
        (await StorageService.get<string[]>("all_cache_keys")) || [];
      await StorageService.set(
        "all_cache_keys",
        allKeys.filter((k) => k !== cacheKey)
      );
    } catch (error) {
      console.error("Error in removeCached:", error);
      throw new Error(
        `Failed to remove cache entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
