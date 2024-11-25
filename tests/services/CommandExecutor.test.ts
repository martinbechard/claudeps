/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/services/CommandExecutor.test.ts
 */

import { CommandExecutor } from "../../src/services/CommandExecutor";
import { DocumentRetrieval } from "../../src/services/DocumentRetrieval";
import { ProjectRetrieval } from "../../src/services/ProjectRetrieval";
import { ProjectSearchService } from "../../src/services/ProjectSearchService";
import { ConversationRetrieval } from "../../src/services/ConversationRetrieval";
import { SettingsService } from "../../src/services/SettingsService";
import { AliasService } from "../../src/services/AliasService";
import { ScriptStatement } from "../../src/types";
import { ThemeManager } from "../../src/ui/theme";
import type { StatusManager } from "../../src/ui/components/StatusManager";

// Mock dependencies
jest.mock("../../src/services/DocumentRetrieval");
jest.mock("../../src/services/ProjectRetrieval");
jest.mock("../../src/services/ProjectSearchService");
jest.mock("../../src/services/ConversationRetrieval");
jest.mock("../../src/services/SettingsService");
jest.mock("../../src/services/AliasService");

describe("CommandExecutor", () => {
  let container: HTMLElement;
  let existingContent: HTMLElement;
  let statusManager: StatusManager;
  let handleLog: jest.Mock;
  let commandExecutor: CommandExecutor;

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

    // Create mocks
    statusManager = {
      setStatus: jest.fn(),
      onCancel: null,
    } as any;

    handleLog = jest.fn();

    commandExecutor = new CommandExecutor(statusManager, handleLog, container);

    // Mock service methods
    (DocumentRetrieval.fetchDocuments as jest.Mock).mockResolvedValue([
      {
        fileName: "test.txt",
        content: "test content",
      },
    ]);

    (ProjectRetrieval.displayCurrentProject as jest.Mock).mockResolvedValue(
      undefined
    );
    (
      ProjectSearchService.searchAndDisplayResults as jest.Mock
    ).mockResolvedValue(undefined);
    (
      ConversationRetrieval.displayCurrentConversation as jest.Mock
    ).mockResolvedValue(undefined);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe("Container Management", () => {
    test("preserves existing content when handling knowledge command", async () => {
      await commandExecutor.handleKnowledgeCommand();

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify log was called
      expect(handleLog).toHaveBeenCalledWith("Fetching documents...");
    });

    test("preserves existing content when handling project command", async () => {
      await commandExecutor.handleProjectCommand();

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify log was called
      expect(handleLog).toHaveBeenCalledWith(
        "Fetching project conversations..."
      );
    });

    test("preserves existing content when handling search project command", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "search_project",
        searchText: "test query",
        options: {},
      });

      await commandExecutor.handleSearchProjectCommand(script);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify log was called
      expect(handleLog).toHaveBeenCalledWith(
        "Searching projects for: test query"
      );
    });

    test("preserves existing content when handling conversation command", async () => {
      await commandExecutor.handleConversationCommand({});

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify log was called
      expect(handleLog).toHaveBeenCalledWith("Retrieving conversation...");
    });
  });

  describe("Error Handling", () => {
    test("preserves existing content when knowledge command fails", async () => {
      // Mock error
      (DocumentRetrieval.fetchDocuments as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      await commandExecutor.handleKnowledgeCommand();

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify error was logged
      expect(handleLog).toHaveBeenCalledWith(
        "Error fetching documents: API Error",
        "error"
      );
    });

    test("preserves existing content when project command fails", async () => {
      // Mock error
      (ProjectRetrieval.displayCurrentProject as jest.Mock).mockRejectedValue(
        new Error("API Error")
      );

      await commandExecutor.handleProjectCommand();

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify error was logged
      expect(handleLog).toHaveBeenCalledWith(
        "Error fetching project conversations: API Error",
        "error"
      );
    });

    test("preserves existing content when search command fails", async () => {
      // Mock error
      (
        ProjectSearchService.searchAndDisplayResults as jest.Mock
      ).mockRejectedValue(new Error("API Error"));

      const script = new ScriptStatement({
        isCommand: true,
        command: "search_project",
        searchText: "test",
        options: {},
      });

      await commandExecutor.handleSearchProjectCommand(script);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify error was logged
      expect(handleLog).toHaveBeenCalledWith(
        "Error during project search: API Error",
        "error"
      );
    });
  });

  describe("Alias Commands", () => {
    test("preserves existing content when listing aliases", async () => {
      // Mock aliases
      (AliasService.getAliasList as jest.Mock).mockResolvedValue([
        "alias1",
        "alias2",
      ]);

      const script = new ScriptStatement({
        isCommand: true,
        options: {},
        aliasCommand: { type: "list_alias" },
      });

      await commandExecutor.handleAliasCommand(script);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify aliases were added
      expect(container.textContent).toContain("alias1");
      expect(container.textContent).toContain("alias2");
    });

    test("preserves existing content when alias command fails", async () => {
      // Mock error
      (AliasService.setAlias as jest.Mock).mockRejectedValue(
        new Error("Invalid alias")
      );

      const script = new ScriptStatement({
        isCommand: true,
        options: {},
        aliasCommand: {
          type: "alias",
          name: "test",
          text: "test command",
        },
      });

      await commandExecutor.handleAliasCommand(script);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify error was logged
      expect(handleLog).toHaveBeenCalledWith(
        "Alias command failed: Invalid alias",
        "error"
      );
    });
  });
});
