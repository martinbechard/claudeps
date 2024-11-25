/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/ui/components/FloatingWindow.test.ts
 */

import { FloatingWindow } from "../../../src/ui/components/FloatingWindow";
import { SettingsService } from "../../../src/services/SettingsService";
import type { SimpleCommand } from "../../../src/utils/commands/simpleCommands";

// Mock chrome API
jest.mock("chrome", () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
  },
}));

// Mock SettingsService
jest.mock("../../../src/services/SettingsService", () => ({
  SettingsService: {
    getSetting: jest.fn().mockResolvedValue("light"),
  },
}));

// Mock WindowStateService
jest.mock("../../../src/services/WindowStateService", () => ({
  WindowStateService: {
    saveScriptHeight: jest.fn(),
  },
}));

// Mock simpleCommands module
jest.mock("../../../src/utils/commands/simpleCommands", () => {
  const mockCommands: SimpleCommand[] = [
    {
      label: "Test Command 1",
      command: "/test1",
      isVisible: jest.fn(),
    },
    {
      label: "Test Command 2",
      command: "/test2",
      isVisible: jest.fn(),
    },
  ];
  return { simpleCommands: mockCommands };
});

describe("FloatingWindow", () => {
  let floatingWindow: FloatingWindow;
  let originalLocation: Location;
  let mockSimpleCommands: SimpleCommand[];

  beforeEach(() => {
    // Mock window.location for claude.ai
    originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      hostname: "claude.ai",
      pathname: "/chat",
    } as Location;

    // Get reference to mock commands
    mockSimpleCommands =
      require("../../../src/utils/commands/simpleCommands").simpleCommands;

    floatingWindow = new FloatingWindow();
  });

  afterEach(() => {
    window.location = originalLocation;
    jest.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("generateSimpleButtons", () => {
    it("should display message when no commands are visible", async () => {
      // Set all commands to be invisible
      mockSimpleCommands.forEach((cmd) => {
        (cmd.isVisible as jest.Mock).mockResolvedValue(false);
      });

      const window = await floatingWindow.create();
      const simpleButtons = window.querySelector(".simple-buttons");

      expect(simpleButtons?.innerHTML.trim()).toContain(
        "Please select a Project or a Chat"
      );
      expect(simpleButtons?.innerHTML).not.toContain("command-button");
    });

    it("should display buttons when commands are visible", async () => {
      // Set first command to be visible
      (mockSimpleCommands[0].isVisible as jest.Mock).mockResolvedValue(true);
      (mockSimpleCommands[1].isVisible as jest.Mock).mockResolvedValue(false);

      const window = await floatingWindow.create();
      const simpleButtons = window.querySelector(".simple-buttons");

      expect(simpleButtons?.innerHTML).not.toContain(
        "Please select a Project or a Chat"
      );
      expect(simpleButtons?.innerHTML).toContain("command-button");
      expect(simpleButtons?.innerHTML).toContain("Test Command 1");
    });

    it("should update message when visibility changes", async () => {
      // Start with one visible command
      (mockSimpleCommands[0].isVisible as jest.Mock).mockResolvedValue(true);
      (mockSimpleCommands[1].isVisible as jest.Mock).mockResolvedValue(false);

      const window = await floatingWindow.create();
      let simpleButtons = window.querySelector(".simple-buttons");

      // Initially should show buttons
      expect(simpleButtons?.innerHTML).toContain("command-button");
      expect(simpleButtons?.innerHTML).not.toContain(
        "Please select a Project or a Chat"
      );

      // Change visibility
      (mockSimpleCommands[0].isVisible as jest.Mock).mockResolvedValue(false);
      await (floatingWindow as any).updateButtonVisibility();

      simpleButtons = window.querySelector(".simple-buttons");
      expect(simpleButtons?.innerHTML).toContain(
        "Please select a Project or a Chat"
      );
      expect(simpleButtons?.innerHTML).not.toContain("command-button");
    });
  });
});
