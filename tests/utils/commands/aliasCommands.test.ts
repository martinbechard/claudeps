/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/aliasCommands.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import {
  SetAliasCommand,
  DeleteAliasCommand,
  ListAliasCommand,
} from "../../../src/utils/commands/aliasCommands";
import { ParsedCommandLine } from "../../../src/types";

describe("SetAliasCommand", () => {
  const command = new SetAliasCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("alias");
      expect(command.abbreviation).toBe("@+");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for valid alias", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias @test Hello world",
        prompt: "@test Hello world",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "alias",
        aliasCommand: {
          type: "alias",
          name: "test",
          text: "Hello world",
        },
        options: {},
      });
    });

    it("should throw error for missing @ prefix", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias test Hello world",
        prompt: "test Hello world",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid alias syntax");
    });

    it("should throw error for invalid alias name characters", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias @test-invalid Hello",
        prompt: "@test-invalid Hello",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid alias name");
    });

    it("should throw error for missing alias text", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias @test",
        prompt: "@test",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid alias syntax");
    });
  });
});

describe("DeleteAliasCommand", () => {
  const command = new DeleteAliasCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("delete_alias");
      expect(command.abbreviation).toBe("@-");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for valid delete", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias @test",
        prompt: "@test",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "delete_alias",
        aliasCommand: {
          type: "delete_alias",
          name: "test",
        },
        options: {},
      });
    });

    it("should throw error for missing @ prefix", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias test",
        prompt: "test",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid delete alias syntax");
    });

    it("should throw error for invalid alias name characters", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias @test-invalid",
        prompt: "@test-invalid",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid alias name");
    });

    it("should throw error for extra arguments", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias @test extra",
        prompt: "@test extra",
        options: {},
      };

      expect(() => command.parse(input)).toThrow("Invalid delete alias syntax");
    });
  });
});

describe("ListAliasCommand", () => {
  const command = new ListAliasCommand();

  describe("Constructor", () => {
    it("should set correct command name and abbreviation", () => {
      expect(command.full).toBe("list_alias");
      expect(command.abbreviation).toBe("@?");
    });
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for list command", () => {
      const input: ParsedCommandLine = {
        command: "list_alias",
        rawCommand: "/list_alias",
        prompt: "",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual({
        isCommand: true,
        command: "list_alias",
        aliasCommand: {
          type: "list_alias",
        },
        options: {},
      });
    });

    it("should throw error if arguments provided", () => {
      const input: ParsedCommandLine = {
        command: "list_alias",
        rawCommand: "/list_alias extra",
        prompt: "extra",
        options: {},
      };

      expect(() => command.parse(input)).toThrow(
        "List alias command takes no arguments"
      );
    });
  });
});
