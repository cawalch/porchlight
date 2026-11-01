import { test, expect } from "@playwright/test";

test.describe("SOTA Action Bar & Radial KPI Gauge Capabilities", () => {
  test.describe("Pure-CSS Reactive Action Bar", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./preview/action-bar");
    });

    test("is initially hidden when no rows are selected", async ({ page }) => {
      const actionBar = page.locator("#demo-action-bar");
      await expect(actionBar).toHaveCSS("visibility", "hidden");
      await expect(actionBar).toHaveCSS("opacity", "0");
    });

    test("reactively reveals when any checkbox is checked via :has(:checked)", async ({
      page,
    }) => {
      const actionBar = page.locator("#demo-action-bar");
      const checkRow1 = page.locator("#check-row-1");

      // Check row 1
      await checkRow1.check();
      await expect(actionBar).toHaveCSS("visibility", "visible");
      await expect(actionBar).toHaveCSS("opacity", "1");

      // Verify action buttons inside are accessible
      const exportButton = actionBar.getByRole("button", {
        name: "Export CSV",
      });
      await expect(exportButton).toBeVisible();

      // Uncheck row 1 -> stows away
      await checkRow1.uncheck();
      await expect(actionBar).toHaveCSS("visibility", "hidden");
      await expect(actionBar).toHaveCSS("opacity", "0");
    });

    test("displays static inline variant with data-open", async ({ page }) => {
      const inlineBar = page.locator('.pl-c-action-bar[data-open="true"]');
      await expect(inlineBar).toBeVisible();
      await expect(inlineBar).toHaveCSS("visibility", "visible");
      await expect(inlineBar).toHaveCSS("opacity", "1");

      const count = inlineBar.locator(".pl-c-action-bar__count");
      await expect(count).toHaveText("4 items selected");
    });
  });

  test.describe("Pure-CSS Radial KPI Gauge", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("./preview/gauge");
    });

    test("renders gauges with meter roles and values", async ({ page }) => {
      const uptimeGauge = page.locator(
        '.pl-c-gauge[aria-label="System Uptime"]',
      );
      await expect(uptimeGauge).toBeVisible();
      await expect(uptimeGauge).toHaveAttribute("role", "meter");
      await expect(uptimeGauge.locator(".pl-c-gauge__value")).toHaveText(
        "99.8%",
      );
      await expect(uptimeGauge.locator(".pl-c-gauge__label")).toHaveText("SLA");
    });

    test("applies size modifiers correctly", async ({ page }) => {
      const smGauge = page.locator('.pl-c-gauge[data-size="sm"]');
      const lgGauge = page.locator('.pl-c-gauge[data-size="lg"]').first();

      const smBox = await smGauge.boundingBox();
      const lgBox = await lgGauge.boundingBox();

      expect(smBox).not.toBeNull();
      expect(lgBox).not.toBeNull();
      if (smBox && lgBox) {
        expect(smBox.width).toBeLessThan(lgBox.width);
        expect(smBox.height).toBeLessThan(lgBox.height);
      }
    });

    test("renders speedometer arc variant with reduced vertical height", async ({
      page,
    }) => {
      const arcGauge = page.locator('.pl-c-gauge[data-variant="arc"]').first();
      await expect(arcGauge).toBeVisible();

      const box = await arcGauge.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // In arc mode, block-size is compressed to ~65% of inline-size
        expect(box.height).toBeLessThan(box.width);
      }
    });
  });

  test.describe("Anchor-size trigger-width matching on dropdowns", () => {
    test("expands menu to match wide trigger in anchor-supported browsers", async ({
      page,
    }) => {
      await page.goto("./preview/dropdown");

      const hasAnchorSupport = await page.evaluate(
        () =>
          CSS.supports("position-anchor: --x") &&
          CSS.supports("min-inline-size: anchor-size(self-inline)"),
      );

      const trigger = page.locator("#dd-trigger-3");
      const menu = page.locator("#dd-3");

      await trigger.click();
      await expect(menu).toBeVisible();

      if (hasAnchorSupport) {
        const triggerBox = await trigger.boundingBox();
        const menuBox = await menu.boundingBox();

        expect(triggerBox).not.toBeNull();
        expect(menuBox).not.toBeNull();
        if (triggerBox && menuBox) {
          // Menu should match or exceed trigger width via anchor-size(self-inline)
          expect(menuBox.width).toBeGreaterThanOrEqual(triggerBox.width - 2);
        }
      }
    });
  });
});
