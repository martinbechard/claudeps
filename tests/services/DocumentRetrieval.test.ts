/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/DocumentRetrieval.test.ts
 */

import { DocumentRetrieval } from "../../src/services/DocumentRetrieval";
import { ClaudeCache } from "../../src/services/ClaudeCache";
import {
  getOrganizationId,
  getProjectUuid,
} from "../../src/utils/getClaudeIds";
import { ThemeManager } from "../../src/ui/theme";
import type { DocumentInfo } from "../../src/types";

// Mock dependencies
jest.mock("../../src/services/ClaudeCache");
jest.mock("../../src/utils/getClaudeIds");

describe("DocumentRetrieval", () => {
  let container: HTMLElement;
  let existingContent: HTMLElement;

  beforeAll(() => {
    // Initialize ThemeManager before tests
    ThemeManager.initialize();
  });

  beforeEach(() => {
    // Create container and existing content
    container = document.createElement("div");
    existingContent = document.createElement("div");
    existingContent.textContent = "Existing content";
    existingContent.id = "existing-content";
    container.appendChild(existingContent);
    document.body.appendChild(container);

    // Mock getOrganizationId and getProjectUuid
    (getOrganizationId as jest.Mock).mockReturnValue("test-org-id");
    (getProjectUuid as jest.Mock).mockResolvedValue("test-project-id");

    // Mock ClaudeCache.fetchWithCache
    (ClaudeCache.fetchWithCache as jest.Mock).mockResolvedValue([
      {
        file_name: "test.txt",
        content: "test content",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe("Container Management", () => {
    test("preserves existing content when displaying documents", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ];

      await DocumentRetrieval.displayDocuments(docs, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when fetching and displaying documents", async () => {
      const docs = await DocumentRetrieval.fetchDocuments();
      await DocumentRetrieval.displayDocuments(docs, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when displaying empty document list", async () => {
      // Mock empty response
      (ClaudeCache.fetchWithCache as jest.Mock).mockResolvedValue([]);

      const docs = await DocumentRetrieval.fetchDocuments();
      await DocumentRetrieval.displayDocuments(docs, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Should show empty state message but preserve existing content
      expect(container.textContent).toContain("Existing content");
      expect(container.textContent).toContain("No documents found");
    });
  });

  describe("Document Processing", () => {
    test("correctly processes document data", async () => {
      const docs = await DocumentRetrieval.fetchDocuments();

      expect(docs).toHaveLength(1);
      expect(docs[0]).toEqual(
        expect.objectContaining({
          fileName: "test.txt",
          content: "test content",
          isSelected: false,
          metadata: expect.objectContaining({
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          }),
        })
      );
    });

    test("handles errors gracefully while preserving content", async () => {
      // Mock API error
      (ClaudeCache.fetchWithCache as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      // Verify error is thrown but content is preserved
      await expect(DocumentRetrieval.fetchDocuments()).rejects.toThrow(
        "Error fetching documents"
      );

      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });
});
