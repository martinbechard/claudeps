import { processUnquotedText } from "@/utils/splitText";

describe("processUnquotedText", () => {
  // Empty or invalid inputs
  describe("empty or invalid inputs", () => {
    it("handles empty text", () => {
      const [result, endIndex, quoteChar] = processUnquotedText("", 0);
      expect(result).toBe("");
      expect(endIndex).toBe(0);
      expect(quoteChar).toBeNull();
    });

    it("handles startIndex at text length", () => {
      const text = "abc";
      const [result, endIndex, quoteChar] = processUnquotedText(
        text,
        text.length
      );
      expect(result).toBe("");
      expect(endIndex).toBe(text.length);
      expect(quoteChar).toBeNull();
    });

    // This test documents the current behavior with invalid input
    it("exhibits undefined behavior with negative startIndex", () => {
      const [result, endIndex, quoteChar] = processUnquotedText("abc", -1);
      // Current behavior should be documented but might be considered a bug
      expect(endIndex).toBeGreaterThanOrEqual(0);
    });
  });

  // Escape sequence handling
  describe("escape sequence handling", () => {
    it("handles escaped characters", () => {
      const text = "abc\\def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abcdef");
      expect(endIndex).toBe(text.length);
      expect(quoteChar).toBeNull();
    });

    it("handles escaped quotes", () => {
      const text = 'abc\\"def';
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe('abc"def');
      expect(endIndex).toBe(text.length);
      expect(quoteChar).toBeNull();
    });

    it("handles escaped followed by whitespace", () => {
      const text = "abc\\ def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(4);
      expect(quoteChar).toBeNull();
    });

    it("handles text ending with escape", () => {
      const text = "abc\\";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(text.length);
      expect(quoteChar).toBeNull();
    });
  });

  // Quote handling
  describe("quote handling", () => {
    it("handles unquoted text until quote with accumulated text", () => {
      const text = 'abc"def';
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(3);
      expect(quoteChar).toBeNull();
    });

    it("detects quote at start with no accumulated text", () => {
      const text = '"abc';
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("");
      expect(endIndex).toBe(0);
      expect(quoteChar).toBe('"');
    });

    it("handles mixed quotes", () => {
      const text = "abc'def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(3);
      expect(quoteChar).toBeNull();
    });
  });

  // Whitespace handling
  describe("whitespace handling", () => {
    it("handles unescaped whitespace", () => {
      const text = "abc def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(3);
      expect(quoteChar).toBeNull();
    });

    it("handles multiple whitespace characters", () => {
      const text = "abc   def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc");
      expect(endIndex).toBe(3);
      expect(quoteChar).toBeNull();
    });
  });

  // Special character handling
  describe("special character handling", () => {
    it("handles multi-byte characters", () => {
      const text = "abc👋 def";
      const [result, endIndex, quoteChar] = processUnquotedText(text, 0);
      expect(result).toBe("abc👋");
      expect(endIndex).toBe(5);
      expect(quoteChar).toBeNull();
    });
  });
});
