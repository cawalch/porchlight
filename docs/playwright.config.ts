import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the Porchlight docs site.
 * Smoke + accessibility tests live in ./tests. Visual-regression snapshots are
 * added per-component in Phase 3.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  snapshotPathTemplate:
    "{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}",
  use: {
    // Astro serves the site under its base path (e.g. /porchlight/).
    // The trailing slash is required: astro preview returns 404 without it.
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321/porchlight/",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox-smoke",
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit-smoke",
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm run test:serve",
    url: "http://localhost:4321/porchlight/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
