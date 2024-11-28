/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/contentCommands.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  ChatCommand,
  ArtifactsCommand,
} from "../../../src/utils/commands/contentCommands";
import { ConversationRetrieval } from "../../../src/services/ConversationRetrieval";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

// Mock ConversationRetrieval with proper types
jest.mock("../../../src/services/ConversationRetrieval", () => ({
  ConversationRetrieval: {
    displayCurrentConversation: jest.fn() as jest.MockedFunction<
      typeof ConversationRetrieval.displayCurrentConversation
    >,
  },
}));

beforeEach(() => {
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  resetMocks();
});

describe("ChatCommand", () => {
  let command: ChatCommand;

  beforeEach(() => {
    command = new ChatCommand();
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for chat command", () => {
      const input: ParsedCommandLine = {
        command: "chat",
        rawCommand: "/chat",
        options: {},
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "chat",
          options: {
            includeConversation: true,
            includeArtifacts: false,
          },
          prompt: "",
        })
      );
    });

    it("should include artifacts when artifacts option is present", () => {
      const input: ParsedCommandLine = {
        command: "chat",
        rawCommand: "/chat --artifacts",
        options: { artifacts: "" }, // Empty string instead of undefined
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "chat",
          options: {
            includeConversation: true,
            includeArtifacts: true,
          },
          prompt: "",
        })
      );
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      (
        ConversationRetrieval.displayCurrentConversation as jest.MockedFunction<
          typeof ConversationRetrieval.displayCurrentConversation
        >
      ).mockResolvedValue();
    });

    it("should execute chat command successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "chat",
        options: {
          includeConversation: true,
        },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalledWith(statement.options, mockOutputElement);
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith("Retrieving conversation...");
      expect(mockSetStatus).toHaveBeenCalledWith(
        "ready",
        "Conversation retrieved successfully"
      );
    });

    it("should handle display error gracefully", async () => {
      (
        ConversationRetrieval.displayCurrentConversation as jest.MockedFunction<
          typeof ConversationRetrieval.displayCurrentConversation
        >
      ).mockRejectedValue(new Error("Display failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "chat",
        options: {
          includeConversation: true,
        },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining(
          "Chat command execution failed: Display failed"
        ),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });
  });
});

describe("ArtifactsCommand", () => {
  let command: ArtifactsCommand;

  beforeEach(() => {
    command = new ArtifactsCommand();
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for artifacts command", () => {
      const input: ParsedCommandLine = {
        command: "artifacts",
        rawCommand: "/artifacts",
        options: {},
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "artifacts",
          options: {
            includeArtifacts: true,
          },
          prompt: "",
        })
      );
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      (
        ConversationRetrieval.displayCurrentConversation as jest.MockedFunction<
          typeof ConversationRetrieval.displayCurrentConversation
        >
      ).mockResolvedValue();
    });

    it("should execute artifacts command successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "artifacts",
        options: {
          includeArtifacts: true,
        },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalledWith(statement.options, mockOutputElement);
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith("Retrieving artifacts...");
      expect(mockSetStatus).toHaveBeenCalledWith(
        "ready",
        "Artifacts retrieved successfully"
      );
    });

    it("should handle artifacts display error gracefully", async () => {
      (
        ConversationRetrieval.displayCurrentConversation as jest.MockedFunction<
          typeof ConversationRetrieval.displayCurrentConversation
        >
      ).mockRejectedValue(new Error("Display failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "artifacts",
        options: {
          includeArtifacts: true,
        },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining(
          "Artifacts command execution failed: Display failed"
        ),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });
  });
});
