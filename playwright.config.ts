import { defineConfig } from "@playwright/test";
import { basePath } from "./scripts/base-path.ts";
export default defineConfig({
  testDir: "./e2e",
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:4173${basePath}`,
    trace: "retain-on-failure",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    },
    viewport: { width: 393, height: 851 },
  },
  webServer: {
    command: "pnpm build && pnpm preview --port 4173",
    url: `http://localhost:4173${basePath}`,
    reuseExistingServer: false,
  },
});
