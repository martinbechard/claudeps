/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 */

import { HelpManager } from "../../../src/ui/components/HelpManager";

describe("HelpManager", () => {
  let helpManager: HelpManager;
  let outputElement: HTMLElement;

  beforeEach(() => {
    outputElement = document.createElement("div");
    helpManager = new HelpManager(outputElement);
  });

  test("show() displays help text correctly", () => {
    helpManager.show();

    // Verify help text contains key sections
    expect(outputElement.textContent).toContain("ClaudeScript v1.5");
    expect(outputElement.textContent).toContain("Content Commands:");
    expect(outputElement.textContent).toContain("Project Commands:");
    expect(outputElement.textContent).toContain("Knowledge & Settings:");
    expect(outputElement.textContent).toContain("Alias Commands:");
    expect(outputElement.textContent).toContain("Loop Command Format:");
  });

  test("show() creates pre-formatted lines", () => {
    helpManager.show();

    const lines = Array.from(outputElement.children) as HTMLElement[];
    expect(lines.length).toBeGreaterThan(0);

    lines.forEach((line) => {
      expect(line.tagName).toBe("DIV");
      expect(line.style.whiteSpace).toBe("pre");
    });
  });

  test("updateContent() updates help text with proper formatting", () => {
    const newText = "Line 1\nLine 2\nLine 3";
    helpManager.updateContent(newText);

    // Check number of div elements
    const divs = Array.from(outputElement.children) as HTMLElement[];
    expect(divs.length).toBe(3);

    // Check text content of each div
    expect(divs[0].textContent).toBe("Line 1");
    expect(divs[1].textContent).toBe("Line 2");
    expect(divs[2].textContent).toBe("Line 3");

    // Check formatting
    divs.forEach((div) => {
      expect(div.style.whiteSpace).toBe("pre");
    });

    // Check full text content with newlines
    expect(outputElement.textContent).toBe("Line 1\nLine 2\nLine 3");
  });

  test("clear() removes all content", () => {
    helpManager.show();
    expect(outputElement.children.length).toBeGreaterThan(0);

    helpManager.clear();
    expect(outputElement.children.length).toBe(0);
    expect(outputElement.textContent).toBe("");
  });

  test("help text includes all commands", () => {
    helpManager.show();
    const content = outputElement.textContent || "";

    // Content commands
    expect(content).toContain("/ch[at]");
    expect(content).toContain("/a[rtifacts]");

    // Project commands
    expect(content).toContain("/p[roject]");
    expect(content).toContain("/sp[search_project]");
    expect(content).toContain("/qp[query_project]");

    // Knowledge & Settings
    expect(content).toContain("/k[nowledge]");
    expect(content).toContain("/s[ettings]");
    expect(content).toContain("/r[oot]");

    // Root command options
    expect(content).toContain("View current download root path");
    expect(content).toContain("Set download root path for all files");
    expect(content).toContain("Clear download root path");

    // Alias commands
    expect(content).toContain("/al[ias]");
    expect(content).toContain("/da[delete_alias]");
    expect(content).toContain("/la[list_alias]");

    // Loop commands
    expect(content).toContain("/rp[repeat]");
    expect(content).toContain("/stop_if");
    expect(content).toContain("/stop_if_not");
  });

  test("help text includes context sensitivity information", () => {
    helpManager.show();
    const content = outputElement.textContent || "";

    expect(content).toContain(
      "Project commands require being in a project context"
    );
    expect(content).toContain(
      "Content commands require being in a chat context"
    );
    expect(content).toContain(
      "Settings and alias commands are available in any context"
    );
  });

  test("help text includes root command example", () => {
    helpManager.show();
    const content = outputElement.textContent || "";

    expect(content).toContain("/root downloads/claude");
    expect(content).toContain("/chat /multiple");
  });
});
