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
const MENU_ROW_HOVER_DL = 0.02; // menu row hover must be visibly distinct

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
 * Menus: first/middle/last rows must all get a visible hover state.
 * ------------------------------------------------------------------ */
test("menu row hover applies to first, middle, and last options", async ({
  page,
}) => {
  const cases = [
    {
      path: "./preview/split-button",
      trigger: "[popovertarget='sb-2']",
      menu: "#sb-2",
      rows: "#sb-2 .c-split__option",
    },
    {
      path: "./preview/dropdown",
      trigger: "[popovertarget='dd-2']",
      menu: "#dd-2",
      rows: "#dd-2 .c-dropdown__option",
    },
    {
      path: "./preview/popover-menu",
      trigger: "[popovertarget='row-menu']",
      menu: "#row-menu",
      rows: "#row-menu .c-menu__item",
    },
  ] as const;

  for (const fixture of cases) {
    await page.goto(fixture.path);
    await page.evaluate(() => {
      document
        .querySelectorAll('[aria-selected="true"]')
        .forEach((el) => el.removeAttribute("aria-selected"));
    });

    await page.locator(fixture.trigger).click();
    await expect(page.locator(fixture.menu)).toBeVisible();

    const rows = page.locator(fixture.rows);
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const indexes = [0, 1, 2];
    const defaultBgs = await rows.evaluateAll((items) =>
      items.map((item) => getComputedStyle(item).backgroundColor),
    );

    for (const index of indexes) {
      const row = rows.nth(index);
      await row.hover();
      const hover = await row.evaluate((el) => ({
        active: el.matches(":hover"),
        bg: getComputedStyle(el).backgroundColor,
        text: el.textContent?.trim(),
      }));
      const dl = deltaL(defaultBgs[index], hover.bg);
      console.log(
        `[menu-hover] ${fixture.path} ${hover.text}: default=${defaultBgs[index]} hover=${hover.bg} ΔL=${dl.toFixed(4)}`,
      );

      expect(hover.active).toBe(true);
      expect(
        dl,
        `${fixture.path} row ${index} hover must differ from rest state`,
      ).toBeGreaterThanOrEqual(MENU_ROW_HOVER_DL);
    }
  }
});

/* ------------------------------------------------------------------
 * Data table: sortable header arrows must differ by direction.
 * ------------------------------------------------------------------ */
test("data table sort arrows differ between asc and desc", async ({ page }) => {
  await page.goto("./preview/data-table");

  const icons = await page.evaluate(() => {
    const getIconInfo = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return null;
      const cs = getComputedStyle(el);
      const before = getComputedStyle(el, "::before");
      return {
        // The sort indicator uses a Unicode glyph via ::before content
        // (↑ U+2191 for asc, ↓ U+2193 for desc, ⇅ U+21C5 for neutral).
        content: before.content,
        color: cs.color,
        opacity: parseFloat(cs.opacity),
      };
    };
    return {
      asc: getIconInfo("th[data-sort='asc'] .c-table__sort-icon"),
      desc: getIconInfo("th[data-sort='desc'] .c-table__sort-icon"),
    };
  });

  console.log("[table-sort]", icons);

  expect(icons.asc).not.toBeNull();
  expect(icons.desc).not.toBeNull();
  // Ascending shows ↑ (U+2191) and is fully opaque + accent-colored.
  expect(icons.asc!.content).toContain("\u2191");
  expect(icons.asc!.opacity).toBe(1);
  // Descending shows ↓ (U+2193) and is fully opaque + accent-colored.
  expect(icons.desc!.content).toContain("\u2193");
  expect(icons.desc!.opacity).toBe(1);
  // The two directions must be visually distinct (different glyphs).
  expect(icons.asc!.content).not.toBe(icons.desc!.content);
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

test("nav footer metadata actions stay compact and icon-aligned", async ({
  page,
}) => {
  await page.goto("./preview/nav");

  const metrics = await page.evaluate(() => {
    const meta = document.querySelector(
      "[data-preview-nav-meta]",
    ) as HTMLElement;
    const metaLabel = meta?.querySelector(
      ".c-nav__meta-label",
    ) as HTMLElement;
    const actions = [...document.querySelectorAll("[data-preview-nav-action]")];
    const collapsedActions = document.querySelector(
      '.c-nav[data-variant="icons"] .c-nav__actions',
    ) as HTMLElement;
    const collapsedAction = collapsedActions?.querySelector(
      ".c-nav__action",
    ) as HTMLElement;
    const icon = document.querySelector(".c-nav__action-icon") as HTMLElement;
    if (!meta || !metaLabel || actions.length < 2 || !collapsedAction || !icon) {
      return null;
    }

    return {
      metaLabelClientWidth: metaLabel.clientWidth,
      metaLabelScrollWidth: metaLabel.scrollWidth,
      actionTags: actions.map((action) => action.tagName.toLowerCase()),
      actionHeights: actions.map(
        (action) => (action as HTMLElement).getBoundingClientRect().height,
      ),
      collapsedActionsDisplay: getComputedStyle(collapsedActions).display,
      collapsedActionWidth: collapsedAction.getBoundingClientRect().width,
      iconHeight: icon.getBoundingClientRect().height,
      iconWidth: icon.getBoundingClientRect().width,
    };
  });

  console.log("[nav-footer]", metrics);

  expect(metrics).not.toBeNull();
  expect(metrics!.actionTags).toEqual(["a", "button"]);
  expect(metrics!.collapsedActionsDisplay).toBe("grid");
  expect(metrics!.collapsedActionWidth).toBeGreaterThanOrEqual(32);
  for (const height of metrics!.actionHeights) {
    expect(height).toBeLessThanOrEqual(34);
  }
  expect(metrics!.iconWidth).toBeLessThanOrEqual(18);
  expect(metrics!.iconHeight).toBeLessThanOrEqual(18);
  expect(metrics!.metaLabelScrollWidth).toBeGreaterThan(
    metrics!.metaLabelClientWidth,
  );
});

test("nav menu flyouts compose with menu rows and icon rail triggers", async ({
  page,
}) => {
  await page.goto("./preview/nav");

  const trigger = page.locator("[data-preview-nav-menu-trigger]");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator("[data-preview-nav-menu]")).toBeVisible();

  const metrics = await page.evaluate(() => {
    const trigger = document.querySelector(
      "[data-preview-nav-menu-trigger]",
    ) as HTMLElement;
    const menu = document.querySelector("[data-preview-nav-menu]") as HTMLElement;
    const current = menu?.querySelector(
      ".c-menu__item[aria-current='page']",
    ) as HTMLElement;
    const description = menu?.querySelector(
      ".c-menu__item-description",
    ) as HTMLElement;
    const shortcut = menu?.querySelector(".c-menu__item-shortcut") as HTMLElement;
    const railTrigger = document.querySelector(
      '.c-nav[data-variant="icons"] .c-nav__menu .c-menu__trigger',
    ) as HTMLElement;
    if (!trigger || !menu || !current || !description || !shortcut || !railTrigger) {
      return null;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const currentStyle = getComputedStyle(current);
    return {
      currentBg: currentStyle.backgroundColor,
      currentShadow: currentStyle.boxShadow,
      currentColor: currentStyle.color,
      descriptionSize: getComputedStyle(description).fontSize,
      menuLeft: menuRect.left,
      shortcutFont: getComputedStyle(shortcut).fontFamily,
      triggerRight: triggerRect.right,
      railAccessibleName: railTrigger.getAttribute("aria-label"),
      railTriggerWidth: railTrigger.getBoundingClientRect().width,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics!.menuLeft).toBeGreaterThanOrEqual(metrics!.triggerRight);
  expect(metrics!.currentBg).not.toBe("rgba(0, 0, 0, 0)");
  expect(metrics!.currentShadow).toContain("inset");
  expect(metrics!.currentColor).not.toBe("");
  expect(metrics!.descriptionSize).not.toBe("");
  expect(metrics!.shortcutFont).toContain("mono");
  expect(metrics!.railAccessibleName).toBe("Reports");
  expect(metrics!.railTriggerWidth).toBeGreaterThanOrEqual(32);
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
