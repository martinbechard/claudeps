/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/repeatCommand.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import { RepeatCommand } from "../../../src/utils/commands/repeatCommand";
import { ParsedCommandLine } from "../../../src/types";

describe("RepeatCommand", () => {
  const command = new RepeatCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("repeat");
      expect(command.abbreviation).toBe("r");
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

    it("should throw error when both stop conditions used", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand:
          "/repeat Tell me a joke /stop_if success /stop_if_not failure",
        prompt: "Tell me a joke",
        options: {
          stop_if: "success",
          stop_if_not: "failure",
        },
      };

      expect(() => command.parse(input)).toThrow(
        "Cannot use both /stop_if and /stop_if_not options together"
      );
    });

    it("should trim whitespace from prompt", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat   Tell me a joke   ",
        prompt: "   Tell me a joke   ",
        options: {},
      };

      const result = command.parse(input);

      expect(result.prompt).toBe("Tell me a joke");
    });

    it("should create correct ScriptStatement with all options", () => {
      const input: ParsedCommandLine = {
        command: "repeat",
        rawCommand: "/repeat /max 5 Tell me a joke /stop_if success",
        prompt: "Tell me a joke",
        options: {
          max: "5",
          stop_if: "success",
        },
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "repeat",
        options: {
          maxTries: 5,
          stopConditions: [{ target: "success", type: "if" }],
        },
        prompt: "Tell me a joke",
      });
    });
  });
});
