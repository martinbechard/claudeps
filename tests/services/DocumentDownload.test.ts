/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/DocumentDownload.test.ts
 */

import { DocumentDownload } from "../../src/services/DocumentDownload";
import { DocumentInfo } from "../../src/types";
import { chrome } from "../__mocks__/chrome";

describe("DocumentDownload", () => {
  let docs: DocumentInfo[];
  let mockSendMessage: jest.Mock;

  beforeEach(() => {
    docs = [
      {
        fileName: "test.txt",
        filePath: "test.txt",
        content: "test content",
      },
    ];

    mockSendMessage = jest.fn();
    // Preserve existing chrome mock and only override sendMessage
    (global as any).chrome = {
      ...chrome,
      runtime: {
        ...chrome.runtime,
        sendMessage: mockSendMessage,
      },
    };

    // Mock URL.createObjectURL and URL.revokeObjectURL
    (global as any).URL.createObjectURL = jest.fn(() => "blob:test");
    (global as any).URL.revokeObjectURL = jest.fn();

    // Mock Blob
    (global as any).Blob = class {
      constructor(content: any[], options: any) {}
    };

    // Mock console.error to prevent actual logging during tests
    jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock alert to prevent actual alerts during tests
    (global as any).alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete (global as any).chrome;
    delete (global as any).alert;
  });

  describe("handleSingleDownload", () => {
    it("creates markdown bundle with proper formatting", async () => {
      mockSendMessage.mockImplementation((message, callback) => {
        callback({ success: true });
      });

      await DocumentDownload.handleSingleDownload(docs);

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "download",
          url: "blob:test",
          filename: expect.stringMatching(/claude-export-.*\.md/),
        }),
        expect.any(Function)
      );
    });

    it("includes language identifier based on file extension", async () => {
      mockSendMessage.mockImplementation((message, callback) => {
        callback({ success: true });
      });

      const testDocs = [
        {
          fileName: "test.ts",
          filePath: "test.ts",
          content: "typescript content",
        },
        {
          fileName: "test.js",
          filePath: "test.js",
          content: "javascript content",
        },
      ];

      await DocumentDownload.handleSingleDownload(testDocs);

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "download",
          url: expect.any(String),
          filename: expect.stringMatching(/claude-export-.*\.md/),
        }),
        expect.any(Function)
      );
    });
  });

  describe("handleMultipleDownload", () => {
    it("downloads each file separately", async () => {
      mockSendMessage.mockImplementation((message, callback) => {
        callback({ success: true });
      });

      const testDocs = [
        {
          fileName: "test1.txt",
          filePath: "test1.txt",
          content: "content 1",
        },
        {
          fileName: "test2.txt",
          filePath: "test2.txt",
          content: "content 2",
        },
      ];

      await DocumentDownload.handleMultipleDownload(testDocs);

      expect(mockSendMessage).toHaveBeenCalledTimes(2);
      expect(mockSendMessage).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          type: "download",
          url: expect.any(String),
          filename: "test1.txt",
        }),
        expect.any(Function)
      );
      expect(mockSendMessage).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          type: "download",
          url: expect.any(String),
          filename: "test2.txt",
        }),
        expect.any(Function)
      );
    });
  });

  describe("error handling", () => {
    it("handles download failure", async () => {
      const error = "Download failed";
      mockSendMessage.mockImplementation((message, callback) => {
        callback({ success: false, error });
      });

      const consoleSpy = jest.spyOn(console, "error");
      await DocumentDownload.handleSingleDownload(docs);

      // Verify the error message format matches the actual implementation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Download failed: url: "blob:test" path:`),
        error
      );
      expect(global.alert).toHaveBeenCalledWith(
        "Failed to start download. Please try again."
      );
    });

    it("throws error when no documents selected", async () => {
      await expect(DocumentDownload.handleSingleDownload([])).rejects.toThrow(
        "No documents selected for export"
      );
    });

    it("handles content callback errors", async () => {
      const testDocs = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "",
          contentCallback: async () => {
            throw new Error("Content callback error");
          },
        },
      ];

      await expect(
        DocumentDownload.handleSingleDownload(testDocs)
      ).rejects.toThrow("Failed to export document bundle");
    });
  });
});
