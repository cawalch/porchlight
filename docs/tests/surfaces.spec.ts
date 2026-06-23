import { test, expect } from "@playwright/test";
import { contrast, deltaL } from "./lib/color";

/**
 * Adjacent-surface distinguishability guard.
 *
 * WCAG text contrast is the WRONG metric for "are two fills next to each other
 * distinguishable" — bg vs surface-2 can pass 4.5:1 for text yet be so close
 * in lightness that a secondary button disappears into the page. The right
 * metric is OKLab ∆L (a perceptual lightness step) plus a minimum contrast
 * ratio. Asserts the framework's neutral surfaces are visibly distinct in BOTH
 * themes, so a component placed on bg/surface/surface-2 always reads.
 */

const MIN_DL = 0.03; // ~3% lightness — floor of "visibly distinct adjacent fills"
const MIN_RATIO = 1.1;

const surfaces = [
  "var(--pl-color-bg)",
  "var(--pl-color-surface)",
  "var(--pl-color-surface-2)",
] as const;

async function resolveSurfaces(
  page: import("@playwright/test").Page,
  theme: string,
): Promise<{ token: string; color: string }[]> {
  return page.evaluate(
    ([surfaces, theme]) => {
      const root = document.querySelector(".playground") as HTMLElement;
      root.setAttribute("data-theme", theme);
      const out = surfaces.map((token) => {
        const el = document.createElement("div");
        el.style.background = token;
        root.append(el);
        const color = getComputedStyle(el).backgroundColor;
        el.remove();
        return { token, color };
      });
      return out;
    },
    [surfaces, theme] as const,
  );
}

for (const theme of ["light", "dark"] as const) {
  test(`neutral surfaces are perceptibly distinct in ${theme}`, async ({
    page,
  }) => {
    await page.goto("./preview/themes");
    const resolved = await resolveSurfaces(page, theme);
    // Log every pair so a failure shows the actual numbers.
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const a = resolved[i];
        const b = resolved[j];
        const dl = deltaL(a.color, b.color);
        const r = contrast(a.color, b.color);
        console.log(
          `[${theme}] ${a.token} ↔ ${b.token}: ΔL=${dl.toFixed(4)} ratio=${r.toFixed(2)}`,
        );
      }
    }
    // bg ↔ surface-2 is the pair that matters most (secondary buttons, raised panels).
    const bg = resolved.find((s) => s.token.includes("--pl-color-bg)"))!.color;
    const surface2 = resolved.find((s) =>
      s.token.includes("--pl-color-surface-2)"),
    )!.color;
    expect(
      deltaL(bg, surface2),
      `bg ↔ surface-2 ΔL in ${theme} must be ≥ ${MIN_DL}`,
    ).toBeGreaterThanOrEqual(MIN_DL);
    expect(
      contrast(bg, surface2),
      `bg ↔ surface-2 ratio in ${theme} must be ≥ ${MIN_RATIO}`,
    ).toBeGreaterThanOrEqual(MIN_RATIO);
  });
}
