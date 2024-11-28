/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/settingsCommand.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { SettingsCommand } from "../../../src/utils/commands/settingsCommand";
import {
  SettingsService,
  Settings,
} from "../../../src/services/SettingsService";
import { ParsedCommandLine, ScriptStatement } from "../../../src/types";
import {
  mockOutputElement,
  mockHandleLog,
  mockSetStatus,
  resetMocks,
} from "../../__mocks__/commandTestUtils";

jest.mock("../../../src/services/SettingsService");

describe("SettingsCommand", () => {
  let command: SettingsCommand;

  beforeEach(() => {
    command = new SettingsCommand();
    resetMocks();
  });

  describe("parse", () => {
    it("should create correct ScriptStatement for settings command", () => {
      const input: ParsedCommandLine = {
        command: "settings",
        rawCommand: "/settings",
        options: {},
        prompt: "",
      };

      const result = command.parse(input);

      expect(result).toEqual(
        new ScriptStatement({
          isCommand: true,
          command: "settings",
          options: {},
          prompt: "",
        })
      );
    });
  });

  describe("execute", () => {
    it("should display settings successfully", async () => {
      const mockSettings: Settings = {
        anthropicApiKey: "sk-ant-test123",
        model: "claude-3-5-sonnet-20241022",
        theme: "light",
        enableAnthropicApi: true,
        debugTraceRequests: false,
        debugWindowEvents: false,
      };

      jest
        .spyOn(SettingsService, "getSettings")
        .mockResolvedValue(mockSettings);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "settings",
        options: {},
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(true);
      expect(SettingsService.getSettings).toHaveBeenCalled();
      expect(mockOutputElement.textContent).toContain(
        "anthropicApiKey: sk-ant-test123"
      );
      expect(mockOutputElement.textContent).toContain(
        "model: claude-3-5-sonnet-20241022"
      );
      expect(mockHandleLog).toHaveBeenCalledWith("Retrieving settings...");
      expect(mockSetStatus).toHaveBeenCalledWith("ready", "Settings retrieved");
    });

    it("should handle error gracefully", async () => {
      const error = new Error("Failed to get settings");
      jest.spyOn(SettingsService, "getSettings").mockRejectedValue(error);

      const statement = new ScriptStatement({
        isCommand: true,
        command: "settings",
        options: {},
        prompt: "",
      });

      const result = await command.execute({
        statement,
        outputElement: mockOutputElement,
        handleLog: mockHandleLog,
        setStatus: mockSetStatus,
      });

      expect(result).toBe(false);
      expect(SettingsService.getSettings).toHaveBeenCalled();
      expect(mockHandleLog).toHaveBeenCalledWith(
        expect.stringContaining("Failed to get settings"),
        "error"
      );
      expect(mockSetStatus).toHaveBeenCalledWith("error", expect.any(String));
    });
  });
});
