/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/simpleCommands.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import {
  simpleCommands,
  SimpleCommand,
} from "../../../src/utils/commands/simpleCommands";

describe("simpleCommands", () => {
  it("should contain all required commands", () => {
    const expectedCommands = [
      "search_project",
      "project",
      "chat",
      "artifacts",
      "knowledge",
    ];

    expectedCommands.forEach((cmd) => {
      const found = simpleCommands.some((simpleCmd) =>
        simpleCmd.command.includes(`/${cmd}`)
      );
      expect(found).toBe(true);
    });
  });

  it("should have correct structure for each command", () => {
    simpleCommands.forEach((cmd) => {
      expect(cmd).toHaveProperty("label");
      expect(cmd).toHaveProperty("command");
      expect(cmd.label).toBeTruthy();
      expect(cmd.command.startsWith("/")).toBe(true);
    });
  });

  describe("Search command", () => {
    const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");

    it("should have correct configuration", () => {
      expect(searchCmd).toBeDefined();
      expect(searchCmd).toMatchObject({
        label: "Search",
        command: "/search_project ",
        className: "search-button",
        noAutoRun: true,
      });
      expect(searchCmd?.isVisible).toBeDefined();
    });

    it("should have space after command for user input", () => {
      expect(searchCmd?.command.endsWith(" ")).toBe(true);
    });
  });

  describe("Project Chats command", () => {
    const projectCmd = simpleCommands.find(
      (cmd) => cmd.label === "Project Chats"
    );

    it("should have correct configuration", () => {
      expect(projectCmd).toBeDefined();
      expect(projectCmd).toMatchObject({
        label: "Project Chats",
        command: "/project",
        className: "project-button",
      });
      expect(projectCmd?.isVisible).toBeDefined();
    });
  });

  describe("Basic commands", () => {
    const basicCmds = [
      { label: "Current Chat", command: "/chat" },
      { label: "Artifacts", command: "/artifacts" },
      { label: "Knowledge", command: "/knowledge" },
    ];

    basicCmds.forEach(({ label, command }) => {
      describe(label, () => {
        const cmd = simpleCommands.find((cmd) => cmd.label === label);

        it("should have correct basic configuration", () => {
          expect(cmd).toBeDefined();
          expect(cmd).toMatchObject({
            label,
            command,
          });
          expect(cmd?.isVisible).toBeDefined();
        });

        it("should not have className or noAutoRun", () => {
          expect(cmd?.className).toBeUndefined();
          expect(cmd?.noAutoRun).toBeUndefined();
        });
      });
    });
  });

  describe("Command order", () => {
    const expectedOrder = [
      "Search",
      "Project Chats",
      "Current Chat",
      "Artifacts",
      "Knowledge",
    ];

    it("should maintain specific order of commands", () => {
      const labels = simpleCommands.map((cmd) => cmd.label);
      expect(labels).toEqual(expectedOrder);
    });
  });

  describe("SimpleCommand interface", () => {
    it("should allow optional properties", () => {
      const validCommand: SimpleCommand = {
        label: "Test",
        command: "/test",
      };

      const withOptions: SimpleCommand = {
        label: "Test",
        command: "/test",
        className: "test-class",
        noAutoRun: true,
        isVisible: async () => true,
      };

      // TypeScript will catch if these assignments are invalid
      expect(validCommand.label).toBe("Test");
      expect(withOptions.className).toBe("test-class");
      expect(typeof withOptions.isVisible).toBe("function");
    });
  });
});
