/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/aliasCommands.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  SetAliasCommand,
  DeleteAliasCommand,
  ListAliasCommand,
} from "../../../src/utils/commands/aliasCommands";
import { AliasService } from "../../../src/services/AliasService";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";
import { MemoryStorage } from "../../../src/types/storage";

jest.mock("../../../src/services/AliasService");

describe("ListAliasCommand", () => {
  let command: ListAliasCommand;

  beforeEach(() => {
    command = new ListAliasCommand();
    resetMocks();
    AliasService.initialize(new MemoryStorage());
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for list command", () => {
      const input: ParsedCommandLine = {
        command: "list_alias",
        rawCommand: "/list_alias",
        options: {},
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "list_alias",
          prompt: "",
          options: {},
          aliasCommand: {
            type: "list_alias",
          },
        })
      );
    });

    it("should throw error if arguments provided", () => {
      const input: ParsedCommandLine = {
        command: "list_alias",
        rawCommand: "/list_alias extra",
        options: {},
        prompt: "extra",
      };

      expect(() => command.parse(input)).toThrow(
        "List alias command takes no arguments"
      );
    });
  });

  describe("execute", () => {
    it("should handle list command with no aliases", async () => {
      jest.spyOn(AliasService, "getAliasList").mockResolvedValue([]);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "list_alias",
        prompt: "",
        options: {},
        aliasCommand: {
          type: "list_alias",
        },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(AliasService.getAliasList).toHaveBeenCalled();
      expect(mockOutputElement.textContent).toBe("No aliases defined");
    });

    it("should handle list command with aliases", async () => {
      const aliases = ["@test = /test command", "@help = /help"];
      jest.spyOn(AliasService, "getAliasList").mockResolvedValue(aliases);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "list_alias",
        prompt: "",
        options: {},
        aliasCommand: {
          type: "list_alias",
        },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(AliasService.getAliasList).toHaveBeenCalled();
      aliases.forEach((alias) => {
        expect(mockOutputElement.textContent).toContain(alias);
      });
    });
  });
});

describe("SetAliasCommand", () => {
  let command: SetAliasCommand;

  beforeEach(() => {
    command = new SetAliasCommand();
    resetMocks();
    AliasService.initialize(new MemoryStorage());
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for set command", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias @test /test command",
        options: {},
        prompt: "@test /test command",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "alias",
          prompt: "",
          options: {},
          aliasCommand: {
            type: "alias",
            name: "test",
            text: "/test command",
          },
        })
      );
    });

    it("should throw error for invalid alias name", () => {
      const input: ParsedCommandLine = {
        command: "alias",
        rawCommand: "/alias @test! /test command",
        options: {},
        prompt: "@test! /test command",
      };

      expect(() => command.parse(input)).toThrow("Invalid alias name");
    });
  });

  describe("execute", () => {
    it("should handle set command", async () => {
      jest.spyOn(AliasService, "setAlias").mockResolvedValue();

      const statement = new ScriptStatement({
        isCommand: true,
        command: "alias",
        prompt: "",
        options: {},
        aliasCommand: {
          type: "alias",
          name: "test",
          text: "/test command",
        },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(AliasService.setAlias).toHaveBeenCalledWith(
        "test",
        "/test command"
      );
    });
  });
});

describe("DeleteAliasCommand", () => {
  let command: DeleteAliasCommand;

  beforeEach(() => {
    command = new DeleteAliasCommand();
    resetMocks();
    AliasService.initialize(new MemoryStorage());
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for delete command", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias @test",
        options: {},
        prompt: "@test",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "delete_alias",
          prompt: "",
          options: {},
          aliasCommand: {
            type: "delete_alias",
            name: "test",
          },
        })
      );
    });

    it("should throw error for invalid alias name", () => {
      const input: ParsedCommandLine = {
        command: "delete_alias",
        rawCommand: "/delete_alias @test!",
        options: {},
        prompt: "@test!",
      };

      expect(() => command.parse(input)).toThrow("Invalid alias name");
    });
  });

  describe("execute", () => {
    it("should handle delete command", async () => {
      jest.spyOn(AliasService, "deleteAlias").mockResolvedValue(true);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "delete_alias",
        prompt: "",
        options: {},
        aliasCommand: {
          type: "delete_alias",
          name: "test",
        },
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(AliasService.deleteAlias).toHaveBeenCalledWith("test");
    });
  });
});
