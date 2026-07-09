import { test, expect } from "@playwright/test";

/**
 * Accessibility-MODE coverage.
 *
 * The README lists light/dark, RTL, keyboard, forced colors, reduced motion,
 * print, and 200% zoom as "first-class, not bolt-ons." contrast.spec +
 * theme-resolution.spec cover light/dark; the affordance specs cover keyboard.
 * This file gates the rest, which the token CSS already supports but nothing
 * previously asserted:
 *
 *   - RTL        : logical properties only, no overflow when direction flips.
 *   - forced     : semantic tokens remap to Windows system colors.
 *   - contrast   : stronger boundary and focus tokens for prefers-contrast.
 *   - motion     : --pl-motion-scale zeroes + the universal 1ms clamp fires.
 *   - zoom       : content reflows at 200% with no horizontal scrollbar.
 *
 * Navigation uses the relative `./preview/...` form (like the other specs) so
 * Playwright resolves against the Astro base path. Each test asserts the page
 * actually loaded its heading first, so a 404 can never pass vacuously.
 *
 * Assertions read values that are IMMUNE to the lesson-5 transition trap:
 * custom-property values and the `transition-duration` longhand do not animate
 * on a media-query flip, so they read true immediately.
 */

// Guard against the silent 404 problem: confirm the real page rendered before
// asserting anything about its layout or tokens.
async function reach(page: import("@playwright/test").Page, heading: string) {
  await expect(
    page.getByRole("heading", { name: heading, exact: true }),
  ).toBeVisible();
}

// ---------------------------------------------------------------------------
// RTL — the framework uses logical properties throughout, so flipping the
// writing direction must not break layout (no physical left/right, no fixed
// widths overflowing). Asserted on the two most overflow-prone pages: the
// wide data table and the app-shell grid.
// ---------------------------------------------------------------------------
const rtlPages: [path: string, heading: string][] = [
  ["./preview/data-table", "Data table"],
  ["./preview/app-shell", "App shell"],
];

for (const [path, heading] of rtlPages) {
  test(`RTL flips writing direction without horizontal overflow (${path})`, async ({
    page,
  }) => {
    await page.goto(path);
    await reach(page, heading);
    // Flip the root direction. Base + layout CSS use inline/block/inset-*
    // logical props, so this is the only change needed.
    await page.evaluate(() =>
      document.documentElement.setAttribute("dir", "rtl"),
    );
    const state = await page.evaluate(() => {
      const de = document.documentElement;
      return {
        direction: getComputedStyle(de).direction,
        // clientWidth and scrollWidth share a coordinate space, so this ratio
        // is zoom- and direction-invariant. A physical-property break would
        // push content past the viewport and inflate scrollWidth.
        scrollWidth: de.scrollWidth,
        clientWidth: de.clientWidth,
      };
    });
    expect(state.direction, "root must report rtl").toBe("rtl");
    expect(
      state.scrollWidth,
      "RTL must not overflow horizontally (no broken physical properties)",
    ).toBeLessThanOrEqual(state.clientWidth + 1);
  });
}

// ---------------------------------------------------------------------------
// Forced colors (Windows High Contrast). The themes layer remaps the semantic
// tokens to system-color keywords. Custom-property values do not transition,
// so reading --pl-color-* on :root is a deterministic, animation-free signal.
// ---------------------------------------------------------------------------
test("forced colors remap semantic tokens to system colors", async ({
  page,
}) => {
  await page.goto("./preview/themes");
  await reach(page, "Themes & density");

  const read = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        bg: cs.getPropertyValue("--pl-color-bg").trim().toLowerCase(),
        text: cs.getPropertyValue("--pl-color-text").trim().toLowerCase(),
        accent: cs.getPropertyValue("--pl-color-accent").trim().toLowerCase(),
      };
    });

  const before = await read();
  // Tokens start as oklch()/light-dark(), never a system keyword, so this
  // guards against a test that would pass vacuously.
  expect(before.accent).not.toContain("highlight");

  await page.emulateMedia({ forcedColors: "active" });

  const after = await read();
  expect(after.bg, "bg must map to Canvas").toContain("canvas");
  expect(after.text, "text must map to CanvasText").toContain("canvastext");
  expect(after.accent, "accent must map to Highlight").toContain("highlight");
});

// ---------------------------------------------------------------------------
// Contrast preference. This is distinct from forced-colors: the existing
// palette stays in charge, but boundaries and focus affordances get stronger.
// Playwright does not expose this media feature through page.emulateMedia() in
// this version, so Chromium's CDP emulation is the narrowest reliable probe.
// ---------------------------------------------------------------------------
test("prefers-contrast strengthens boundary and focus tokens", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== "chromium",
    "prefers-contrast CDP emulation is Chromium-only",
  );

  await page.goto("./preview/themes");
  await reach(page, "Themes & density");

  const read = () =>
    page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      return {
        border: cs.getPropertyValue("--pl-color-border").trim(),
        surface2: cs.getPropertyValue("--pl-color-surface-2").trim(),
        focusSize: cs.getPropertyValue("--pl-focus-size").trim(),
        glowOpacity: cs.getPropertyValue("--pl-focus-glow-opacity").trim(),
      };
    });

  const before = await read();
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-contrast", value: "more" }],
  });
  const after = await read();

  expect(after.border, "border token should strengthen").not.toBe(
    before.border,
  );
  expect(after.surface2, "surface-2 should separate more").not.toBe(
    before.surface2,
  );
  expect(after.focusSize, "focus ring should become thicker").toBe("3px");
  expect(after.glowOpacity, "field focus glow should strengthen").toBe("75%");
});

// ---------------------------------------------------------------------------
// Reduced motion. Two independent guards must fire: the :root motion-scale
// token drops to 0, AND the universal `*` rule clamps every transition to 1ms
// regardless of component declarations (the !important allow-list entry).
// ---------------------------------------------------------------------------
test("reduced motion zeroes the motion scale and clamps transitions", async ({
  page,
}) => {
  await page.goto("./preview/button");
  await reach(page, "Button");
  await page.emulateMedia({ reducedMotion: "reduce" });

  const state = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const btn = document.querySelector(".pl-c-button") as HTMLElement;
    return {
      scale: parseFloat(root.getPropertyValue("--pl-motion-scale")),
      // transition-duration is itself not a transitioned property, so it reads
      // true immediately (no transition trap). The global rule sets 1ms.
      btnDuration: parseFloat(getComputedStyle(btn).transitionDuration),
    };
  });
  expect(state.scale, "--pl-motion-scale must be 0 under reduced motion").toBe(
    0,
  );
  expect(
    state.btnDuration,
    "component transitions must clamp to 0.001s (1ms)",
  ).toBeCloseTo(0.001, 3);
});

// ---------------------------------------------------------------------------
// 200% zoom (WCAG 1.4.4 / 1.4.10). Content must reflow without a horizontal
// scrollbar at 200%. scrollWidth vs clientWidth is the zoom-invariant reflow
// check: a fixed-width element would push scrollWidth past clientWidth.
// ---------------------------------------------------------------------------
const zoomPages: [path: string, heading: string][] = [
  ["./preview/app-shell", "App shell"],
  ["./preview/data-table", "Data table"],
];

for (const [path, heading] of zoomPages) {
  test(`content reflows at 200% zoom without horizontal overflow (${path})`, async ({
    page,
  }) => {
    await page.goto(path);
    await reach(page, heading);
    await page.evaluate(() => {
      // CSS zoom is the browser's real page zoom; Chromium supports it.
      (document.documentElement as HTMLElement).style.zoom = "2";
    });
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      return de.scrollWidth - de.clientWidth;
    });
    expect(
      overflow,
      "page must not gain a horizontal scrollbar at 200% zoom",
    ).toBeLessThanOrEqual(1);
    // The primary content must still be visible (not clipped or collapsed).
    await expect(page.locator("main h1")).toBeVisible();
  });
}
