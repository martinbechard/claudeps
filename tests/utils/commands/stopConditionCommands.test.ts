/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/stopConditionCommands.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import {
  StopIfCommand,
  StopIfNotCommand,
} from "../../../src/utils/commands/stopConditionCommands";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";

describe("StopIfCommand", () => {
  const command = new StopIfCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("stop_if");
      expect(command.abbreviation).toBe("");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement with stop condition", () => {
      const input: ParsedCommandLine = {
        command: "stop_if",
        rawCommand: "/stop_if success",
        prompt: "success",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "stop_if",
        options: {
          stopConditions: [
            {
              target: "success",
              type: "if",
            },
          ],
        },
      });
    });

    it("should handle quoted condition text", () => {
      const input: ParsedCommandLine = {
        command: "stop_if",
        rawCommand: '/stop_if "task completed"',
        prompt: "task completed",
        options: {},
      };

      const result = command.parse(input);

      // We know stopConditions exists because the command always creates it
      expect(result.options.stopConditions![0]).toEqual({
        target: "task completed",
        type: "if",
      });
    });

    it("should preserve condition text exactly as provided", () => {
      const input: ParsedCommandLine = {
        command: "stop_if",
        rawCommand: "/stop_if Test Condition 123",
        prompt: "Test Condition 123",
        options: {},
      };

      const result = command.parse(input);

      // We know stopConditions exists and has at least one element
      expect(result.options.stopConditions![0].target).toBe(
        "Test Condition 123"
      );
    });
  });
});

describe("StopIfNotCommand", () => {
  const command = new StopIfNotCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("stop_if_not");
      expect(command.abbreviation).toBe("");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement with stop condition", () => {
      const input: ParsedCommandLine = {
        command: "stop_if_not",
        rawCommand: "/stop_if_not failure",
        prompt: "failure",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "stop_if_not",
        options: {
          stopConditions: [
            {
              target: "failure",
              type: "if_not",
            },
          ],
        },
      });
    });

    it("should handle quoted condition text", () => {
      const input: ParsedCommandLine = {
        command: "stop_if_not",
        rawCommand: '/stop_if_not "task failed"',
        prompt: "task failed",
        options: {},
      };

      const result = command.parse(input);

      // We know stopConditions exists because the command always creates it
      expect(result.options.stopConditions![0]).toEqual({
        target: "task failed",
        type: "if_not",
      });
    });

    it("should preserve condition text exactly as provided", () => {
      const input: ParsedCommandLine = {
        command: "stop_if_not",
        rawCommand: "/stop_if_not Test Condition 123",
        prompt: "Test Condition 123",
        options: {},
      };

      const result = command.parse(input);

      // We know stopConditions exists and has at least one element
      expect(result.options.stopConditions![0].target).toBe(
        "Test Condition 123"
      );
    });
  });
});

describe("Stop Condition Command Base Class", () => {
  it("should handle empty condition text", () => {
    const command = new StopIfCommand();
    const input: ParsedCommandLine = {
      command: "stop_if",
      rawCommand: "/stop_if",
      prompt: "",
      options: {},
    };

    const result = command.parse(input);

    expect(result.options.stopConditions).toEqual([
      {
        target: "",
        type: "if",
      },
    ]);
  });

  it("should maintain consistent structure between both command types", () => {
    const stopIf = new StopIfCommand();
    const stopIfNot = new StopIfNotCommand();
    const condition = "test condition";

    const stopIfInput: ParsedCommandLine = {
      command: "stop_if",
      rawCommand: `/stop_if ${condition}`,
      prompt: condition,
      options: {},
    };

    const stopIfNotInput: ParsedCommandLine = {
      command: "stop_if_not",
      rawCommand: `/stop_if_not ${condition}`,
      prompt: condition,
      options: {},
    };

    const stopIfResult = stopIf.parse(stopIfInput);
    const stopIfNotResult = stopIfNot.parse(stopIfNotInput);

    // Both should have the same structure, just different type values
    expect(Object.keys(stopIfResult)).toEqual(Object.keys(stopIfNotResult));
    expect(Object.keys(stopIfResult.options)).toEqual(
      Object.keys(stopIfNotResult.options)
    );

    // We know both commands create stopConditions
    const stopIfConditions = stopIfResult.options.stopConditions!;
    const stopIfNotConditions = stopIfNotResult.options.stopConditions!;
    expect(stopIfConditions[0].target).toBe(stopIfNotConditions[0].target);
  });
});
