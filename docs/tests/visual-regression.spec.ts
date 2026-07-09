import { test, expect } from "@playwright/test";

const surfaces = [
  ["form", "./preview/form"],
  ["data-table", "./preview/data-table"],
  ["calendar", "./preview/calendar"],
  ["list-detail", "./preview/app-list-detail"],
  ["process-builder", "./preview/app-process-builder"],
  ["settings-console", "./preview/app-settings-console"],
  ["reporting-dashboard", "./preview/app-reporting-dashboard"],
] as const;

test.describe("representative visual baselines", () => {
  for (const [name, path] of surfaces) {
    test(`${name} desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      await expect(page.locator("#main")).toBeVisible();
      await expect(page.locator("#main")).toHaveScreenshot(
        `${name}-desktop.png`,
        {
          animations: "disabled",
          // Font rasterization differs between local macOS baselines and the
          // Linux CI runner by up to 8%; layout regressions exceed this bound.
          maxDiffPixelRatio: 0.09,
        },
      );
    });
  }

  for (const [name, path] of surfaces.filter(([name]) =>
    ["form", "data-table", "list-detail", "settings-console"].includes(name),
  )) {
    test(`${name} mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      await expect(page.locator("#main")).toBeVisible();
      await expect(page.locator("#main")).toHaveScreenshot(
        `${name}-mobile.png`,
        {
          animations: "disabled",
          maxDiffPixelRatio: 0.09,
        },
      );
    });
  }
});
