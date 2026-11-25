import { expect, test } from "@playwright/test";

test("undo bar announces the result and keeps Undo reachable", async ({
  page,
}) => {
  await page.goto("./preview/undo");

  const undo = page.locator(".pl-c-undo");
  await expect(undo).toBeVisible();
  await expect(undo.getByRole("status")).toContainText(
    "3 records moved to Archive.",
  );
  await expect(undo.getByRole("button", { name: "Undo" })).toBeEnabled();
  await expect(undo.getByRole("button", { name: "Dismiss" })).toBeEnabled();
  await expect(undo.locator(".pl-c-undo__timer")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
});

test("pending, saved, and error actions reuse the existing status primitives", async ({
  page,
}) => {
  await page.goto("./preview/undo");

  const pending = page.locator("tr[aria-busy='true']");
  await expect(pending).toHaveCount(1);
  await expect(pending.getByRole("status")).toContainText("Saving");
  await expect(pending.locator(".pl-c-spinner")).toHaveAttribute(
    "aria-hidden",
    "true",
  );

  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page.getByText("Failed", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeEnabled();
});
