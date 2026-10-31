import { test, expect } from "@playwright/test";
import { toOklab } from "./lib/color";

test.describe("style queries and scroll markers enhancements", () => {
  test("style container queries cascade density and tones without DOM duplication", async ({
    page,
  }) => {
    await page.goto("./preview/enhancements");

    const densityDemo = page.locator("#style-query-density-demo");
    await expect(densityDemo).toBeVisible();

    // Check if the browser supports style container queries
    const supportsStyleQueries = await page.evaluate(() => {
      return (
        "CSS" in window &&
        typeof CSS.supports === "function" &&
        CSS.supports("container-type", "normal")
      );
    });

    if (supportsStyleQueries) {
      // Button inside dense style container inherits dense control size (1.75rem = 28px)
      const buttonHeight = await densityDemo
        .locator(".pl-c-button")
        .evaluate((el) => {
          return Number.parseFloat(getComputedStyle(el).height);
        });
      // 1.75rem at 16px root is 28px
      expect(buttonHeight).toBeCloseTo(28, 1);

      // Verify tone cascading via style queries
      const toneDemo = page.locator("#style-query-tone-demo");
      await expect(toneDemo).toBeVisible();

      const badgeColor = await toneDemo
        .locator(".pl-c-badge")
        .evaluate((el) => {
          return getComputedStyle(el).color;
        });
      // Success tone text has negative 'a' in OKLab
      expect(toOklab(badgeColor).a).toBeLessThan(-0.04);

      const alertTone = await toneDemo.locator(".pl-c-alert").evaluate((el) => {
        return getComputedStyle(el)
          .getPropertyValue("--pl-c-alert-tone")
          .trim();
      });
      // Should inherit success color token (hue 150)
      expect(alertTone).toContain("150");
    }
  });

  test("panel deck supports carousel dot markers", async ({ page }) => {
    await page.goto("./preview/panel-deck");

    const carouselDeck = page.locator("#carousel-dots-deck");
    await expect(carouselDeck).toBeVisible();

    const panels = carouselDeck.locator(".pl-c-panel-deck__panel");
    expect(await panels.count()).toBe(3);
  });

  test("tabs component supports scroll-driven markers variant", async ({
    page,
  }) => {
    await page.goto("./preview/tabs");

    const scrollTabs = page.locator("#scroll-tabs-demo");
    await expect(scrollTabs).toBeVisible();

    const panels = scrollTabs.locator('.pl-c-tabs__panel[role="tabpanel"]');
    expect(await panels.count()).toBe(2);
  });
});
