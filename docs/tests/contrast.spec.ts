import { test, expect } from "@playwright/test";
import { contrast } from "./lib/color";

/**
 * WCAG 2.2 contrast guard for Porchlight's semantic color pairs.
 *
 * Reads RESOLVED colors from real elements styled by the --pl-* tokens on the
 * themes preview page, so a token edit that breaks contrast fails this test —
 * no hand-maintained value list to drift. Verifies the key text pairs in BOTH
 * light and dark (PLAN §6 acceptance criterion: AA = 4.5:1).
 */

const AA = 4.5;

const pairs = [
  {
    name: "accent (link) on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-accent)",
  },
  {
    name: "accent-text on accent (btn)",
    bg: "var(--pl-color-accent)",
    fg: "var(--pl-color-accent-text)",
  },
  {
    name: "danger-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-danger-text)",
  },
  {
    name: "success-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-success-text)",
  },
  {
    name: "warning-text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-warning-text)",
  },
] as const;

/** Resolve a (bg, fg) token pair to [bgColor, fgColor] strings in a theme. */
async function resolve(page: import("@playwright/test").Page, theme: string) {
  return page.evaluate(
    ([pairs, theme]) => {
      const root = document.querySelector(".playground") as HTMLElement;
      root.setAttribute("data-theme", theme);
      return pairs.map((p) => {
        const host = document.createElement("div");
        host.style.background = p.bg;
        const child = document.createElement("span");
        child.style.color = p.fg;
        host.append(child);
        root.append(host);
        const result: [string, string] = [
          getComputedStyle(host).backgroundColor,
          getComputedStyle(child).color,
        ];
        host.remove();
        return { name: p.name, colors: result };
      });
    },
    [pairs, theme] as const,
  );
}

for (const theme of ["light", "dark"] as const) {
  test(`semantic text pairs meet WCAG AA in ${theme}`, async ({ page }) => {
    await page.goto("./preview/themes");
    const results = await resolve(page, theme);
    for (const { name, colors } of results) {
      const [bg, fg] = colors;
      const ratio = contrast(fg, bg);
      expect(
        ratio,
        `${name} in ${theme}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(AA);
    }
  });
}
