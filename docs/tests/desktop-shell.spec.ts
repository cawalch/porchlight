import { expect, test } from "@playwright/test";

test("desktop shell places the titlebar above the app shell", async ({
  page,
}) => {
  await page.goto("./preview/app-desktop");

  const titlebar = page.locator(".pl-l-desktop-shell__titlebar");
  const appShell = page.locator(".pl-l-desktop-shell > .pl-l-app-shell");

  await expect(titlebar).toBeVisible();
  await expect(appShell).toBeVisible();

  const titlebarBox = await titlebar.boundingBox();
  const appShellBox = await appShell.boundingBox();

  expect(titlebarBox, "titlebar should have a box").not.toBeNull();
  expect(appShellBox, "app shell should have a box").not.toBeNull();
  expect(titlebarBox!.y).toBeLessThan(appShellBox!.y);
  expect(titlebarBox!.height).toBeGreaterThanOrEqual(40);
});

test("titlebar actions stay clickable and open the quick-action menu", async ({
  page,
}) => {
  await page.goto("./preview/app-desktop");

  const trigger = page.getByRole("button", { name: /Quick actions/ });
  await trigger.click();

  const menu = page.locator("#desktop-quick-actions");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: /Open incident/ })).toBeVisible();
});
