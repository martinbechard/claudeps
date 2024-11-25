/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/ConversationRetrieval.test.ts
 */

import { ConversationRetrieval } from "../../src/services/ConversationRetrieval";
import { ClaudeCache } from "../../src/services/ClaudeCache";
import { ProjectRetrieval } from "../../src/services/ProjectRetrieval";
import { ThemeManager } from "../../src/ui/theme";
import type { Conversation, DocumentInfo } from "../../src/types";

// Mock dependencies
jest.mock("../../src/services/ClaudeCache");
jest.mock("../../src/services/ProjectRetrieval");
jest.mock("../../src/utils/getClaudeIds");

describe("ConversationRetrieval", () => {
  let container: HTMLElement;
  let existingContent: HTMLElement;

  const mockConversation: Conversation = {
    uuid: "test-conv-id",
    name: "Test Conversation",
    chat_messages: [
      {
        uuid: "msg-1",
        sender: "human",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        content: [
          {
            type: "text",
            text: "Test message",
          },
          {
            type: "tool_use",
            input: {
              id: "artifact-1",
              title: "test.txt",
              content: "Test artifact content",
              language: "text",
              command: "create", // Using valid command value
            },
          },
        ],
      },
    ],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    current_leaf_message_uuid: "msg-1",
  } as Conversation; // Using type assertion since we don't need all Conversation properties for tests

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

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/chat/test-conv-id",
      },
      writable: true,
    });

    // Mock document.cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "lastActiveOrg=test-org-id",
    });

    // Mock ClaudeCache.fetchWithCache
    (ClaudeCache.fetchWithCache as jest.Mock).mockResolvedValue(
      mockConversation
    );

    // Mock ProjectRetrieval.getProjectConversations
    (ProjectRetrieval.getProjectConversations as jest.Mock).mockResolvedValue([
      {
        uuid: "test-conv-id",
        updated_at: mockConversation.updated_at,
      },
    ]);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe("Container Management", () => {
    test("preserves existing content when displaying conversation", async () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ];

      await ConversationRetrieval.displayConversation(docs, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when displaying current conversation", async () => {
      await ConversationRetrieval.displayCurrentConversation({}, container);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when displaying artifacts", async () => {
      await ConversationRetrieval.displayCurrentConversation(
        { includeArtifacts: true },
        container
      );

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("preserves existing content when no artifacts found", async () => {
      // Mock conversation with no artifacts
      const noArtifactsConv = {
        ...mockConversation,
        chat_messages: [
          {
            ...mockConversation.chat_messages[0],
            content: [
              {
                type: "text",
                text: "Test message",
              },
            ],
          },
        ],
      };
      (ClaudeCache.fetchWithCache as jest.Mock).mockResolvedValue(
        noArtifactsConv
      );

      // Should throw error for no artifacts
      await expect(
        ConversationRetrieval.displayCurrentConversation(
          { includeArtifacts: true },
          container
        )
      ).rejects.toThrow("No artifacts found in conversation");

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });

  describe("Conversation Processing", () => {
    test("correctly processes conversation data", async () => {
      const conversation = await ConversationRetrieval.getConversation(
        "test-org",
        "test-conv-id"
      );

      expect(conversation).toEqual(
        expect.objectContaining({
          uuid: "test-conv-id",
          name: "Test Conversation",
          chat_messages: expect.arrayContaining([
            expect.objectContaining({
              uuid: "msg-1",
              sender: "human",
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: "text",
                  text: "Test message",
                }),
              ]),
            }),
          ]),
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
        ConversationRetrieval.displayCurrentConversation({}, container)
      ).rejects.toThrow("Failed to display conversation");

      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });

  describe("Artifact Processing", () => {
    test("correctly extracts artifacts from conversation", async () => {
      await ConversationRetrieval.displayCurrentConversation(
        { includeArtifacts: true },
        container
      );

      // Verify artifact is displayed in table
      const table = container.querySelector("table");
      expect(table).toBeTruthy();

      // Look for the data row in tbody, not the header row
      const tbody = table?.querySelector("tbody");
      const dataRow = tbody?.querySelector("tr");
      expect(dataRow?.textContent).toContain("test.txt");

      // Verify existing content is preserved
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });

    test("handles markdown conversion while preserving content", () => {
      const markdown =
        ConversationRetrieval.conversationToMarkdown(mockConversation);

      expect(markdown).toContain("Test Conversation");
      expect(markdown).toContain("Test message");
      expect(markdown).toContain("Artifact: test.txt");

      // Verify existing content is preserved
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });
});
