import { StorageService } from "../../src/services/StorageService";

// Configure StorageService to use MemoryStorage for tests
StorageService.useMemoryStorage();

// Default settings that match SettingsService defaults
const defaultSettings = {
  anthropic_api_settings: {
    model: "claude-3-5-sonnet-20241022",
    theme: "light",
    enableAnthropicApi: false,
    debugTraceRequests: false,
    debugWindowEvents: false,
  },
};

export const chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    sync: {
      get: jest.fn().mockImplementation((key) => {
        if (typeof key === "string") {
          // Return empty object if key doesn't exist in defaultSettings
          return Promise.resolve(
            key in defaultSettings ? { [key]: defaultSettings[key] } : {}
          );
        }
        return Promise.resolve(defaultSettings);
      }),
      set: jest.fn(),
    },
  },
};

(global as any).chrome = chrome;
