import { test, expect } from "@playwright/test";
import { compositeOver, contrast, toOklab } from "./lib/color";

/**
 * WCAG 2.2 contrast guard for Porchlight's semantic color pairs.
 *
 * Reads RESOLVED colors from real elements styled by the --pl-* tokens on the
 * themes preview page, so a token edit that breaks contrast fails this test:
 * no hand-maintained value list to drift. Verifies the key text pairs in BOTH
 * light and dark (PLAN §6 acceptance criterion: AA = 4.5:1).
 */

const AA = 4.5;

const pairs = [
  {
    name: "text on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-text)",
  },
  {
    name: "text-muted on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-text-muted)",
  },
  {
    name: "text-muted on surface",
    bg: "var(--pl-color-surface)",
    fg: "var(--pl-color-text-muted)",
  },
  {
    name: "text-faint on bg",
    bg: "var(--pl-color-bg)",
    fg: "var(--pl-color-text-faint)",
  },
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
    name: "accent-text on accent-hover (btn hover)",
    bg: "var(--pl-color-accent-hover)",
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
async function resolve(
  page: import("@playwright/test").Page,
  theme: string,
  palette = "",
) {
  return page.evaluate(
    ([pairs, theme, palette]) => {
      const root = document.querySelector(".playground") as HTMLElement;
      root.setAttribute("data-pl-theme", theme);
      if (palette) root.setAttribute("data-pl-palette", palette);
      else root.removeAttribute("data-pl-palette");
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
    [pairs, theme, palette] as const,
  );
}

async function expectPairsAA(
  page: import("@playwright/test").Page,
  theme: string,
  palette: string,
  label: string,
) {
  const results = await resolve(page, theme, palette);
  for (const { name, colors } of results) {
    const [bg, fg] = colors;
    const ratio = contrast(fg, bg);
    expect(
      ratio,
      `${name} in ${label}: ${ratio.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA);
  }

  const subtleResult = await page.evaluate(
    ([theme, palette]) => {
      const root = document.querySelector(".playground") as HTMLElement;
      root.setAttribute("data-pl-theme", theme);
      if (palette) root.setAttribute("data-pl-palette", palette);
      else root.removeAttribute("data-pl-palette");
      const host = document.createElement("div");
      host.style.background = "var(--pl-color-bg)";
      const subtle = document.createElement("div");
      subtle.style.background = "var(--pl-color-accent-subtle)";
      const text = document.createElement("span");
      text.style.color = "var(--pl-color-text)";
      const accent = document.createElement("span");
      accent.style.background = "var(--pl-color-accent)";
      const hover = document.createElement("span");
      hover.style.background = "var(--pl-color-accent-hover)";
      subtle.append(text, accent, hover);
      host.append(subtle);
      root.append(host);
      const res = {
        bg: getComputedStyle(host).backgroundColor,
        subtle: getComputedStyle(subtle).backgroundColor,
        fg: getComputedStyle(text).color,
        accent: getComputedStyle(accent).backgroundColor,
        hover: getComputedStyle(hover).backgroundColor,
      };
      host.remove();
      return res;
    },
    [theme, palette] as const,
  );

  const compositedSubtle = compositeOver(subtleResult.subtle, subtleResult.bg);
  const subtleRatio = contrast(subtleResult.fg, compositedSubtle);
  expect(
    subtleRatio,
    `text on accent-subtle in ${label}: ${subtleRatio.toFixed(2)}:1`,
  ).toBeGreaterThanOrEqual(AA);

  const accentL = toOklab(subtleResult.accent).L;
  const hoverL = toOklab(subtleResult.hover).L;
  if (theme === "light") {
    expect(
      hoverL,
      `accent-hover should darken in light mode (${label})`,
    ).toBeLessThan(accentL);
  } else {
    expect(
      hoverL,
      `accent-hover should lighten in dark mode (${label})`,
    ).toBeGreaterThan(accentL);
  }
}

const palettes = [
  "slate",
  "zinc",
  "midnight",
  "emerald",
  "amethyst",
  "crimson",
  "cyan",
] as const;

for (const theme of ["light", "dark"] as const) {
  test(`semantic text pairs meet WCAG AA in ${theme}`, async ({ page }) => {
    await page.goto("./preview/themes");
    await expectPairsAA(page, theme, "", theme);
  });

  for (const palette of palettes) {
    test(`palette ${palette} text pairs meet WCAG AA in ${theme}`, async ({
      page,
    }) => {
      await page.goto("./preview/themes");
      await expectPairsAA(page, theme, palette, `${palette} ${theme}`);
    });
  }
}

test("selected theme toggle has readable text in dark mode", async ({
  page,
}) => {
  await page.goto("./preview/themes");
  await page.locator("html").evaluate((html) => {
    html.dataset.plTheme = "dark";
  });
  const toggle = page.getByRole("button", { name: "dark" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const colors = await toggle.evaluate((el) => {
    const style = getComputedStyle(el);
    return { fg: style.color, bg: style.backgroundColor };
  });
  expect(contrast(colors.fg, colors.bg)).toBeGreaterThanOrEqual(AA);
});

test("palette presets derive distinct --pl-focus-color from their brand ramp", async ({
  page,
}) => {
  await page.goto("./preview/themes");
  const focusColors = await page.evaluate((paletteList) => {
    const root = document.querySelector(".playground") as HTMLElement;
    const read = (palette: string) => {
      if (palette) root.setAttribute("data-pl-palette", palette);
      else root.removeAttribute("data-pl-palette");
      const probe = document.createElement("span");
      probe.style.outlineColor = "var(--pl-focus-color)";
      root.append(probe);
      const val = getComputedStyle(probe).outlineColor;
      probe.remove();
      return val;
    };
    const base = read("");
    const entries = paletteList.map((p) => [p, read(p)] as const);
    return { base, entries };
  }, palettes);

  for (const [palette, color] of focusColors.entries) {
    expect(
      color,
      `palette ${palette} should not keep default amber focus ring`,
    ).not.toBe(focusColors.base);
  }
});
