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
import { ParsedCommandLine } from "../../../src/types";

// Mock ConversationRetrieval
jest.mock("../../../src/services/ConversationRetrieval", () => ({
  ConversationRetrieval: {
    displayCurrentConversation: jest.fn(),
  },
}));

// Create mock output element
const mockOutputElement = document.createElement("div");

beforeEach(() => {
  // Reset the mock element's innerHTML before each test
  mockOutputElement.innerHTML = "";
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Clear all mocks
  jest.clearAllMocks();
});

describe("ChatCommand", () => {
  let command: ChatCommand;

  beforeEach(() => {
    command = new ChatCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("chat");
      expect(command.abbreviation).toBe("c");
    });

    it("should set correct option definitions", () => {
      expect(command.options).toEqual({
        artifacts: "no_arg",
      });
    });
  });

  describe("parse", () => {
    it("should create ScriptStatement without artifacts option", () => {
      const input: ParsedCommandLine = {
        command: "chat",
        rawCommand: "/chat",
        prompt: "",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "chat",
        prompt: "",
        options: {
          includeConversation: true,
          includeArtifacts: false,
        },
      });
    });

    it("should create ScriptStatement with artifacts option", () => {
      const input: ParsedCommandLine = {
        command: "chat",
        rawCommand: "/chat /artifacts",
        prompt: "",
        options: { artifacts: "" },
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "chat",
        prompt: "",
        options: {
          includeConversation: true,
          includeArtifacts: true,
        },
      });
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      jest
        .mocked(ConversationRetrieval.displayCurrentConversation)
        .mockResolvedValue();
    });

    it("should execute successfully", async () => {
      const statement = command.parse({
        command: "chat",
        rawCommand: "/chat",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(true);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalledWith(statement.options, mockOutputElement);
      expect(mockOutputElement.innerHTML).toBe("");
    });

    it("should fail when displayCurrentConversation throws", async () => {
      jest
        .mocked(ConversationRetrieval.displayCurrentConversation)
        .mockRejectedValue(new Error("Display failed"));

      const statement = command.parse({
        command: "chat",
        rawCommand: "/chat",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(false);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalled();
    });
  });
});

describe("ArtifactsCommand", () => {
  let command: ArtifactsCommand;

  beforeEach(() => {
    command = new ArtifactsCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("artifacts");
      expect(command.abbreviation).toBe("a");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement", () => {
      const input: ParsedCommandLine = {
        command: "artifacts",
        rawCommand: "/artifacts",
        prompt: "",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "artifacts",
        prompt: "",
        options: {
          includeArtifacts: true,
        },
      });
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      jest
        .mocked(ConversationRetrieval.displayCurrentConversation)
        .mockResolvedValue();
    });

    it("should execute successfully", async () => {
      const statement = command.parse({
        command: "artifacts",
        rawCommand: "/artifacts",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(true);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalledWith(statement.options, mockOutputElement);
      expect(mockOutputElement.innerHTML).toBe("");
    });

    it("should fail when displayCurrentConversation throws", async () => {
      jest
        .mocked(ConversationRetrieval.displayCurrentConversation)
        .mockRejectedValue(new Error("Display failed"));

      const statement = command.parse({
        command: "artifacts",
        rawCommand: "/artifacts",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(false);
      expect(
        ConversationRetrieval.displayCurrentConversation
      ).toHaveBeenCalled();
    });
  });
});
