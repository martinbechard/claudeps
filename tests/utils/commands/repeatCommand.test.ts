/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/repeatCommand.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { RepeatCommand } from "../../../src/utils/commands/repeatCommand";
import {
  ParsedCommandLine,
  ScriptStatement,
  StopCondition,
} from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";
import { ScriptRunner } from "../../../src/services/ScriptRunner";
import { CommandExecutor } from "../../../src/services/CommandExecutor";
import { StatusManager } from "../../../src/ui/components/StatusManager";

type PromptLoopResult = "stopped" | "not_stopped" | "not_applicable" | "failed";

beforeEach(() => {
  resetMocks();
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Clear mock implementations
  jest.clearAllMocks();
});

describe("RepeatCommand", () => {
  const command = new RepeatCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("repeat");
      expect(command.abbreviation).toBe("rp");
    });

    it("should set correct option definitions", () => {
      expect(command.options).toEqual({
        max: "with_arg",
        stop_if: "with_prompt",
        stop_if_not: "with_prompt",
      });
    });
  });

  describe("parse", () => {
    it("should use default maxTries when not specified", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat Tell me a joke",
        prompt: "Tell me a joke",
        options: {},
      };

      const result = command.parse(input);

      expect(result.options.maxTries).toBeUndefined(); // Let scriptRunner handle default
      expect(result.prompt).toBe("Tell me a joke");
    });

    it("should use specified maxTries", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat /max 5 Tell me a joke",
        prompt: "Tell me a joke",
        options: { max: "5" },
      };

      const result = command.parse(input);

      expect(result.options.maxTries).toBe(5);
      expect(result.prompt).toBe("Tell me a joke");
    });

    it("should throw error for missing prompt", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat",
        prompt: "",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("No prompt provided");
    });

    it("should handle stop_if condition", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: { stop_if: "success" },
      };

      const result = command.parse(input);

      expect(result.options.stopConditions).toEqual([
        { target: "success", type: "if" },
      ]);
    });

    it("should handle stop_if_not condition", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if_not failure",
        prompt: "Tell me a joke",
        options: { stop_if_not: "failure" },
      };

      const result = command.parse(input);

      expect(result.options.stopConditions).toEqual([
        { target: "failure", type: "if_not" },
      ]);
    });

    it("should throw error when both stop conditions are used", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand:
          "/repeat Tell me a joke /stop_if success /stop_if_not failure",
        prompt: "Tell me a joke",
        options: { stop_if: "success", stop_if_not: "failure" },
      };

      expect(() => command.parse(input)).toThrow(
        "Cannot use both /stop_if and /stop_if_not options together"
      );
    });
  });

  describe("execute", () => {
    it("should call scriptRunner.executePromptLoop with correct parameters", async () => {
      // Create a properly typed mock ScriptRunner
      const mockExecutor = {} as CommandExecutor;
      const mockStatusManager = {} as StatusManager;
      const scriptRunner = new ScriptRunner(
        mockHandleLog,
        mockExecutor,
        mockStatusManager
      );

      // Create a type-safe mock function
      const mockExecutePromptLoop = jest.fn() as jest.MockedFunction<
        typeof scriptRunner.executePromptLoop
      >;
      mockExecutePromptLoop.mockResolvedValue("stopped");
      scriptRunner.executePromptLoop = mockExecutePromptLoop;

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if success /max 5",
        prompt: "Tell me a joke",
        options: { stop_if: "success", max: "5" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
        scriptRunner,
      });

      expect(result).toBe(true);
      expect(mockExecutePromptLoop).toHaveBeenCalledWith(
        "Tell me a joke",
        [{ target: "success", type: "if" }],
        5
      );
    });

    it("should throw error for missing prompt", async () => {
      // Create a properly typed mock ScriptRunner
      const mockExecutor = {} as CommandExecutor;
      const mockStatusManager = {} as StatusManager;
      const scriptRunner = new ScriptRunner(
        mockHandleLog,
        mockExecutor,
        mockStatusManager
      );

      // Create a type-safe mock function
      const mockExecutePromptLoop = jest.fn() as jest.MockedFunction<
        typeof scriptRunner.executePromptLoop
      >;
      mockExecutePromptLoop.mockResolvedValue("stopped");
      scriptRunner.executePromptLoop = mockExecutePromptLoop;

      const statement = new ScriptStatement({
        isCommand: true,
        command: "repeat",
        options: { maxTries: 3 },
        prompt: "",
      });

      await expect(
        command.execute({
          statement,
          outputElement: mockOutputElement,
          handleLog: mockHandleLog,
          setStatus: mockSetStatus,
          scriptRunner,
        })
      ).rejects.toThrow("No prompt provided");

      expect(mockExecutePromptLoop).not.toHaveBeenCalled();
    });
  });
});
