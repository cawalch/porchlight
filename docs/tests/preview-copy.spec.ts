import { expect, test } from "@playwright/test";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("preview toolbar copies framework markup to the clipboard", async ({
  page,
}) => {
  await page.goto("./preview/app-dashboard");

  const copy = page.getByRole("button", { name: "Copy HTML" });
  await expect(copy).toBeVisible();
  await copy.click();

  await expect(page.getByRole("status")).toHaveText(/copied/i);
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("pl-l-app-shell");
  expect(copied).not.toContain("pl-preview-toolbar");
});
