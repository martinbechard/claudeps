/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/ProjectRetrieval.test.ts
 */

import { ProjectRetrieval } from "../../src/services/ProjectRetrieval";
import { ClaudeCache } from "../../src/services/ClaudeCache";
import {
  getOrganizationId,
  getProjectUuid,
} from "../../src/utils/getClaudeIds";
import { ConversationRetrieval } from "../../src/services/ConversationRetrieval";
import { ThemeManager } from "../../src/ui/theme";
import type { DocumentInfo, ProjectConversation } from "../../src/types";

// Mock dependencies
jest.mock("../../src/services/ClaudeCache");
jest.mock("../../src/utils/getClaudeIds");
jest.mock("../../src/services/ConversationRetrieval");

describe("ProjectRetrieval", () => {
  let container: HTMLElement;
  let existingContent: HTMLElement;

  const mockConversation: ProjectConversation = {
    uuid: "test-conv-id",
    name: "Test Conversation",
    summary: "Test summary",
    message_count: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

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
      mockConversation,
    ]);

    // Mock ConversationRetrieval methods
    (ConversationRetrieval.getConversation as jest.Mock).mockResolvedValue({
      uuid: "test-conv-id",
      name: "Test Conversation",
      chat_messages: [],
    });
    (ConversationRetrieval.conversationToMarkdown as jest.Mock).mockReturnValue(
      "Test markdown"
    );
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe("Container Management", () => {
    test("preserves existing content when displaying conversations", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ];

      await ProjectRetrieval.displayConversations(docs, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when displaying current project", async () => {
      await ProjectRetrieval.displayCurrentProject(container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when displaying empty project", async () => {
      // Mock empty response
      (ClaudeCache.fetchWithCache as jest.Mock).mockResolvedValue([]);

      // Should throw error for empty project
      await expect(
        ProjectRetrieval.displayCurrentProject(container)
      ).rejects.toThrow("No conversations found in project");

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });

  describe("Conversation Processing", () => {
    test("correctly processes conversation data", async () => {
      const conversations = await ProjectRetrieval.getProjectConversations();

      expect(conversations).toHaveLength(1);
      expect(conversations[0]).toEqual(
        expect.objectContaining({
          uuid: "test-conv-id",
          name: "Test Conversation",
          summary: "Test summary",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        })
      );
    });

    test("handles errors gracefully while preserving content", async () => {
      // Mock API error
      (ClaudeCache.fetchWithCache as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      // Verify error is thrown but content is preserved
      await expect(
        ProjectRetrieval.displayCurrentProject(container)
      ).rejects.toThrow("Failed to display project conversations");

      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });

    test("preserves content when clearing cache", async () => {
      // Add some content that should be preserved
      const additionalContent = document.createElement("div");
      additionalContent.textContent = "Additional content";
      container.appendChild(additionalContent);

      await ProjectRetrieval.clearCache();

      // Verify all content is preserved
      expect(container.textContent).toContain("Existing content");
      expect(container.textContent).toContain("Additional content");
    });
  });

  describe("Document Info Creation", () => {
    test("creates correct document info from conversations", async () => {
      const conversations = await ProjectRetrieval.getProjectConversations();
      const docs = await ProjectRetrieval.displayCurrentProject(container);

      // Verify table structure
      const table = container.querySelector("table");
      expect(table).toBeTruthy();

      // Verify row content
      const row = table?.querySelector(
        "tr[data-conversation-id='test-conv-id']"
      );
      expect(row).toBeTruthy();

      // Verify existing content is preserved
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });
});
