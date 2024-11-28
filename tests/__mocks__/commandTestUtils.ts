/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: tests/__mocks__/commandTestUtils.ts
 */

import { jest } from "@jest/globals";
import type { LogFunction } from "../../src/utils/commands/BaseCommandInfo";
import type { StatusState } from "../../src/types";

// Create mock output element
export const mockOutputElement = document.createElement("div");

// Create properly typed mock functions
export const mockHandleLog: LogFunction = jest.fn();
export const mockSetStatus = jest.fn(
  (_state: StatusState, _details?: string, _clearInput?: boolean) =>
    Promise.resolve()
);

// Reset function to clear mocks and reset output element
export const resetMocks = () => {
  mockOutputElement.innerHTML = "";
  jest.clearAllMocks();
};
