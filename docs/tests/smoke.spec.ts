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

  test("tokens page lists registered properties and a brand ramp", async ({
    page,
  }) => {
    await page.goto("./preview/tokens");
    await expect(
      page.getByRole("heading", { name: "Primitive tokens" }),
    ).toBeVisible();
    // Registered property name (exact: the value cells also mention it via calc()).
    await expect(
      page.getByText("--pl-motion-scale", { exact: true }),
    ).toBeVisible();
    // A brand primitive rendered as a swatch name.
    await expect(page.getByText("--pl-brand-6", { exact: true })).toBeVisible();
  });

  test("themes playground toggles density and updates the control", async ({
    page,
  }) => {
    await page.goto("./preview/themes");
    await expect(
      page.getByRole("heading", { name: "Themes & density" }),
    ).toBeVisible();
    const playground = page.locator(".playground");
    await expect(playground).toHaveAttribute("data-density", "comfortable");
    // Switch to touch density; the attribute (and thus --pl-control-block-size) changes.
    await page.getByRole("button", { name: "touch" }).click();
    await expect(playground).toHaveAttribute("data-density", "touch");
  });
});
