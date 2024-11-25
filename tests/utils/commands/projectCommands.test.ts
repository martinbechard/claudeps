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
import { ParsedCommandLine } from "../../../src/types";

// Mock services
jest.mock("../../../src/services/ProjectRetrieval", () => ({
  ProjectRetrieval: {
    displayCurrentProject: jest.fn(),
  },
}));

jest.mock("../../../src/services/ProjectSearchService", () => ({
  ProjectSearchService: {
    searchAndDisplayResults: jest.fn(),
  },
}));

jest.mock("../../../src/services/PromptAll", () => ({
  PromptAll: {
    queryAndDisplayResults: jest.fn(),
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

describe("ProjectCommand", () => {
  let command: ProjectCommand;

  beforeEach(() => {
    command = new ProjectCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("project");
      expect(command.abbreviation).toBe("p");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement", () => {
      const input: ParsedCommandLine = {
        command: "project",
        rawCommand: "/project test",
        prompt: "  test  ",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "project",
        prompt: "test",
      });
    });
  });

  describe("execute", () => {
    it("should execute successfully", async () => {
      const statement = command.parse({
        command: "project",
        rawCommand: "/project",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(true);
      expect(ProjectRetrieval.displayCurrentProject).toHaveBeenCalledWith(
        mockOutputElement
      );
      expect(mockOutputElement.innerHTML).toBe("");
    });

    it("should fail when displayCurrentProject throws", async () => {
      jest
        .mocked(ProjectRetrieval.displayCurrentProject)
        .mockRejectedValue(new Error("Display failed"));

      const statement = command.parse({
        command: "project",
        rawCommand: "/project",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(false);
      expect(ProjectRetrieval.displayCurrentProject).toHaveBeenCalled();
    });
  });
});

describe("SearchProjectCommand", () => {
  let command: SearchProjectCommand;

  beforeEach(() => {
    command = new SearchProjectCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("search_project");
      expect(command.abbreviation).toBe("sp");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement", () => {
      const input: ParsedCommandLine = {
        command: "search_project",
        rawCommand: "/search_project test query",
        prompt: "  test query  ",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "search_project",
        searchText: "test query",
      });
    });
  });

  describe("execute", () => {
    it("should execute successfully", async () => {
      const statement = command.parse({
        command: "search_project",
        rawCommand: "/search_project test",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(true);
      expect(ProjectSearchService.searchAndDisplayResults).toHaveBeenCalledWith(
        "test",
        mockOutputElement
      );
      expect(mockOutputElement.innerHTML).toBe("");
    });

    it("should fail when searchAndDisplayResults throws", async () => {
      jest
        .mocked(ProjectSearchService.searchAndDisplayResults)
        .mockRejectedValue(new Error("Search failed"));

      const statement = command.parse({
        command: "search_project",
        rawCommand: "/search_project test",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(false);
      expect(ProjectSearchService.searchAndDisplayResults).toHaveBeenCalled();
    });
  });
});

describe("QueryProjectCommand", () => {
  let command: QueryProjectCommand;

  beforeEach(() => {
    command = new QueryProjectCommand();
  });

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("query_project");
      expect(command.abbreviation).toBe("qp");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement", () => {
      const input: ParsedCommandLine = {
        command: "query_project",
        rawCommand: "/query_project test query",
        prompt: "  test query  ",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toMatchObject({
        isCommand: true,
        command: "query_project",
        prompt: "test query",
      });
    });
  });

  describe("execute", () => {
    it("should execute successfully with valid prompt", async () => {
      const statement = command.parse({
        command: "query_project",
        rawCommand: "/query_project test query",
        prompt: "test query",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(true);
      expect(PromptAll.queryAndDisplayResults).toHaveBeenCalledWith(
        "test query",
        mockOutputElement,
        expect.any(Function)
      );
      expect(mockOutputElement.innerHTML).toBe("");
    });

    it("should fail when prompt is empty", async () => {
      expect(() => {
        command.parse({
          command: "query_project",
          rawCommand: "/query_project",
          prompt: "",
          options: {},
        });
      }).toThrow("Query project command requires a prompt");
    });

    it("should fail when queryAndDisplayResults throws", async () => {
      jest
        .mocked(PromptAll.queryAndDisplayResults)
        .mockRejectedValue(new Error("Query failed"));

      const statement = command.parse({
        command: "query_project",
        rawCommand: "/query_project test",
        prompt: "test",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
      });

      expect(result).toBe(false);
      expect(PromptAll.queryAndDisplayResults).toHaveBeenCalled();
    });
  });
});
