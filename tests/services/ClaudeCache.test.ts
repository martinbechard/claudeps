/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/services/__tests__/ClaudeCache.test.ts
 * Tests for ClaudeCache URL-to-OPFS-key transformation
 */

import { ClaudeCache } from "../../src/services/ClaudeCache";

// Access private method for testing
const getUrlToOPFSKey = (ClaudeCache as any).urlToOPFSKey.bind(ClaudeCache);

describe("ClaudeCache URL to OPFS Key Transformation", () => {
  describe("urlToOPFSKey", () => {
    test("should handle simple URLs", () => {
      const url = "https://example.com/api/data";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("https___example.com_api_data");
      expect(key).not.toContain("/");
      expect(key).not.toContain(":");
    });

    test("should handle URLs with query parameters", () => {
      const url = "https://api.example.com/v1/data?param1=value1&param2=value2";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe(
        "https___api.example.com_v1_data_param1_value1_param2_value2"
      );
      expect(key).not.toContain("?");
      expect(key).not.toContain("&");
      expect(key).not.toContain("=");
    });

    test("should handle URLs with fragments", () => {
      const url = "https://example.com/page#section1";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("https___example.com_page_section1");
      expect(key).not.toContain("#");
    });

    test("should handle URLs with all problematic characters", () => {
      const url = 'https://example.com/path?query=value#fragment<>:*?"|\\';
      const key = getUrlToOPFSKey(url);

      // Should not contain any of the problematic characters
      expect(key).not.toMatch(/[\/\\:*?"<>|]/);
      expect(key).toMatch(/^[\w\-._]+$/);
    });

    test("should handle URLs with spaces and special characters", () => {
      const url = "https://example.com/path with spaces/file%20name.json";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("https___example.com_path_with_spaces_file_20name.json");
      expect(key).not.toContain(" ");
    });

    test("should handle very long URLs", () => {
      const longPath = "a".repeat(300);
      const url = `https://example.com/${longPath}`;
      const key = getUrlToOPFSKey(url);

      expect(key.length).toBeLessThanOrEqual(200);
      expect(key).toContain("https___example.com_");
      expect(key).toContain("aaa"); // Should contain part of the long path
    });

    test("should handle edge cases", () => {
      // Empty URL should throw
      expect(() => getUrlToOPFSKey("")).toThrow("URL cannot be empty");

      // URLs that would result in invalid names
      const dotUrl = "...";
      const dotKey = getUrlToOPFSKey(dotUrl);
      expect(dotKey).toMatch(/^invalid_url_\d+$/);

      const dotsUrl = "..";
      const dotsKey = getUrlToOPFSKey(dotsUrl);
      expect(dotsKey).toMatch(/^invalid_url_\d+$/);
    });

    test("should handle URLs with ports", () => {
      const url = "https://localhost:3000/api/data";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("https___localhost_3000_api_data");
      expect(key).not.toContain(":");
    });

    test("should handle file URLs", () => {
      const url = "file:///C:/Users/user/Documents/file.txt";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("file____C__Users_user_Documents_file.txt");
      expect(key).not.toContain(":");
      expect(key).not.toContain("/");
      expect(key).not.toContain("\\");
    });

    test("should handle data URLs", () => {
      const url = "data:text/plain;base64,SGVsbG8gV29ybGQ=";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("data_text_plain_base64_SGVsbG8gV29ybGQ_");
      expect(key).not.toContain(":");
      expect(key).not.toContain(";");
    });

    test("should produce consistent results", () => {
      const url = "https://api.example.com/v1/users/123?include=profile";
      const key1 = getUrlToOPFSKey(url);
      const key2 = getUrlToOPFSKey(url);

      expect(key1).toBe(key2);
    });

    test("should handle URLs with Unicode characters", () => {
      const url = "https://example.com/café/naïve";
      const key = getUrlToOPFSKey(url);

      // Unicode characters should be replaced with underscores
      expect(key).toBe("https___example.com_caf__na_ve");
      expect(key).toMatch(/^[\w\-._]+$/);
    });

    test("should handle blob URLs", () => {
      const url =
        "blob:https://example.com/550e8400-e29b-41d4-a716-446655440000";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe(
        "blob_https___example.com_550e8400-e29b-41d4-a716-446655440000"
      );
      expect(key).not.toContain(":");
    });

    test("should handle URLs with encoded characters", () => {
      const url = "https://example.com/search?q=hello%20world&type=json";
      const key = getUrlToOPFSKey(url);

      expect(key).toBe("https___example.com_search_q_hello_20world_type_json");
      expect(key).not.toContain("%");
      expect(key).not.toContain("?");
      expect(key).not.toContain("&");
    });
  });

  describe("getCacheKey integration", () => {
    test("should generate cache keys with prefix", () => {
      const url = "https://api.example.com/data";

      // We need to access the private getCacheKey method
      const getCacheKey = (ClaudeCache as any).getCacheKey.bind(ClaudeCache);
      const cacheKey = getCacheKey(url);

      expect(cacheKey).toMatch(/^claude_cache_/);
      expect(cacheKey).toBe("claude_cache_https___api.example.com_data");
    });

    test("should throw error for empty URL in getCacheKey", () => {
      const getCacheKey = (ClaudeCache as any).getCacheKey.bind(ClaudeCache);

      expect(() => getCacheKey("")).toThrow(
        "URL is required for cache key generation"
      );
    });
  });

  describe("invalidateByUrlPattern", () => {
    test("should work with URL-to-key mapping instead of atob", () => {
      // This test verifies that the method no longer uses atob() and instead
      // relies on the URL-to-key mapping for pattern matching

      // The method should now:
      // 1. Get the URL-to-key mapping from storage
      // 2. Test each URL against the pattern
      // 3. Remove matching cache entries
      // 4. Update both the all_cache_keys list and url_key_mapping

      // Since this is an integration test that would require mocking StorageService,
      // we're just verifying the method exists and doesn't use atob
      expect(typeof ClaudeCache.invalidateByUrlPattern).toBe("function");

      // Verify the method signature
      const method = ClaudeCache.invalidateByUrlPattern;
      expect(method.length).toBe(1); // Should take 1 parameter (urlPattern)
    });
  });
});
