/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/utils/trace.ts
 */

import { SettingsService } from "../services/SettingsService";

export const DEBUG_KEYS = {
  WINDOW: "window",
  REQUESTS: "requests",
} as const;

type DebugKey = (typeof DEBUG_KEYS)[keyof typeof DEBUG_KEYS];

/**
 * Traces debug information based on the debug key and current settings
 * @param key The debug key to check against settings
 * @param args Arguments to log if debug is enabled
 */
export async function trace(key: DebugKey, ...args: any[]): Promise<void> {
  switch (key) {
    case DEBUG_KEYS.WINDOW:
      if (await SettingsService.getSetting("debugWindowEvents")) {
        console.log("[Window Event]", ...args);
      }
      break;
    case DEBUG_KEYS.REQUESTS:
      if (await SettingsService.getSetting("debugTraceRequests")) {
        console.log("[Request]", ...args);
      }
      break;
  }
}
