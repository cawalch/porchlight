import { expect, test } from "@playwright/test";

test("command-first shell opens the palette and the shortcut sheet", async ({
  page,
}) => {
  await page.goto("./preview/app-command-first");

  await page.getByRole("button", { name: /Search or jump to/ }).click();
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();
  await expect(palette.getByRole("option")).toHaveCount(5);
  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();

  await page.getByRole("button", { name: "Keyboard shortcuts" }).click();
  const sheet = page.getByRole("dialog", { name: "Keyboard shortcuts" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Close" }).click();
  await expect(sheet).toBeHidden();
});
