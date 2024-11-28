/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/rootCommand.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { RootCommand } from "../../../src/utils/commands/rootCommand";
import { SettingsService } from "../../../src/services/SettingsService";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

jest.mock("../../../src/services/SettingsService");

describe("RootCommand", () => {
  let command: RootCommand;

  beforeEach(() => {
    command = new RootCommand();
    resetMocks();
  });

  describe("parse", () => {
    it("should create statement with empty options when no path provided", () => {
      const input: ParsedCommandLine = {
        command: "root",
        rawCommand: "/root",
        prompt: "",
        options: {},
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "root",
          prompt: "",
          options: {},
        })
      );
    });

    it("should create statement with path option when path provided", () => {
      const input: ParsedCommandLine = {
        command: "root",
        rawCommand: "/root downloads/claude",
        options: { path: "downloads/claude" },
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "root",
          options: { path: "downloads/claude" },
          prompt: "",
        })
      );
    });

    it("should create statement with 'clear' path option", () => {
      const input: ParsedCommandLine = {
        command: "root",
        rawCommand: "/root clear",
        options: { path: "clear" },
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "root",
          options: { path: "clear" },
          prompt: "",
        })
      );
    });
  });

  describe("execute", () => {
    it("should display 'not set' when no root is configured", async () => {
      jest.spyOn(SettingsService, "getSetting").mockResolvedValue(undefined);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "root",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(mockOutputElement.textContent).toBe(
        "Current download root: not set"
      );
      expect(SettingsService.getSetting).toHaveBeenCalledWith("downloadRoot");
    });

    it("should display root path when one is configured", async () => {
      jest
        .spyOn(SettingsService, "getSetting")
        .mockResolvedValue("downloads/claude");

      const statement = new ScriptStatement({
        isCommand: true,
        command: "root",
        prompt: "",
        options: {},
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(mockOutputElement.textContent).toBe(
        "Current download root: downloads/claude"
      );
      expect(SettingsService.getSetting).toHaveBeenCalledWith("downloadRoot");
    });

    it("should update root when path provided", async () => {
      jest.spyOn(SettingsService, "setSetting").mockResolvedValue();

      const statement = new ScriptStatement({
        isCommand: true,
        command: "root",
        options: { path: "downloads/claude" },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(SettingsService.setSetting).toHaveBeenCalledWith(
        "downloadRoot",
        "downloads/claude"
      );
      expect(mockOutputElement.textContent).toBe(
        "Download root updated to: downloads/claude"
      );
    });

    it("should clear root when 'clear' provided", async () => {
      jest.spyOn(SettingsService, "setSetting").mockResolvedValue();

      const statement = new ScriptStatement({
        isCommand: true,
        command: "root",
        options: { path: "clear" },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(SettingsService.setSetting).toHaveBeenCalledWith(
        "downloadRoot",
        undefined
      );
      expect(mockOutputElement.textContent).toBe("Download root cleared");
    });

    it("should handle errors gracefully", async () => {
      const error = new Error("Test error");
      jest.spyOn(SettingsService, "setSetting").mockRejectedValue(error);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "root",
        options: { path: "downloads/claude" },
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(mockOutputElement.textContent).toBe(
        "Failed to update download root: Test error"
      );
    });
  });
});
