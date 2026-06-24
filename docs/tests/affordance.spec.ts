import { test, expect } from "@playwright/test";
import { alpha, compositeOver, deltaL } from "./lib/color";

/**
 * Interactive-state affordance guard.
 *
 * A hover/pressed state that's perceptually indistinguishable from default is
 * an invisible affordance (the reported "button barely visible on hover" bug).
 * For each button variant, composites the default / hover / pressed fills over
 * the PAGE bg (so translucent hovers are measured as what the eye sees) and
 * asserts a minimum perceptual step. Also enforces an alpha floor on
 * translucent state fills — a ~7%-alpha veil reads as "barely there" even when
 * its composite ΔL scrapes past, so we require a clear wash instead.
 */

const STATE_DL = 0.03; // hover/pressed must shift ≥3% lightness from default
const ALPHA_FLOOR = 0.12; // translucent state fills must be a clear wash

const variants = ["primary", "secondary", "ghost"] as const;

interface Probe {
  variant: string;
  pageBg: string;
  states: { default: string; hover: string; pressed: string };
}

async function probe(page: import("@playwright/test").Page): Promise<Probe[]> {
  return page.evaluate(
    (variants) => {
      const shell = document.querySelector("main") as HTMLElement;
      const pageBg = getComputedStyle(document.body).backgroundColor;
      const wrap = document.createElement("div");
      wrap.style.padding = "1rem";
      shell.append(wrap);
      const out = variants.map((variant) => {
        const mk = (attrs: Record<string, string>) => {
          const b = document.createElement("button");
          b.className = "c-button";
          b.dataset.variant = variant;
          b.textContent = variant;
          for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
          wrap.append(b);
          const bg = getComputedStyle(b).backgroundColor;
          b.remove();
          return bg;
        };
        return {
          variant,
          pageBg,
          states: {
            default: mk({}),
            hover: mk({ "data-hover": "" }),
            pressed: mk({ "aria-pressed": "true" }),
          },
        };
      });
      wrap.remove();
      return out;
    },
    [...variants],
  );
}

test("button hover/pressed are perceptibly distinct from default", async ({
  page,
}) => {
  await page.goto("./preview/button");
  const probes = await probe(page);
  for (const { variant, pageBg, states } of probes) {
    const def = compositeOver(states.default, pageBg);
    const hov = compositeOver(states.hover, pageBg);
    const pre = compositeOver(states.pressed, pageBg);
    console.log(
      `[${variant}] default=${states.default} hover=${states.hover} pressed=${states.pressed}`,
    );
    console.log(
      `  ΔL hover=${deltaL(def, hov).toFixed(4)} pressed=${deltaL(def, pre).toFixed(4)}`,
    );
    expect(
      deltaL(def, hov),
      `[${variant}] hover must differ from default by ≥ ${STATE_DL}`,
    ).toBeGreaterThanOrEqual(STATE_DL);
    // Pressed: ghost/secondary get a visible fill change; primary's pressed
    // affordance is a translateY(1px) dip (no fill change by design), so only
    // assert the fill delta for the variants that intend one.
    if (variant !== "primary") {
      expect(
        deltaL(def, pre),
        `[${variant}] pressed must differ from default by ≥ ${STATE_DL}`,
      ).toBeGreaterThanOrEqual(STATE_DL);
    }

    // Translucent INTERACTIVE fills (hover/pressed) must be a clear wash, not
    // a veil. Default is excluded — ghost's default is intentionally transparent.
    for (const [name, color] of Object.entries(states)) {
      if (name === "default") continue;
      const a = alpha(color);
      if (a < 1) {
        expect(
          a,
          `[${variant}] ${name} fill alpha must be ≥ ${ALPHA_FLOOR} (not a faint veil)`,
        ).toBeGreaterThanOrEqual(ALPHA_FLOOR);
      }
    }
  }
});

/* ------------------------------------------------------------------
 * Switch: checked vs unchecked track must be perceptually distinct.
 * ------------------------------------------------------------------ */
test("switch checked state is visually distinct from unchecked", async ({
  page,
}) => {
  await page.goto("./preview/switch");

  const states = await page.evaluate(() => {
    const shell = document.querySelector("main") as HTMLElement;
    const wrap = document.createElement("div");
    wrap.style.padding = "1rem";
    shell.append(wrap);

    const unchecked = document.createElement("label");
    unchecked.className = "c-switch";
    unchecked.innerHTML =
      '<input type="checkbox" class="c-switch__input"><span class="c-switch__track"><span class="c-switch__thumb"></span></span>';

    const checked = document.createElement("label");
    checked.className = "c-switch";
    checked.innerHTML =
      '<input type="checkbox" class="c-switch__input" checked><span class="c-switch__track"><span class="c-switch__thumb"></span></span>';

    wrap.append(unchecked, checked);
    const uTrack = getComputedStyle(
      unchecked.querySelector(".c-switch__track")!,
    ).backgroundColor;
    const cTrack = getComputedStyle(
      checked.querySelector(".c-switch__track")!,
    ).backgroundColor;
    wrap.remove();
    return { unchecked: uTrack, checked: cTrack };
  });

  console.log(
    `[switch] unchecked=${states.unchecked} checked=${states.checked}`,
  );

  expect(
    deltaL(states.unchecked, states.checked),
    "checked track must differ from unchecked by a visible lightness step",
  ).toBeGreaterThanOrEqual(0.03);
});

/* ------------------------------------------------------------------
 * Accordion: open item icon must be rotated vs closed.
 * ------------------------------------------------------------------ */
test("accordion open icon is rotated from closed", async ({ page }) => {
  await page.goto("./preview/accordion");

  const rotations = await page.evaluate(() => {
    const closed = document.querySelector(
      ".c-accordion__item:not([open]) .c-accordion__icon",
    ) as HTMLElement;
    const open = document.querySelector(
      ".c-accordion__item[open] .c-accordion__icon",
    ) as HTMLElement;
    if (!closed || !open) return null;
    return {
      closed: getComputedStyle(closed).rotate,
      open: getComputedStyle(open).rotate,
    };
  });

  console.log(
    `[accordion] closed-rotate=${rotations?.closed} open-rotate=${rotations?.open}`,
  );

  expect(rotations).not.toBeNull();
  expect(rotations!.closed).not.toBe(rotations!.open);
});

/* ------------------------------------------------------------------
 * Chip: different tones must have perceptually distinct backgrounds.
 * ------------------------------------------------------------------ */
test("chip tones are visually distinct", async ({ page }) => {
  await page.goto("./preview/chip");

  const bgs = await page.evaluate(() => {
    const shell = document.querySelector("main") as HTMLElement;
    const tones = ["", "success", "warning", "danger"];
    const results: Record<string, string> = {};
    const wrap = document.createElement("div");
    wrap.style.padding = "1rem";
    shell.append(wrap);
    for (const tone of tones) {
      const chip = document.createElement("span");
      chip.className = "c-chip";
      if (tone) chip.dataset.tone = tone;
      chip.textContent = tone || "default";
      wrap.append(chip);
      results[tone || "default"] = getComputedStyle(chip).backgroundColor;
    }
    wrap.remove();
    return results;
  });

  console.log("[chip] backgrounds:", bgs);

  // Each tone should differ from the default by a visible lightness step.
  const def = bgs["default"];
  for (const [tone, bg] of Object.entries(bgs)) {
    if (tone === "default") continue;
    expect(
      deltaL(def, bg),
      `[${tone}] chip must differ from default by a visible step`,
    ).toBeGreaterThanOrEqual(0.02);
  }
});

/* ------------------------------------------------------------------
 * Data table: sortable header arrows must differ by direction.
 * ------------------------------------------------------------------ */
test("data table sort arrows differ between asc and desc", async ({ page }) => {
  await page.goto("./preview/data-table");

  const borders = await page.evaluate(() => {
    const ascIcon = document.querySelector(
      "th[data-sort='asc'] .c-table__sort-icon",
    ) as HTMLElement;
    const descIcon = document.querySelector(
      "th[data-sort='desc'] .c-table__sort-icon",
    ) as HTMLElement;
    if (!ascIcon || !descIcon) return null;
    const ascStyle = getComputedStyle(ascIcon);
    const descStyle = getComputedStyle(descIcon);
    return {
      ascBorderBottom: ascStyle.borderBottomWidth,
      ascBorderTop: ascStyle.borderTopWidth,
      descBorderBottom: descStyle.borderBottomWidth,
      descBorderTop: descStyle.borderTopWidth,
    };
  });

  console.log("[table-sort]", borders);

  expect(borders).not.toBeNull();
  // Ascending arrow has a bottom border (triangle pointing up), no top.
  expect(borders!.ascBorderBottom).not.toBe("0px");
  expect(borders!.ascBorderTop).toBe("0px");
  // Descending arrow has a top border (triangle pointing down), no bottom.
  expect(borders!.descBorderTop).not.toBe("0px");
  expect(borders!.descBorderBottom).toBe("0px");
});

/* ------------------------------------------------------------------
 * Nav: active item must be visually distinct from inactive.
 * ------------------------------------------------------------------ */
test("nav active item is visually distinct from inactive", async ({ page }) => {
  await page.goto("./preview/nav");

  const states = await page.evaluate(() => {
    const items = document.querySelectorAll(".c-nav__item");
    const active = items[0] as HTMLElement;
    const inactive = items[1] as HTMLElement;
    if (!active || !inactive) return null;
    return {
      activeBg: getComputedStyle(active).backgroundColor,
      inactiveBg: getComputedStyle(inactive).backgroundColor,
      activeColor: getComputedStyle(active).color,
      inactiveColor: getComputedStyle(inactive).color,
    };
  });

  console.log("[nav]", states);

  expect(states).not.toBeNull();
  expect(states!.activeBg).not.toBe(states!.inactiveBg);
});

/* ------------------------------------------------------------------
 * Segmented: checked segment must differ from unchecked.
 * ------------------------------------------------------------------ */
test("segmented checked is visually distinct from unchecked", async ({
  page,
}) => {
  await page.goto("./preview/segmented");

  const states = await page.evaluate(() => {
    const checked = document.querySelector(
      ".c-segmented__item:has(input:checked) span",
    ) as HTMLElement;
    const unchecked = document.querySelector(
      ".c-segmented__item:not(:has(input:checked)) span",
    ) as HTMLElement;
    if (!checked || !unchecked) return null;
    return {
      checkedBg: getComputedStyle(checked).backgroundColor,
      uncheckedBg: getComputedStyle(unchecked).backgroundColor,
    };
  });

  console.log("[segmented]", states);

  expect(states).not.toBeNull();
  expect(states!.checkedBg).not.toBe(states!.uncheckedBg);
});
