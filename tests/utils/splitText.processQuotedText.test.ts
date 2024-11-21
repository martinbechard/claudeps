import { processQuotedText } from "@/utils/splitText";

describe("processQuotedText", () => {
  // Empty or invalid inputs
  describe("empty or invalid inputs", () => {
    it("handles empty text", () => {
      const [result, endIndex] = processQuotedText("", 0, '"');
      expect(result).toBe("");
      expect(endIndex).toBe(0);
    });

    it("handles startIndex at text length", () => {
      const text = "abc";
      const [result, endIndex] = processQuotedText(text, text.length, '"');
      expect(result).toBe("");
      expect(endIndex).toBe(text.length);
    });

    it("handles startIndex beyond text length", () => {
      const text = "abc";
      const [result, endIndex] = processQuotedText(text, text.length + 1, '"');
      expect(result).toBe("");
      expect(endIndex).toBe(text.length + 1);
    });

    // This test documents the current behavior with invalid input
    it("exhibits undefined behavior with negative startIndex", () => {
      const [result, endIndex] = processQuotedText("abc", -1, '"');
      // Current behavior should be documented but might be considered a bug
      expect(endIndex).toBeGreaterThanOrEqual(0);
    });
  });

  // Quote character handling
  describe("quote character handling", () => {
    it("handles text with closing quote", () => {
      const text = 'abc"def';
      const [result, endIndex] = processQuotedText(text, 0, '"');
      expect(result).toBe("abc");
      expect(endIndex).toBe(4);
    });

    it("handles text without closing quote", () => {
      const text = "abcdef";
      const [result, endIndex] = processQuotedText(text, 0, '"');
      expect(result).toBe("abcdef");
      expect(endIndex).toBe(text.length);
    });

    it("handles empty quote character", () => {
      const text = "abcdef";
      const [result, endIndex] = processQuotedText(text, 0, "");
      expect(result).toBe("abcdef");
      expect(endIndex).toBe(text.length);
    });

    it("handles multi-character quote (treats as no match)", () => {
      const text = 'abc""def';
      const [result, endIndex] = processQuotedText(text, 0, '""');
      expect(result).toBe('abc""def');
      expect(endIndex).toBe(text.length);
    });
  });

  // Special character handling
  describe("special character handling", () => {
    it("handles different quote types", () => {
      const text = "abc'def";
      const [result, endIndex] = processQuotedText(text, 0, '"');
      expect(result).toBe("abc'def");
      expect(endIndex).toBe(text.length);
    });

    it("handles multi-byte characters", () => {
      const text = "abc👋def";
      const [result, endIndex] = processQuotedText(text, 0, '"');
      expect(result).toBe("abc👋def");
      expect(endIndex).toBe(text.length);
    });
  });
});
