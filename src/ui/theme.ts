/**
 * Copyright (c) 2024 Martin Bechard <martin.bechard@DevConsult.ca>
 * This software is licensed under the MIT License.
 * File: src/ui/theme.ts
 */

import { SettingsService } from "../services/SettingsService";

export interface ThemeColors {
  primary: string;
  border: string;
  text: string;
  background: string;
  codeBg: string;
  buttonBg: string;
  buttonText: string;
  inputBg: string;
  inputText: string;
  headerBg: string;
  hoverBg: string;
  success: string;
  error: string;
  star: string;
  starShadow: string;
}

const lightTheme: ThemeColors = {
  primary: "#0066cc",
  border: "#ccc",
  text: "#333",
  background: "#fff",
  codeBg: "#f5f5f5",
  buttonBg: "#0066cc",
  buttonText: "#fff",
  inputBg: "#fff",
  inputText: "#333",
  headerBg: "#f5f5f5",
  hoverBg: "#f0f0f0",
  success: "#28a745",
  error: "#dc3545",
  star: "#ffd700",
  starShadow: "#b38f00",
};

const darkTheme: ThemeColors = {
  primary: "#3399ff", // Brighter blue for better visibility in dark mode
  border: "#444",
  text: "#e0e0e0",
  background: "#2d2d2d",
  codeBg: "#1e1e1e",
  buttonBg: "#3399ff", // Match primary color
  buttonText: "#fff",
  inputBg: "#1e1e1e",
  inputText: "#e0e0e0",
  headerBg: "#3d3d3d",
  hoverBg: "#3d3d3d",
  success: "#2ea043", // Darker success green for dark mode
  error: "#f85149", // Brighter error red for dark mode
  star: "#ffd700", // Keep same star color
  starShadow: "#b38f00", // Keep same star shadow
};

export class ThemeManager {
  private static currentTheme: "light" | "dark" = "light";
  private static listeners: ((theme: "light" | "dark") => void)[] = [];
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const theme = (await SettingsService.getSetting("theme")) as
        | "light"
        | "dark";
      this.currentTheme = theme || "light"; // Default to light if no theme is set
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize theme:", error);
      // Keep using default theme (light) if initialization fails
      this.initialized = true;
    }
  }

  public static getColors(): ThemeColors {
    if (!this.initialized) {
      console.warn("ThemeManager.getColors() called before initialization");
    }
    return this.currentTheme === "light" ? lightTheme : darkTheme;
  }

  public static getCurrentTheme(): "light" | "dark" {
    if (!this.initialized) {
      console.warn(
        "ThemeManager.getCurrentTheme() called before initialization"
      );
    }
    return this.currentTheme;
  }

  public static addThemeChangeListener(
    listener: (theme: "light" | "dark") => void
  ): void {
    this.listeners.push(listener);
  }

  public static removeThemeChangeListener(
    listener: (theme: "light" | "dark") => void
  ): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  public static async setTheme(theme: "light" | "dark"): Promise<void> {
    this.currentTheme = theme;
    await SettingsService.setSetting("theme", theme);
    this.listeners.forEach((listener) => listener(theme));
  }
}

// Listen for theme changes from options page
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "theme_changed") {
    ThemeManager.setTheme(message.theme);
  }
});
