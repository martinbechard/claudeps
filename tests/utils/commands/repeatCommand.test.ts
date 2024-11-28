/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/repeatCommand.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { RepeatCommand } from "../../../src/utils/commands/repeatCommand";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import { requestCompletion } from "../../../src/utils/requestCompletion";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

// Mock requestCompletion
jest.mock("../../../src/utils/requestCompletion", () => ({
  requestCompletion: jest.fn(),
}));

// Mock completion response
const createMockResponse = (completion: string) => ({
  completion,
  stop_reason: "stop_sequence",
  model: "claude-3-sonnet-20240229",
  stop: null,
  log_id: "mock-log-id",
  messageLimit: {
    type: "token",
    remaining: 1000,
  },
});

beforeEach(() => {
  resetMocks();
  // Mock console.error to suppress error output in tests
  jest.spyOn(console, "error").mockImplementation(() => {});
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

      expect(result.options.maxTries).toBe(10);
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

    it("should throw error for invalid maxTries", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat /max invalid Tell me a joke",
        prompt: "Tell me a joke",
        options: { max: "invalid" },
      };

      expect(() => command.parse(input)).toThrow("Invalid /max value");
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
  });

  describe("execute", () => {
    it("should stop when LLM response contains target text", async () => {
      jest
        .mocked(requestCompletion)
        .mockResolvedValue(createMockResponse("This is a success response"));

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: { stop_if: "success" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(requestCompletion).toHaveBeenCalledTimes(1);
      expect(mockOutputElement.textContent).toContain("Attempt 1/10");
    });

    it("should stop when LLM response does not contain target text", async () => {
      jest
        .mocked(requestCompletion)
        .mockResolvedValue(
          createMockResponse("This is a completely different response")
        );

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if_not failure",
        prompt: "Tell me a joke",
        options: { stop_if_not: "failure" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(requestCompletion).toHaveBeenCalledTimes(1);
      expect(mockOutputElement.textContent).toContain("Attempt 1/10");
    });

    it("should try multiple times until condition is met", async () => {
      const responses = [
        "First try result",
        "Second try output",
        "Third try with success",
      ];
      let currentResponse = 0;

      jest
        .mocked(requestCompletion)
        .mockImplementation(() =>
          Promise.resolve(createMockResponse(responses[currentResponse++]))
        );

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: { stop_if: "success" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(requestCompletion).toHaveBeenCalledTimes(3);
      expect(mockOutputElement.textContent).toContain("Attempt 3/10");
    });

    it("should complete after max tries even if condition not met", async () => {
      jest
        .mocked(requestCompletion)
        .mockResolvedValue(
          createMockResponse("A completely different response")
        );

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat /max 3 Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: { max: "3", stop_if: "success" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true); // Command executed successfully even though condition wasn't met
      expect(requestCompletion).toHaveBeenCalledTimes(3);
      expect(mockOutputElement.textContent).toContain("Max attempts reached");
    });

    it("should handle missing prompt", async () => {
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
        })
      ).rejects.toThrow("No prompt provided");

      expect(requestCompletion).not.toHaveBeenCalled();
    });

    it("should continue trying after LLM request errors", async () => {
      const responses = [
        Promise.reject(new Error("First try failed")),
        Promise.resolve(createMockResponse("Second try with success")),
      ];
      let currentResponse = 0;

      jest
        .mocked(requestCompletion)
        .mockImplementation(() => responses[currentResponse++]);

      const statement = command.parse({
        command: "repeat",
        rawCommand: "/repeat Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: { stop_if: "success" },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(requestCompletion).toHaveBeenCalledTimes(2);
    });
  });
});
