import { expect, test } from "@playwright/test";

for (const width of [320, 640, 1280]) {
  test(`panel deck contains content at ${width}px in light/dark and RTL`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./preview/panel-deck");
    for (const theme of ["light", "dark"]) {
      await page
        .locator("html")
        .evaluate(
          (root, value) => root.setAttribute("data-pl-theme", value),
          theme,
        );
      const geometry = await page.evaluate(() => ({
        overflow:
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        panels: [...document.querySelectorAll(".pl-c-panel-deck__panel")].map(
          (panel) => {
            const style = getComputedStyle(panel);
            return {
              overflow: panel.scrollWidth - panel.clientWidth,
              padding: parseFloat(style.paddingInlineStart),
            };
          },
        ),
      }));
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      for (const panel of geometry.panels) {
        expect(panel.overflow).toBeLessThanOrEqual(1);
        expect(panel.padding).toBeGreaterThanOrEqual(8);
      }
    }
  });
}
