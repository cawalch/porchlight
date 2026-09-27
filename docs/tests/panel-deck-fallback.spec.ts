import { expect, test } from "@playwright/test";

test("unsupported tabs mode keeps every panel readable and keyboard reachable", async ({
  page,
  browserName,
}) => {
  await page.goto("./preview/panel-deck");
  // Firefox/WebKit projects exercise the real unsupported-browser gate.
  expect(
    await page.evaluate(() => CSS.supports("scroll-marker-group: before tabs")),
  ).toBe(false);
  const panels = page.locator("#workspace-deck > .pl-c-panel-deck__panel");
  for (let index = 0; index < 3; index++) {
    await expect(panels.nth(index)).toBeVisible();
    if (index > 0) {
      const previous = await panels.nth(index - 1).boundingBox();
      const current = await panels.nth(index).boundingBox();
      expect(
        current!.y - (previous!.y + previous!.height),
      ).toBeGreaterThanOrEqual(11);
    }
  }
  await page.locator("#deck-start").focus();
  for (const name of ["Review activity", "Read reports", "Browse resources"]) {
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    await expect(page.getByRole("link", { name })).toBeFocused();
  }
});
