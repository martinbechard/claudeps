/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/simpleCommands.test.ts
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  simpleCommands,
  SimpleCommand,
} from "../../../src/utils/commands/simpleCommands";
import {
  getOrganizationId,
  getProjectUuid,
} from "../../../src/utils/getClaudeIds";

// Mock getClaudeIds functions
jest.mock("../../../src/utils/getClaudeIds", () => ({
  getOrganizationId: jest.fn(),
  getProjectUuid: jest.fn(),
}));

describe("simpleCommands", () => {
  // Store original window.location
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: "/",
    };
  });

  afterAll(() => {
    // Restore original window.location
    window.location = originalLocation;
  });

  describe("URL detection", () => {
    it("should detect project URLs", () => {
      window.location.pathname = "/project/123";
      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(searchCmd?.isVisible?.()).resolves.toBe(true);
    });

    it("should detect chat URLs", () => {
      window.location.pathname = "/chat";
      const chatCmd = simpleCommands.find(
        (cmd) => cmd.label === "Current Chat"
      );
      expect(chatCmd?.isVisible?.()).resolves.toBe(true);
    });

    it("should not show project commands on non-project URLs", () => {
      window.location.pathname = "/other";
      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(searchCmd?.isVisible?.()).resolves.toBe(false);
    });

    it("should not show chat commands on non-chat URLs", () => {
      window.location.pathname = "/other";
      const chatCmd = simpleCommands.find(
        (cmd) => cmd.label === "Current Chat"
      );
      expect(chatCmd?.isVisible?.()).resolves.toBe(false);
    });
  });

  describe("Project context", () => {
    beforeEach(() => {
      window.location.pathname = "/chat";
    });

    it("should show project commands when project context is available in chat", async () => {
      jest.mocked(getOrganizationId).mockReturnValue("org123");
      jest.mocked(getProjectUuid).mockResolvedValue("proj123");

      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(await searchCmd?.isVisible?.()).toBe(true);
    });

    it("should not show project commands when project context is unavailable in chat", async () => {
      jest.mocked(getOrganizationId).mockReturnValue("org123");
      jest.mocked(getProjectUuid).mockRejectedValue(new Error("No project"));

      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(await searchCmd?.isVisible?.()).toBe(false);
    });

    it("should not show project commands when org ID is unavailable", async () => {
      jest.mocked(getOrganizationId).mockImplementation(() => {
        throw new Error("No org ID");
      });

      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(await searchCmd?.isVisible?.()).toBe(false);
    });
  });

  describe("Command visibility rules", () => {
    it("Search command should be visible in project context", async () => {
      window.location.pathname = "/project/123";
      const searchCmd = simpleCommands.find((cmd) => cmd.label === "Search");
      expect(await searchCmd?.isVisible?.()).toBe(true);
      expect(searchCmd?.noAutoRun).toBe(true);
    });

    it("Project Chats should be visible in project context", async () => {
      window.location.pathname = "/project/123";
      const projectCmd = simpleCommands.find(
        (cmd) => cmd.label === "Project Chats"
      );
      expect(await projectCmd?.isVisible?.()).toBe(true);
    });

    it("Current Chat should only be visible in chat context", async () => {
      window.location.pathname = "/chat";
      const chatCmd = simpleCommands.find(
        (cmd) => cmd.label === "Current Chat"
      );
      expect(await chatCmd?.isVisible?.()).toBe(true);

      window.location.pathname = "/project/123";
      expect(await chatCmd?.isVisible?.()).toBe(false);
    });

    it("Artifacts should only be visible in chat context", async () => {
      window.location.pathname = "/chat";
      const artifactsCmd = simpleCommands.find(
        (cmd) => cmd.label === "Artifacts"
      );
      expect(await artifactsCmd?.isVisible?.()).toBe(true);

      window.location.pathname = "/project/123";
      expect(await artifactsCmd?.isVisible?.()).toBe(false);
    });

    it("Knowledge should be visible in project context", async () => {
      window.location.pathname = "/project/123";
      const knowledgeCmd = simpleCommands.find(
        (cmd) => cmd.label === "Knowledge"
      );
      expect(await knowledgeCmd?.isVisible?.()).toBe(true);
    });
  });

  describe("Command structure", () => {
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
  });
});
