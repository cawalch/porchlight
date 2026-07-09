import { test, expect } from "@playwright/test";
import { contrast } from "./lib/color";

/**
 * Badge contrast guard.
 *
 * Every tone uses a -bg/-text token pair, which were made WCAG-AA in the token
 * layer. This asserts that contract holds per-badge in BOTH themes — reading
 * the RESOLVED colors so a token edit that breaks a tone fails here.
 */

const AA = 4.5;
const TONES = ["accent", "success", "warning", "danger"] as const;

async function resolveBadge(
  page: import("@playwright/test").Page,
  tone: string,
): Promise<[string, string]> {
  return page.evaluate((tone) => {
    const el = document.querySelector(
      `.pl-c-badge[data-tone='${tone}']`,
    ) as HTMLElement;
    const cs = getComputedStyle(el);
    return [cs.backgroundColor, cs.color];
  }, tone);
}

for (const theme of ["light", "dark"] as const) {
  test(`badge tones meet WCAG AA in ${theme}`, async ({ page }) => {
    // The themes playground sets data-pl-theme; badges live on the badge page.
    // Set the theme on <html> directly so it applies app-wide.
    await page.addInitScript((theme) => {
      document.documentElement.setAttribute("data-pl-theme", theme);
    }, theme);
    await page.goto("./preview/badge");
    for (const tone of TONES) {
      const [bg, fg] = await resolveBadge(page, tone);
      const r = contrast(fg, bg);
      console.log(`[${theme}] ${tone}: ${r.toFixed(2)}:1`);
      expect(
        r,
        `${tone} badge in ${theme}: ${r.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA);
    }
  });
}
