import { test, expect } from "@playwright/test";

test.describe("cross-browser application smoke", () => {
  test("forms and application shell remain usable", async ({ page }) => {
    await page.goto("./preview/app-settings-console");
    await expect(page.locator("#main")).toBeVisible();
    await expect(page.getByRole("textbox").first()).toBeVisible();
  });

  test("dense tables fit without document overflow", async ({ page }) => {
    await page.goto("./preview/app-queue-triage");
    await expect(page.getByRole("table")).toBeVisible();
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test("native dialog opens and closes", async ({ page }) => {
    await page.goto("./preview/dialog");
    await page.locator("[data-open='confirm-dialog']").click();
    const dialog = page.locator("#confirm-dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});
