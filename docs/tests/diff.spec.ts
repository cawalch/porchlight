import { expect, test } from "@playwright/test";

test("unified diff exposes add, remove, and context lines", async ({
  page,
}) => {
  await page.goto("./preview/diff");

  const unified = page.locator(".pl-c-diff").first();
  await expect(unified).toBeVisible();
  await expect(unified.locator('[data-pl-kind="add"]')).toHaveCount(2);
  await expect(unified.locator('[data-pl-kind="remove"]')).toHaveCount(1);
  await expect(unified.locator('[data-pl-kind="context"]')).toHaveCount(2);
  await expect(unified.locator(".pl-c-diff__old").first()).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("split diff composes two panes", async ({ page }) => {
  await page.goto("./preview/diff");

  const split = page.locator(".pl-c-diff__split");
  await expect(split).toBeVisible();
  await expect(split.locator(".pl-c-diff__pane")).toHaveCount(2);
});
