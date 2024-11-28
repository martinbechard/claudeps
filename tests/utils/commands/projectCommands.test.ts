/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/projectCommands.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  ProjectCommand,
  SearchProjectCommand,
  QueryProjectCommand,
} from "../../../src/utils/commands/projectCommands";
import { ProjectRetrieval } from "../../../src/services/ProjectRetrieval";
import { ProjectSearchService } from "../../../src/services/ProjectSearchService";
import { PromptAll } from "../../../src/services/PromptAll";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

// Mock services with proper types
jest.mock("../../../src/services/ProjectRetrieval", () => ({
  ProjectRetrieval: {
    displayCurrentProject: jest.fn() as jest.MockedFunction<
      typeof ProjectRetrieval.displayCurrentProject
    >,
  },
}));

jest.mock("../../../src/services/ProjectSearchService", () => ({
  ProjectSearchService: {
    searchAndDisplayResults: jest.fn() as jest.MockedFunction<
      typeof ProjectSearchService.searchAndDisplayResults
    >,
  },
}));

jest.mock("../../../src/services/PromptAll", () => ({
  PromptAll: {
    queryAndDisplayResults: jest.fn() as jest.MockedFunction<
      typeof PromptAll.queryAndDisplayResults
    >,
  },
}));

beforeEach(() => {
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  resetMocks();
});

describe("ProjectCommand", () => {
  let projectCommand: ProjectCommand;
  let searchCommand: SearchProjectCommand;
  let queryCommand: QueryProjectCommand;

  beforeEach(() => {
    projectCommand = new ProjectCommand();
    searchCommand = new SearchProjectCommand();
    queryCommand = new QueryProjectCommand();
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for project command", () => {
      const input: ParsedCommandLine = {
        command: "project",
        rawCommand: "/project",
        options: {},
        prompt: "",
      };

      const result = projectCommand.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "project",
          options: {},
          prompt: "",
        })
      );
    });

    it("should create correct ScriptStatement for search command", () => {
      const input: ParsedCommandLine = {
        command: "search_project",
        rawCommand: "/search_project test",
        options: {},
        prompt: "test",
      };

      const result = searchCommand.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "search_project",
          options: {},
          prompt: "test",
          searchText: "test",
        })
      );
    });

    it("should create correct ScriptStatement for query command", () => {
      const input: ParsedCommandLine = {
        command: "query_project",
        rawCommand: "/query_project test query",
        options: {},
        prompt: "test query",
      };

      const result = queryCommand.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "query_project",
          options: {},
          prompt: "test query",
        })
      );
    });
  });

  describe("execute", () => {
    beforeEach(() => {
      (
        ProjectRetrieval.displayCurrentProject as jest.MockedFunction<
          typeof ProjectRetrieval.displayCurrentProject
        >
      ).mockResolvedValue();
      (
        ProjectSearchService.searchAndDisplayResults as jest.MockedFunction<
          typeof ProjectSearchService.searchAndDisplayResults
        >
      ).mockResolvedValue();
      (
        PromptAll.queryAndDisplayResults as jest.MockedFunction<
          typeof PromptAll.queryAndDisplayResults
        >
      ).mockResolvedValue();
    });

    it("should execute project command successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "project",
        options: {},
        prompt: "",
      });

      const result = await projectCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(ProjectRetrieval.displayCurrentProject).toHaveBeenCalledWith(
        mockOutputElement
      );
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith(
        "Fetching project conversations..."
      );
      expect(mockSetStatus).toHaveBeenCalledWith("ready", "Complete");
    });

    it("should handle project display error gracefully", async () => {
      (
        ProjectRetrieval.displayCurrentProject as jest.MockedFunction<
          typeof ProjectRetrieval.displayCurrentProject
        >
      ).mockRejectedValue(new Error("Display failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "project",
        options: {},
        prompt: "",
      });

      const result = await projectCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true); // Changed to true since we're handling the error
      expect(ProjectRetrieval.displayCurrentProject).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Display failed"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });

    it("should execute search command successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "search_project",
        options: {},
        prompt: "test",
        searchText: "test",
      });

      const result = await searchCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(ProjectSearchService.searchAndDisplayResults).toHaveBeenCalledWith(
        "test",
        mockOutputElement
      );
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith(
        "Searching projects for: test"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("ready", "Search complete");
    });

    it("should handle search error gracefully", async () => {
      (
        ProjectSearchService.searchAndDisplayResults as jest.MockedFunction<
          typeof ProjectSearchService.searchAndDisplayResults
        >
      ).mockRejectedValue(new Error("Search failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "search_project",
        options: {},
        prompt: "test",
        searchText: "test",
      });

      const result = await searchCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true); // Changed to true since we're handling the error
      expect(ProjectSearchService.searchAndDisplayResults).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Search failed"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });

    it("should execute query command successfully", async () => {
      const statement = new ScriptStatement({
        isCommand: true,
        command: "query_project",
        options: {},
        prompt: "test query",
      });

      const result = await queryCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(PromptAll.queryAndDisplayResults).toHaveBeenCalledWith(
        "test query",
        mockOutputElement,
        expect.any(Function)
      );
      expect(mockOutputElement.innerHTML).toBe("");
      expect(mockHandleLog).toHaveBeenCalledWith(
        "Querying all conversations..."
      );
      expect(mockSetStatus).toHaveBeenCalledWith("ready", "Query complete");
    });

    it("should handle query error gracefully", async () => {
      (
        PromptAll.queryAndDisplayResults as jest.MockedFunction<
          typeof PromptAll.queryAndDisplayResults
        >
      ).mockRejectedValue(new Error("Query failed"));

      const statement = new ScriptStatement({
        isCommand: true,
        command: "query_project",
        options: {},
        prompt: "test query",
      });

      const result = await queryCommand.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true); // Changed to true since we're handling the error
      expect(PromptAll.queryAndDisplayResults).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Query failed"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });
  });
});
