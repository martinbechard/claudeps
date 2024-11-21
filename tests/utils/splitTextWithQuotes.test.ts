import { splitTextWithQuotes } from "@/utils/splitText";

describe("splitTextWithQuotes", () => {
  // Empty or whitespace-only inputs
  describe("empty or whitespace inputs", () => {
    it("handles empty text", () => {
      expect(splitTextWithQuotes("")).toEqual([]);
    });

    it("handles whitespace-only text", () => {
      expect(splitTextWithQuotes("   \t\n  ")).toEqual([]);
    });

    it("handles text with Unicode whitespace", () => {
      expect(splitTextWithQuotes(" \u2000\u2001 abc")).toEqual(["abc"]);
    });
  });

  // Quote handling
  describe("quote handling", () => {
    it("handles text starting with quote", () => {
      expect(splitTextWithQuotes('"abc" def')).toEqual(["abc", "def"]);
    });

    it("handles empty quoted strings", () => {
      expect(splitTextWithQuotes('""')).toEqual([]);
      expect(splitTextWithQuotes('" "')).toEqual([" "]);
    });

    it("handles alternating quoted/unquoted text", () => {
      expect(splitTextWithQuotes('abc "def" ghi')).toEqual([
        "abc",
        "def",
        "ghi",
      ]);
    });

    it("handles text ending with quote", () => {
      expect(splitTextWithQuotes('abc "def"')).toEqual(["abc", "def"]);
    });

    it("handles mixed quote types", () => {
      expect(splitTextWithQuotes(`"abc" 'def'`)).toEqual(["abc", "def"]);
    });
  });

  // Whitespace handling
  describe("whitespace handling", () => {
    it("collapses multiple whitespace between tokens", () => {
      expect(splitTextWithQuotes("abc   def    ghi")).toEqual([
        "abc",
        "def",
        "ghi",
      ]);
    });

    it("preserves whitespace in quotes", () => {
      expect(splitTextWithQuotes('"abc   def"')).toEqual(["abc   def"]);
    });

    it("handles text ending with whitespace", () => {
      expect(splitTextWithQuotes("abc def   ")).toEqual(["abc", "def"]);
    });
  });

  // Escape sequence handling
  describe("escape sequence handling", () => {
    it("handles escaped characters in unquoted text", () => {
      expect(splitTextWithQuotes("abc\\ def ghi")).toEqual([
        "abc",
        "def",
        "ghi",
      ]);
    });

    it("handles escaped quotes in unquoted text", () => {
      expect(splitTextWithQuotes('abc\\"def ghi')).toEqual(['abc"def', "ghi"]);
    });

    it("handles unescaped quotes in quoted text per Rule 2", () => {
      expect(splitTextWithQuotes('"abc\\"def" ghi')).toEqual([
        "abc\\", // Stops at " because Rule 2 says "NO special processing"
        "def", // New token after quote
        " ghi",
      ]);
    });
  });

  // Complex scenarios
  describe("complex scenarios", () => {
    it("handles multiple quoted sections per Rule 2", () => {
      expect(
        splitTextWithQuotes("abc\\ def \"ghi \\\" jkl\" 'mno\\' pqr'")
      ).toEqual([
        "abc",
        "def", // Unquoted text
        "ghi \\",

        "jkl", // Rest of double-quoted section
        " 'mno\\' pqr'", // Single-quoted section stops at ' per Rule 2
      ]);
    });

    it("handles quotes within unquoted text", () => {
      expect(splitTextWithQuotes('abc"def ghi')).toEqual(["abc", "def ghi"]);
    });

    it("handles multi-byte characters", () => {
      expect(splitTextWithQuotes('abc 👋 "def 👋" ghi')).toEqual([
        "abc",
        "👋",
        "def 👋",
        "ghi",
      ]);
    });

    it("handles multiple types of whitespace and quotes", () => {
      expect(splitTextWithQuotes("  abc \t\"def \n ghi\"\t'jkl'  ")).toEqual([
        "abc",
        "def \n ghi",
        "jkl",
      ]);
    });
  });
});
