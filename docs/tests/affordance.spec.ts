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
