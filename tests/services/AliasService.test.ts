/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/AliasService.test.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 */

import { describe, expect, it, beforeEach } from "@jest/globals";
import { AliasService } from "../../src/services/AliasService";
import { MemoryStorage } from "../../src/types/storage";

describe("AliasService", () => {
  beforeEach(async () => {
    // Initialize with fresh MemoryStorage for each test
    await AliasService.initialize(new MemoryStorage());
    await AliasService.clearAllAliases();
  });

  describe("setAlias", () => {
    it("should store a valid alias", async () => {
      await AliasService.setAlias("test", "Hello World");
      const result = AliasService.getAlias("test");
      expect(result).toBe("Hello World");
    });

    it("should throw error for invalid alias name", async () => {
      await expect(
        AliasService.setAlias("test-invalid", "Hello")
      ).rejects.toThrow("Invalid alias name");
    });
  });

  describe("deleteAlias", () => {
    it("should delete existing alias", async () => {
      await AliasService.setAlias("test", "Hello World");
      const deleted = await AliasService.deleteAlias("test");
      expect(deleted).toBe(true);
      const result = AliasService.getAlias("test");
      expect(result).toBeUndefined();
    });

    it("should return false for non-existent alias", async () => {
      const result = await AliasService.deleteAlias("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("processText", () => {
    beforeEach(async () => {
      await AliasService.setAlias("hello", "Hello World");
      await AliasService.setAlias("nested", "@hello there");
    });

    it("should replace simple aliases", async () => {
      const result = AliasService.processText("@hello");
      expect(result).toBe("Hello World");
    });

    it("should handle nested aliases", async () => {
      const result = AliasService.processText("@nested");
      expect(result).toBe("Hello World there");
    });

    it("should handle multiple aliases in text", async () => {
      const result = AliasService.processText("@hello @hello");
      expect(result).toBe("Hello World Hello World");
    });

    it("should not replace partial matches", async () => {
      const result = AliasService.processText("email@hello.com");
      expect(result).toBe("email@hello.com");
    });
  });

  describe("getAliasList", () => {
    it("should return formatted list of aliases", async () => {
      await AliasService.setAlias("test1", "Value 1");
      await AliasService.setAlias("test2", "Value 2");
      const list = await AliasService.getAliasList();
      expect(list).toContain("@test1: Value 1");
      expect(list).toContain("@test2: Value 2");
    });
  });
});
