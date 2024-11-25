/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/ScriptParser.test.ts
 */

import { describe, expect, it } from "@jest/globals";
import { ScriptParser } from "src/utils/ScriptParser";

describe("ScriptParser - Basic Structure", () => {
  it("should parse a single prompt", () => {
    const input = "Tell me a joke";
    const result = ScriptParser.parse(input);

    expect(result.statements).toHaveLength(1);
    expect(result.statements[0]).toEqual({
      prompt: "Tell me a joke",
      isCommand: false,
      command: null,
      options: {},
    });
  });

  it("should parse multiple prompts separated by semicolons", () => {
    const input = "Tell me a joke; What is the capital of France?";
    const result = ScriptParser.parse(input);

    expect(result.statements).toHaveLength(2);
    expect(result.statements[0].prompt).toBe("Tell me a joke");
    expect(result.statements[1].prompt).toBe("What is the capital of France?");
    expect(result.statements[0].isCommand).toBe(false);
    expect(result.statements[1].isCommand).toBe(false);
  });

  it("should handle semicolons in quoted text", () => {
    const input = 'Tell me a "long; complex" joke';
    const result = ScriptParser.parse(input);

    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].prompt).toBe('Tell me a "long; complex" joke');
    expect(result.statements[0].isCommand).toBe(false);
  });

  it("should handle mixed command and prompt statements", () => {
    const input = "Tell me a joke; /repeat MAX 3 Another joke; Final joke";
    const result = ScriptParser.parse(input);

    expect(result.statements).toHaveLength(3);
    expect(result.statements[0]).toEqual({
      prompt: "Tell me a joke",
      isCommand: false,
      command: null,
      options: {},
    });
    expect(result.statements[1].isCommand).toBe(true);
    expect(result.statements[1].command).toBe("repeat");
    expect(result.statements[2]).toEqual({
      prompt: "Final joke",
      isCommand: false,
      command: null,
      options: {},
    });
  });
});

describe("ScriptParser - Repeat Command", () => {
  it("should parse basic repeat command", () => {
    const input = `/repeat /max 3 Tell me a joke`;

    const result = ScriptParser.parse(input);
    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "repeat",
      options: {
        maxTries: 3,
      },
      prompt: "Tell me a joke",
    });
  });

  it("should use default maxTries when not specified", () => {
    const input = `/repeat Tell me a joke`;

    const result = ScriptParser.parse(input);
    expect(result.statements[0].options?.maxTries).toBe(10);
  });

  it("should parse repeat with stop_if condition", () => {
    const input = `/repeat /max 3 Tell me a joke /stop_if success`;

    const result = ScriptParser.parse(input);
    expect(result.statements[0].options).toEqual({
      maxTries: 3,
      stopConditions: [{ target: "success", type: "if" }],
    });
  });

  it("should parse repeat with stop_if_not condition", () => {
    const input = `/repeat Tell me a joke /max 3 /stop_if_not failure`;

    const result = ScriptParser.parse(input);
    expect(result.statements[0].options).toEqual({
      maxTries: 3,
      stopConditions: [{ target: "failure", type: "if_not" }],
    });
  });
});

describe("ScriptParser - Stop Conditions", () => {
  it("should parse stop_if condition with command", () => {
    const input = `/repeat Tell me a joke /stop_if laugh`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0].options).toEqual({
      maxTries: 10,
      stopConditions: [{ target: "laugh", type: "if" }],
    });
  });

  it("should parse stop_if_not condition with command", () => {
    const input = `/repeat Tell me a joke /stop_if_not groan`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0].options).toEqual({
      maxTries: 10,
      stopConditions: [{ target: "groan", type: "if_not" }],
    });
  });

  it("should parse quoted stop conditions", () => {
    const input = `/repeat Tell me a joke /stop_if "that was funny"`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0].options).toEqual({
      maxTries: 10,
      stopConditions: [{ target: "that was funny", type: "if" }],
    });
  });
});

describe("ScriptParser - Alias Commands", () => {
  it("should parse alias definition", () => {
    const input = `/alias @greet Hello, how can I assist you today?`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "alias",
      aliasCommand: {
        type: "alias",
        name: "greet",
        text: "Hello, how can I assist you today?",
      },
      options: {},
    });
  });

  it("should parse alias deletion", () => {
    const input = `/delete_alias @greet`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "delete_alias",
      aliasCommand: {
        type: "delete_alias",
        name: "greet",
      },
      options: {},
    });
  });

  it("should parse alias list command", () => {
    const input = `/list_alias`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "list_alias",
      aliasCommand: {
        type: "list_alias",
      },
      options: {},
    });
  });
});

describe("ScriptParser - ClaudePS Commands", () => {
  it("should parse project command", () => {
    const input = `/project`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      prompt: "",
      isCommand: true,
      command: "project",
      options: {},
    });
  });

  it("should parse chat command with artifacts option", () => {
    const input = `/chat /artifacts`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      prompt: "",
      isCommand: true,
      command: "chat",
      options: {
        includeArtifacts: true,
        includeConversation: true,
      },
    });
  });

  it("should parse search_project command", () => {
    const input = `/search_project budget report`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "search_project",
      options: {},
      searchText: "budget report",
    });
  });

  it("should parse query_project command", () => {
    const input = `/query_project Summarize the key points discussed.`;
    const result = ScriptParser.parse(input);

    expect(result.statements[0]).toEqual({
      isCommand: true,
      command: "query_project",
      options: {},
      prompt: "Summarize the key points discussed.",
    });
  });
});

describe("ScriptParser - Command Abbreviations", () => {
  it("should parse /c /a as chat command with includeArtifacts option", () => {
    const input = "/c /a";
    const result = ScriptParser.parse(input);

    expect(result.statements[0].command).toBe("chat");
    expect(result.statements[0]).toMatchObject({
      options: { includeArtifacts: true },
    });
  });

  it("should parse /sp with text as search_project command", () => {
    const input = "/sp report";
    const result = ScriptParser.parse(input);

    expect(result.statements[0].command).toBe("search_project");
    expect(result.statements[0]).toMatchObject({
      searchText: "report",
    });
  });

  it("should parse /qp with text as query_project command", () => {
    const input = "/qp summary";
    const result = ScriptParser.parse(input);

    expect(result.statements[0].command).toBe("query_project");
    expect(result.statements[0]).toMatchObject({
      prompt: "summary",
    });
  });
});

describe("ScriptParser - Error Handling", () => {
  it("should throw on invalid command", () => {
    expect(() => ScriptParser.parse("/invalid command")).toThrow(
      "Unknown command"
    );
  });

  it("should throw on missing prompt for query_project", () => {
    expect(() => ScriptParser.parse("/query_project")).toThrow(
      "Query project command requires a prompt"
    );
  });

  it("should throw on invalid alias syntax", () => {
    expect(() => ScriptParser.parse("/alias invalid")).toThrow(
      "Invalid alias syntax"
    );
  });

  it("should throw on conflicting stop conditions", () => {
    expect(() =>
      ScriptParser.parse("/repeat test /stop_if success /stop_if_not failure")
    ).toThrow("Cannot use both /stop_if and /stop_if_not options together");
  });
});
