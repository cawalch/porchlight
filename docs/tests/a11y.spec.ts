import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Deterministic accessibility scan, the PLAN §18 mandated check.
 *
 * Runs axe-core against every preview page and asserts zero serious/critical
 * violations at WCAG 2.2 AA. This is the deterministic a11y layer that can't
 * be eyeballed: it catches missing labels, contrast regressions (beyond the
 * token pairs we already test), ARIA misuse, keyboard-trap risks, etc.
 *
 * A violation here fails CI; fix the cause, don't disable the rule without a
 * documented reason.
 */

const PAGES = [
  "/preview/",
  "/preview/reset",
  "/preview/tokens",
  "/preview/themes",
  "/preview/base",
  "/preview/layout",
  "/preview/app-shell",
  "/preview/button",
  "/preview/field",
  "/preview/card",
  "/preview/badge",
  "/preview/popover-menu",
  "/preview/dialog",
  "/preview/data-table",
  "/preview/utilities",
  "/preview/enhancements",
];

// Normalize each path to the base-path-aware form Playwright expects.
const base =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321/porchlight";
const url = (path: string) => {
  const clean = path.replace(/^\//, "");
  return `${base.replace(/\/$/, "")}/${clean}`;
};

for (const path of PAGES) {
  test(`${path} has no serious/critical a11y violations`, async ({ page }) => {
    await page.goto(url(path));
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    if (serious.length > 0) {
      console.log(
        `\n[a11y] ${path}:\n` +
          serious
            .map(
              (v) =>
                `  ${v.impact}: ${v.id}: ${v.description}\n` +
                v.nodes
                  .slice(0, 3)
                  .map((n) => `      target: ${JSON.stringify(n.target)}`)
                  .join("\n"),
            )
            .join("\n"),
      );
    }
    expect(
      serious,
      `${path} must have zero serious/critical a11y violations`,
    ).toEqual([]);
  });
}
