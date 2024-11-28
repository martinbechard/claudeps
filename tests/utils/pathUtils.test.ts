/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/pathUtils.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import { prependRoot } from "../../src/utils/pathUtils";

describe("prependRoot", () => {
  it("should return original path when no root is provided", () => {
    expect(prependRoot("test.txt", undefined)).toBe("test.txt");
  });

  it("should prepend root to path", () => {
    expect(prependRoot("test.txt", "downloads")).toBe("downloads/test.txt");
  });

  it("should handle root with leading slash", () => {
    expect(prependRoot("test.txt", "/downloads")).toBe("downloads/test.txt");
  });

  it("should handle path with leading slash", () => {
    expect(prependRoot("/test.txt", "downloads")).toBe("downloads/test.txt");
  });

  it("should handle both root and path with leading slashes", () => {
    expect(prependRoot("/test.txt", "/downloads")).toBe("downloads/test.txt");
  });

  it("should handle nested paths", () => {
    expect(prependRoot("folder/test.txt", "downloads")).toBe(
      "downloads/folder/test.txt"
    );
  });

  it("should handle nested paths with leading slashes", () => {
    expect(prependRoot("/folder/test.txt", "/downloads")).toBe(
      "downloads/folder/test.txt"
    );
  });

  it("should handle empty root", () => {
    expect(prependRoot("test.txt", "")).toBe("test.txt");
  });

  it("should handle root that is just a slash", () => {
    expect(prependRoot("test.txt", "/")).toBe("test.txt");
  });
});
