/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^src/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/tests/**/*.test.ts"],
  setupFiles: ["<rootDir>/tests/__mocks__/chrome.ts"],
};

export default config;
