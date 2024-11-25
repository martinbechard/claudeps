/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/ui/components/DownloadTable.test.ts
 */

import { DownloadTable } from "../../../src/ui/components/DownloadTable";
import { ThemeManager } from "../../../src/ui/theme";
import type { DocumentInfo } from "../../../src/types";

describe("DownloadTable", () => {
  let container: HTMLElement;
  let existingContent: HTMLElement;
  let table: DownloadTable;

  beforeAll(() => {
    // Initialize ThemeManager before tests
    ThemeManager.initialize();
  });

  beforeEach(() => {
    // Create container and existing content
    container = document.createElement("div");
    existingContent = document.createElement("div");
    existingContent.textContent = "Existing content";
    existingContent.id = "existing-content";
    container.appendChild(existingContent);
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (table) {
      table.destroy();
    }
    document.body.removeChild(container);
  });

  describe("Container Management", () => {
    test("preserves existing content when creating table", () => {
      // Create table with some test data
      const docs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ];

      table = new DownloadTable(container, docs);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");

      // Verify table was also added
      expect(container.querySelector("table")).toBeTruthy();
    });

    test("properly manages wrapper div", () => {
      table = new DownloadTable(container, []);

      // Find wrapper div (should be after existing content)
      const children = Array.from(container.children);
      const wrapper = children[1] as HTMLElement;
      expect(wrapper).toBeTruthy();
      expect(wrapper.style.cssText).toContain("display: flex");
      expect(wrapper.style.cssText).toContain("flex-direction: column");
      expect(wrapper.style.cssText).toContain("width: 100%");

      // Verify existing content is before wrapper
      expect(children[0].id).toBe("existing-content");
    });

    test("cleans up properly when destroyed", () => {
      table = new DownloadTable(container, [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ]);

      // Verify table elements were added
      const wrapper = container.querySelector(".download-table-wrapper");
      expect(wrapper).toBeTruthy();
      expect(wrapper?.querySelector("table")).toBeTruthy();

      // Destroy table
      table.destroy();

      // Verify table elements were removed but existing content remains
      expect(container.querySelector(".download-table-wrapper")).toBeFalsy();
      expect(container.querySelector("table")).toBeFalsy();
      expect(container.querySelector("#existing-content")).toBeTruthy();
    });

    test("handles multiple renders correctly", () => {
      // Initial render happens in constructor
      table = new DownloadTable(container, []);
      expect(container.querySelectorAll(".download-table-wrapper").length).toBe(
        1
      );

      // Manual render should replace existing wrapper
      table.render();
      expect(container.querySelectorAll(".download-table-wrapper").length).toBe(
        1
      );

      // Verify existing content is still first
      const children = Array.from(container.children);
      expect(children[0].id).toBe("existing-content");
    });
  });

  describe("Content Updates", () => {
    test("preserves existing content when updating items", () => {
      table = new DownloadTable(container, []);

      const newDocs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
        },
      ];

      table.updateItems(newDocs);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });

    test("preserves existing content when adding rows", () => {
      table = new DownloadTable(container, []);

      const newDoc: DocumentInfo = {
        fileName: "test.txt",
        filePath: "test.txt",
        content: "test content",
        isSelected: false,
      };

      table.addRow(newDoc);

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });

  describe("Search Results", () => {
    test("preserves existing content when updating search results", () => {
      const docs: DocumentInfo[] = [
        {
          fileName: "test.txt",
          filePath: "test.txt",
          content: "test content",
          isSelected: false,
          metadata: {
            conversationId: "test-id",
          },
        },
      ];

      table = new DownloadTable(container, docs);

      table.updateSearchResult("test-id", undefined, "Test status");

      // Verify existing content is still present
      const existingDiv = container.querySelector("#existing-content");
      expect(existingDiv).toBeTruthy();
      expect(existingDiv?.textContent).toBe("Existing content");
    });
  });
});
