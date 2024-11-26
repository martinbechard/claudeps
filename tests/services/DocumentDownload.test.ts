/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: /Users/martinbechard/dev/claudeext/tests/services/DocumentDownload.test.ts
 * This was generated by Claude Sonnet 3.5, with the assistance of my human mentor
 */

import { DocumentDownload } from "../../src/services/DocumentDownload";
import type { DocumentInfo } from "../../src/types";

// Mock chrome.runtime.sendMessage
const mockSendMessage = jest.fn(
  (message: any, callback: (response: any) => void) => {
    callback({ success: true });
  }
);

global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
  },
} as any;

describe("DocumentDownload", () => {
  let mockBlob: string;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBlob = "";

    // Mock Blob constructor
    (global as any).Blob = jest.fn((content) => ({
      text: () => Promise.resolve(content[0]),
    }));

    // Mock URL.createObjectURL to capture the Blob content
    (global.URL.createObjectURL as jest.Mock) = jest.fn((blob: any) => {
      mockBlob = blob.text();
      return "blob:test";
    });
    (global.URL.revokeObjectURL as jest.Mock) = jest.fn();
  });

  describe("handleSingleDownload", () => {
    it("preserves document order in bundle based on input array order", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "last.ts",
          filePath: "src/last.ts",
          content: "// Last file",
        },
        {
          fileName: "first.ts",
          filePath: "src/first.ts",
          content: "// First file",
        },
        {
          fileName: "middle.ts",
          filePath: "src/middle.ts",
          content: "// Middle file",
        },
      ];

      await DocumentDownload.handleSingleDownload(docs);

      // Verify chrome.runtime.sendMessage was called
      expect(mockSendMessage).toHaveBeenCalled();

      // Get the content that would be written to the file
      const blobContent = await mockBlob;

      // Verify file order in the markdown content
      expect(blobContent).toMatch(
        /src\/last\.ts.*src\/first\.ts.*src\/middle\.ts/s
      );
    });

    it("preserves directory order based on first appearance in input array", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "file1.ts",
          filePath: "src/dir2/file1.ts",
          content: "// Dir2 file",
        },
        {
          fileName: "file2.ts",
          filePath: "src/dir1/file2.ts",
          content: "// Dir1 file",
        },
        {
          fileName: "file3.ts",
          filePath: "src/dir2/file3.ts",
          content: "// Another dir2 file",
        },
      ];

      await DocumentDownload.handleSingleDownload(docs);

      // Get the content that would be written to the file
      const blobContent = await mockBlob;

      // Verify directory order matches first appearance
      expect(blobContent).toMatch(
        /dir2.*file1\.ts.*dir1.*file2\.ts.*dir2.*file3\.ts/s
      );
    });
  });

  describe("handleMultipleDownload", () => {
    it("downloads files in the order they appear in input array", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "last.ts",
          filePath: "src/last.ts",
          content: "// Last file",
        },
        {
          fileName: "first.ts",
          filePath: "src/first.ts",
          content: "// First file",
        },
      ];

      await DocumentDownload.handleMultipleDownload(docs);

      // Verify files are downloaded in original order
      const calls = (mockSendMessage as jest.Mock).mock.calls;
      expect(calls[0][0].filename).toBe("src/last.ts");
      expect(calls[1][0].filename).toBe("src/first.ts");
    });
  });

  describe("error handling", () => {
    it("throws error when no documents are selected", async () => {
      await expect(DocumentDownload.handleSingleDownload([])).rejects.toThrow(
        "No documents selected for export"
      );
      await expect(DocumentDownload.handleMultipleDownload([])).rejects.toThrow(
        "No documents selected for export"
      );
    });

    it("handles download failure", async () => {
      // Mock chrome.runtime.sendMessage to simulate failure
      const failureMock = jest.fn(
        (message: any, callback: (response: any) => void) => {
          callback({ success: false, error: "Download failed" });
        }
      );
      (global.chrome.runtime.sendMessage as jest.Mock) = failureMock;

      const docs: DocumentInfo[] = [
        {
          fileName: "test.ts",
          filePath: "src/test.ts",
          content: "// Test file",
        },
      ];

      // Verify console.error is called
      const consoleSpy = jest.spyOn(console, "error");
      await DocumentDownload.handleSingleDownload(docs);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Download failed:",
        "Download failed"
      );
    });
  });
});