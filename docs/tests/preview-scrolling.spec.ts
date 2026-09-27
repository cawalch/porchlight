import { test, expect } from "@playwright/test";

const appPreviews = [
  "app-dashboard",
  "app-cases",
  "app-settings-console",
  "app-siem",
  "app-command-workspace",
  "app-queue-triage",
  "app-list-detail",
  "app-process-builder",
];

for (const width of [390, 1440]) {
  for (const preview of appPreviews) {
    test(`${preview} app bar scrolls clear of the docs header at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 600 });
      await page.goto(`./preview/${preview}`);
      // The command-workspace demo opens its command palette on load.
      const openPalette = page.locator("#workspace-command:popover-open");
      if (preview === "app-command-workspace") {
        await expect(openPalette).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(openPalette).toHaveCount(0);
      }
      const siteHeader = page.locator(".site-header");
      const appHeader = page.locator(
        "#main > .pl-l-app-shell > .pl-l-app-shell__topbar",
      );
      const siteBefore = (await siteHeader.boundingBox())!;
      const appBefore = (await appHeader.boundingBox())!;
      expect(appBefore.y).toBeGreaterThanOrEqual(
        siteBefore.y + siteBefore.height - 1,
      );

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect
        .poll(async () => {
          const box = (await appHeader.boundingBox())!;
          return box.y + box.height;
        })
        .toBeLessThanOrEqual(0);
      expect((await siteHeader.boundingBox())!.y).toBeCloseTo(0, 1);
      const headerUnobstructed = await siteHeader.evaluate((header) => {
        const box = header.getBoundingClientRect();
        // Sample the full bar, including gaps where sticky cells can intrude.
        for (let x = box.left + 8; x < box.right; x += 16) {
          for (let y = box.top + 8; y < box.bottom; y += 16) {
            if (!header.contains(document.elementFromPoint(x, y))) return false;
          }
        }
        return true;
      });
      expect(headerUnobstructed).toBe(true);
    });
  }
}

for (const width of [390, 639, 640, 1440]) {
  test(`Settings navigation stays separate from the form at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto("./preview/settings");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const nav = page.locator(".settings-nav");
    if (width < 640) {
      await expect(nav).toHaveCSS("position", "static");
      const navBox = (await nav.boundingBox())!;
      const formBox = (await page.locator(".settings-main").boundingBox())!;
      expect(navBox.y + navBox.height).toBeLessThan(formBox.y);
      expect(navBox.y + navBox.height).toBeLessThan(0);
    } else {
      await expect(nav).toHaveCSS("position", "sticky");
      const navBox = (await nav.boundingBox())!;
      const formBox = (await page.locator(".settings-main").boundingBox())!;
      expect(navBox.x + navBox.width).toBeLessThan(formBox.x);
    }
  });
}

test("the contained app-shell demo retains the framework sticky topbar", async ({
  page,
}) => {
  await page.goto("./preview/app-shell");
  await expect(
    page.locator("[data-app-shell] > .pl-l-app-shell__topbar"),
  ).toHaveCSS("position", "sticky");
});
