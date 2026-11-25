import { expect, test } from "@playwright/test";

test("shortcut sheet uses a named dialog, grouped terms, and keycaps", async ({
  page,
}) => {
  await page.goto("./preview/shortcut-sheet");

  const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".pl-c-shortcut-sheet__group")).toHaveCount(4);
  await expect(dialog.getByRole("term")).toHaveCount(11);
  await expect(dialog.locator(".pl-c-kbd").first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeEnabled();
});
