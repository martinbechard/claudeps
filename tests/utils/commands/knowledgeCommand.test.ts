/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/knowledgeCommand.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { KnowledgeCommand } from "../../../src/utils/commands/knowledgeCommand";
import { DocumentRetrieval } from "../../../src/services/DocumentRetrieval";
import {
  ParsedCommandLine,
  ScriptStatement,
  DocumentInfo,
} from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

// Mock DocumentRetrieval with proper types
jest.mock("../../../src/services/DocumentRetrieval", () => ({
  DocumentRetrieval: {
    fetchDocuments: jest.fn() as jest.MockedFunction<
      typeof DocumentRetrieval.fetchDocuments
    >,
    displayDocuments: jest.fn() as jest.MockedFunction<
      typeof DocumentRetrieval.displayDocuments
    >,
  },
}));

beforeEach(() => {
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  resetMocks();
});

describe("KnowledgeCommand", () => {
  let command: KnowledgeCommand;

  beforeEach(() => {
    command = new KnowledgeCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("knowledge");
      expect(command.abbreviation).toBe("k");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement from ParsedCommandLine", () => {
      const input: ParsedCommandLine = {
        command: "knowledge",
        rawCommand: "/knowledge test prompt",
        prompt: "test prompt",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "knowledge",
          prompt: "test prompt",
          options: {},
        })
      );
    });

    it("should trim whitespace from prompt", () => {
      const input: ParsedCommandLine = {
        command: "knowledge",
        rawCommand: "/knowledge   test prompt  ",
        prompt: "  test prompt  ",
        options: {},
      };

      const result = command.parse(input);

      expect(result.prompt).toBe("test prompt");
    });
  });

  describe("execute", () => {
    const mockDocs: DocumentInfo[] = [
      {
        fileName: "test.txt",
        filePath: "test/test.txt",
        content: "test content",
        isSelected: true,
        metadata: {
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      },
    ];

    beforeEach(() => {
      // Setup mock returns with proper types
      (
        DocumentRetrieval.fetchDocuments as jest.MockedFunction<
          typeof DocumentRetrieval.fetchDocuments
        >
      ).mockResolvedValue(mockDocs);
      (
        DocumentRetrieval.displayDocuments as jest.MockedFunction<
          typeof DocumentRetrieval.displayDocuments
        >
      ).mockResolvedValue();
    });

    it("should execute successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(DocumentRetrieval.fetchDocuments).toHaveBeenCalled();
      expect(DocumentRetrieval.displayDocuments).toHaveBeenCalledWith(
        mockDocs,
        mockOutputElement
      );
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith("Fetching documents...");
      expect(mockSetStatus).toHaveBeenCalledWith("ready", "Complete");
    });

    it("should handle DocumentRetrieval.fetchDocuments error gracefully", async () => {
      (
        DocumentRetrieval.fetchDocuments as jest.MockedFunction<
          typeof DocumentRetrieval.fetchDocuments
        >
      ).mockRejectedValue(new Error("Fetch failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(DocumentRetrieval.fetchDocuments).toHaveBeenCalled();
      expect(DocumentRetrieval.displayDocuments).not.toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Fetch failed"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });

    it("should handle DocumentRetrieval.displayDocuments error gracefully", async () => {
      (
        DocumentRetrieval.displayDocuments as jest.MockedFunction<
          typeof DocumentRetrieval.displayDocuments
        >
      ).mockRejectedValue(new Error("Display failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "knowledge",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(DocumentRetrieval.fetchDocuments).toHaveBeenCalled();
      expect(DocumentRetrieval.displayDocuments).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Display failed"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });
  });
});
