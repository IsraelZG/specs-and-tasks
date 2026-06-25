import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
  },
  webServer: {
    cwd: ".",
    command: "pnpm build && pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 30000,
  },
});
