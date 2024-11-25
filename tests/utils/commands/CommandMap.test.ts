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
    expect(getFullCommand("r")).toBe("repeat");
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
  });
});

describe("getCommandMatches", () => {
  it("should find exact command matches", () => {
    expect(getCommandMatches("project")).toEqual(["project"]);
    expect(getCommandMatches("chat")).toEqual(["chat"]);
  });

  it("should find matches by abbreviation", () => {
    expect(getCommandMatches("p")).toEqual(["project"]);
    expect(getCommandMatches("sp")).toEqual(["search_project"]);
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
  });

  it("should return undefined for commands without options", () => {
    expect(getCommandOptionDefinitions("project")).toBeUndefined();
    expect(getCommandOptionDefinitions("knowledge")).toBeUndefined();
  });

  it("should handle command abbreviations", () => {
    expect(getCommandOptionDefinitions("r")).toEqual({
      max: "with_arg",
      stop_if: "with_prompt",
      stop_if_not: "with_prompt",
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
