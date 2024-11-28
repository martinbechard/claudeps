/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/utils/commands/CommandMap.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import {
  COMMAND_MAP,
  getFullCommand,
  getCommandMatches,
  getCommandOptionDefinitions,
  CommandName,
} from "../../../src/utils/commands/CommandMap";
import { BaseCommandInfo } from "../../../src/utils/commands/BaseCommandInfo";

describe("COMMAND_MAP", () => {
  it("should include all required commands", () => {
    const expectedCommands = [
      "repeat",
      "chat",
      "artifacts",
      "stop_if",
      "stop_if_not",
      "project",
      "search_project",
      "query_project",
      "knowledge",
      "alias",
      "list_alias",
      "delete_alias",
      "settings",
      "root",
    ];

    expectedCommands.forEach((cmd) => {
      expect(COMMAND_MAP[cmd as CommandName]).toBeDefined();
      expect(COMMAND_MAP[cmd as CommandName]).toBeInstanceOf(BaseCommandInfo);
    });
  });
});

describe("getFullCommand", () => {
  it("should resolve standard command abbreviations", () => {
    expect(getFullCommand("p")).toBe("project");
    expect(getFullCommand("sp")).toBe("search_project");
    expect(getFullCommand("qp")).toBe("query_project");
    expect(getFullCommand("k")).toBe("knowledge");
    expect(getFullCommand("c")).toBe("chat");
    expect(getFullCommand("a")).toBe("artifacts");
    expect(getFullCommand("r")).toBe("root");
    expect(getFullCommand("s")).toBe("settings");
  });

  it("should handle alias command special cases", () => {
    expect(getFullCommand("@+")).toBe("alias");
    expect(getFullCommand("@-")).toBe("delete_alias");
    expect(getFullCommand("@?")).toBe("list_alias");
  });

  it("should return undefined for unknown abbreviations", () => {
    expect(getFullCommand("unknown")).toBeUndefined();
    expect(getFullCommand("@unknown")).toBeUndefined();
  });

  it("should be case insensitive", () => {
    expect(getFullCommand("P")).toBe("project");
    expect(getFullCommand("SP")).toBe("search_project");
    expect(getFullCommand("R")).toBe("root");
    expect(getFullCommand("S")).toBe("settings");
  });
});

describe("getCommandMatches", () => {
  it("should find exact command matches", () => {
    expect(getCommandMatches("project")).toEqual(["project"]);
    expect(getCommandMatches("chat")).toEqual(["chat"]);
    expect(getCommandMatches("root")).toEqual(["root"]);
    expect(getCommandMatches("settings")).toEqual(["settings"]);
  });

  it("should find matches by abbreviation", () => {
    expect(getCommandMatches("p")).toEqual(["project"]);
    expect(getCommandMatches("sp")).toEqual(["search_project"]);
    expect(getCommandMatches("r")).toEqual(["root"]);
    expect(getCommandMatches("s")).toEqual(["settings"]);
  });

  it("should handle alias command special cases", () => {
    expect(getCommandMatches("@+")).toEqual(["alias"]);
    expect(getCommandMatches("@-")).toEqual(["delete_alias"]);
    expect(getCommandMatches("@?")).toEqual(["list_alias"]);
  });

  it("should return empty array for no matches", () => {
    expect(getCommandMatches("unknown")).toEqual([]);
    expect(getCommandMatches("@unknown")).toEqual([]);
  });

  it("should be case insensitive", () => {
    expect(getCommandMatches("PROJECT")).toEqual(["project"]);
    expect(getCommandMatches("P")).toEqual(["project"]);
    expect(getCommandMatches("ROOT")).toEqual(["root"]);
    expect(getCommandMatches("R")).toEqual(["root"]);
    expect(getCommandMatches("SETTINGS")).toEqual(["settings"]);
    expect(getCommandMatches("S")).toEqual(["settings"]);
  });
});

describe("getCommandOptionDefinitions", () => {
  it("should return options for commands with options", () => {
    expect(getCommandOptionDefinitions("repeat")).toEqual({
      max: "with_arg",
      stop_if: "with_prompt",
      stop_if_not: "with_prompt",
    });

    expect(getCommandOptionDefinitions("chat")).toEqual({
      artifacts: "no_arg",
    });

    expect(getCommandOptionDefinitions("root")).toEqual({
      path: "with_arg",
    });

    expect(getCommandOptionDefinitions("settings")).toEqual({
      enable_api: "with_arg",
      api_key: "with_arg",
      model: "with_arg",
      theme: "with_arg",
      debug_trace: "with_arg",
      debug_window: "with_arg",
    });
  });

  it("should return undefined for commands without options", () => {
    expect(getCommandOptionDefinitions("project")).toBeUndefined();
    expect(getCommandOptionDefinitions("knowledge")).toBeUndefined();
  });

  it("should handle command abbreviations", () => {
    expect(getCommandOptionDefinitions("r")).toEqual({
      path: "with_arg",
    });

    expect(getCommandOptionDefinitions("s")).toEqual({
      enable_api: "with_arg",
      api_key: "with_arg",
      model: "with_arg",
      theme: "with_arg",
      debug_trace: "with_arg",
      debug_window: "with_arg",
    });
  });

  it("should return undefined for unknown commands", () => {
    expect(getCommandOptionDefinitions("unknown")).toBeUndefined();
  });

  it("should handle alias command special cases", () => {
    expect(getCommandOptionDefinitions("@+")).toBeUndefined();
    expect(getCommandOptionDefinitions("@-")).toBeUndefined();
    expect(getCommandOptionDefinitions("@?")).toBeUndefined();
  });
});
