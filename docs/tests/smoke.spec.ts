import { test, expect } from "@playwright/test";

/**
 * Scaffold smoke tests — confirm the site builds and the accessible chrome
 * (skip link, heading, title) is present. Per-component visual + axe suites
 * arrive with the components in Phase 3.
 */
test.describe("docs scaffold", () => {
  test("home renders with a title and heading", async ({ page }) => {
    await page.goto("./");
    await expect(page).toHaveTitle(/Porchlight/);
    await expect(
      page.getByRole("heading", { name: "Porchlight", level: 1 }),
    ).toBeVisible();
  });

  test("skip link is keyboard-focusable and visible", async ({ page }) => {
    await page.goto("./");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await skip.focus();
    await expect(skip).toBeVisible();
  });

  test("preview gallery page is reachable", async ({ page }) => {
    await page.goto("./preview");
    await expect(
      page.getByRole("heading", { name: "Preview gallery" }),
    ).toBeVisible();
  });

  test("reset preview page renders and lists the layers", async ({ page }) => {
    await page.goto("./preview/reset");
    await expect(page.getByRole("heading", { name: "Reset" })).toBeVisible();
    await expect(page.getByText("porchlight.reset")).toBeVisible();
  });
});
