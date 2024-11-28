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
import { COMMAND_MAP } from "../../src/utils/commands/CommandMap";

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

    // Mock command execute methods to return true by default
    Object.values(COMMAND_MAP).forEach((command) => {
      jest.spyOn(command, "execute").mockResolvedValue(true);
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  describe("Command Execution", () => {
    test("executes knowledge command successfully", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "",
        options: {},
      });

      await commandExecutor.executeCommand(script);

      expect(COMMAND_MAP.knowledge.execute).toHaveBeenCalledWith({
        statement: script,
        outputElement: container,
        handleLog,
        setStatus: expect.any(Function),
      });
    });

    test("executes project command successfully", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "project",
        prompt: "",
        options: {},
      });

      await commandExecutor.executeCommand(script);

      expect(COMMAND_MAP.project.execute).toHaveBeenCalledWith({
        statement: script,
        outputElement: container,
        handleLog,
        setStatus: expect.any(Function),
      });
    });

    test("executes search project command successfully", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "search_project",
        searchText: "test query",
        prompt: "",
        options: {},
      });

      await commandExecutor.executeCommand(script);

      expect(COMMAND_MAP.search_project.execute).toHaveBeenCalledWith({
        statement: script,
        outputElement: container,
        handleLog,
        setStatus: expect.any(Function),
      });
    });

    test("executes alias command successfully", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "alias",
        prompt: "",
        options: {},
        aliasCommand: {
          type: "alias",
          name: "test",
          text: "test command",
        },
      });

      await commandExecutor.executeCommand(script);

      expect(COMMAND_MAP.alias.execute).toHaveBeenCalledWith({
        statement: script,
        outputElement: container,
        handleLog,
        setStatus: expect.any(Function),
      });
    });
  });

  describe("Error Handling", () => {
    test("throws error when command is not specified", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        prompt: "",
        options: {},
      });

      await expect(commandExecutor.executeCommand(script)).rejects.toThrow(
        "No command specified"
      );
    });

    test("throws error when command is unknown", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "unknown_command",
        prompt: "",
        options: {},
      });

      await expect(commandExecutor.executeCommand(script)).rejects.toThrow(
        "Unknown command: unknown_command"
      );
    });

    test("throws error when command execution fails", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "",
        options: {},
      });

      // Mock command execution failure
      jest.spyOn(COMMAND_MAP.knowledge, "execute").mockResolvedValue(false);

      await expect(commandExecutor.executeCommand(script)).rejects.toThrow(
        "Command execution failed: knowledge"
      );
    });
  });

  describe("Content Preservation", () => {
    test("preserves existing content after command execution", async () => {
      const script = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "",
        options: {},
      });

      await commandExecutor.executeCommand(script);

      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });
});
