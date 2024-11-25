/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/settingsCommand.test.ts
 */

jest.mock("../../../src/services/SettingsService", () => {
  return {
    SettingsService: {
      getSettings: jest.fn(),
      setSetting: jest.fn(),
      validateApiKey: jest.fn(),
      validateModel: jest.fn(),
      validateTheme: jest.fn(),
    },
  };
});

// Mock chrome.tabs API
global.chrome = {
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
} as any;

import { SettingsCommand } from "../../../src/utils/commands/settingsCommand";
import { SettingsService } from "../../../src/services/SettingsService";
import { ScriptStatement } from "../../../src/types";

describe("SettingsCommand", () => {
  let command: SettingsCommand;
  let outputElement: HTMLElement;

  beforeEach(() => {
    command = new SettingsCommand();
    outputElement = document.createElement("div");
    jest.clearAllMocks();
    (SettingsService.setSetting as jest.Mock).mockResolvedValue(undefined);
    // Setup chrome.tabs mock for theme updates
    (chrome.tabs.query as jest.Mock).mockImplementation((_, callback) =>
      callback([])
    );
  });

  it("should display current settings when no options provided", async () => {
    const mockSettings = {
      enableAnthropicApi: true,
      anthropicApiKey: "sk-ant-test123",
      model: "claude-3-5-sonnet-20241022",
      theme: "dark",
      debugTraceRequests: true,
      debugWindowEvents: false,
    };

    (SettingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: {},
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(outputElement.textContent).toContain("Current Settings:");
    expect(outputElement.textContent).toContain("Enabled");
    expect(outputElement.textContent).toContain("********");
    expect(outputElement.textContent).toContain("claude-3-5-sonnet-20241022");
    expect(outputElement.textContent).toContain("dark");
  });

  it("should update enable_api setting", async () => {
    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["enable_api" as string]: "true" },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "enableAnthropicApi",
      true
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should validate and update api_key setting", async () => {
    const validKey = "sk-ant-valid123";
    (SettingsService.validateApiKey as jest.Mock).mockReturnValue(null);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["api_key" as string]: validKey },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "anthropicApiKey",
      validKey
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should reject invalid api_key", async () => {
    const invalidKey = "invalid-key";
    const errorMessage = "Invalid API key format";
    (SettingsService.validateApiKey as jest.Mock).mockReturnValue(errorMessage);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["api_key" as string]: invalidKey },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(false);
    expect(SettingsService.setSetting).not.toHaveBeenCalled();
    expect(outputElement.textContent).toBe(`Invalid API key: ${errorMessage}`);
  });

  it("should validate and update model setting", async () => {
    const validModel = "claude-3-5-sonnet-20241022";
    (SettingsService.validateModel as jest.Mock).mockReturnValue(null);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["model" as string]: validModel },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "model",
      validModel
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should reject invalid model", async () => {
    const invalidModel = "invalid-model";
    const errorMessage = "Invalid model format";
    (SettingsService.validateModel as jest.Mock).mockReturnValue(errorMessage);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["model" as string]: invalidModel },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(false);
    expect(SettingsService.setSetting).not.toHaveBeenCalled();
    expect(outputElement.textContent).toBe(`Invalid model: ${errorMessage}`);
  });

  it("should validate and update theme setting", async () => {
    const validTheme = "dark";
    (SettingsService.validateTheme as jest.Mock).mockReturnValue(null);
    (chrome.tabs.query as jest.Mock).mockImplementation((_, callback) =>
      callback([{ id: 1 }])
    );
    (chrome.tabs.sendMessage as jest.Mock).mockImplementation(
      (_, __, callback) => callback()
    );

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["theme" as string]: validTheme },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "theme",
      validTheme
    );
    expect(chrome.tabs.query).toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "theme_changed", theme: validTheme },
      expect.any(Function)
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should reject invalid theme", async () => {
    const invalidTheme = "invalid-theme";
    const errorMessage = "Theme must be either 'light' or 'dark'";
    (SettingsService.validateTheme as jest.Mock).mockReturnValue(errorMessage);

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["theme" as string]: invalidTheme },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(false);
    expect(SettingsService.setSetting).not.toHaveBeenCalled();
    expect(outputElement.textContent).toBe(`Invalid theme: ${errorMessage}`);
  });

  it("should update debug_trace setting", async () => {
    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["debug_trace" as string]: "true" },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "debugTraceRequests",
      true
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should update debug_window setting", async () => {
    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["debug_window" as string]: "true" },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "debugWindowEvents",
      true
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should handle multiple settings updates", async () => {
    (SettingsService.validateTheme as jest.Mock).mockReturnValue(null);
    (chrome.tabs.query as jest.Mock).mockImplementation((_, callback) =>
      callback([{ id: 1 }])
    );
    (chrome.tabs.sendMessage as jest.Mock).mockImplementation(
      (_, __, callback) => callback()
    );

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: {
        ["theme" as string]: "light",
        ["debug_trace" as string]: "true",
        ["debug_window" as string]: "false",
      },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(true);
    expect(SettingsService.setSetting).toHaveBeenCalledWith("theme", "light");
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "debugTraceRequests",
      true
    );
    expect(SettingsService.setSetting).toHaveBeenCalledWith(
      "debugWindowEvents",
      false
    );
    expect(chrome.tabs.query).toHaveBeenCalled();
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      1,
      { type: "theme_changed", theme: "light" },
      expect.any(Function)
    );
    expect(outputElement.textContent).toBe("Settings updated successfully");
  });

  it("should handle errors during settings update", async () => {
    const errorMessage = "Storage error";
    (SettingsService.setSetting as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    const statement = new ScriptStatement({
      isCommand: true,
      command: "settings",
      options: { ["debug_trace" as string]: "true" },
    });

    const result = await command.execute({ statement, outputElement });

    expect(result).toBe(false);
    expect(outputElement.textContent).toBe(
      `Failed to update settings: ${errorMessage}`
    );
  });
});
