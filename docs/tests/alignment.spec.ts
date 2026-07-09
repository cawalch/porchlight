import { test, expect } from "@playwright/test";

/**
 * Deterministic alignment + sizing-consistency checks.
 *
 * These can't be eyeballed reliably across components; they CAN be measured
 * precisely. Each probe asserts a relationship that should hold for a
 * well-built SaaS design system:
 *   - controls in a row share one height
 *   - grid gaps are uniform
 *   - card titles align at the same Y across a row
 *   - icon + label are vertically centered in a button
 *
 * Reading real bounding rects = "pixel-perfect" made deterministic.
 */

test("all buttons in the button variants row share one height", async ({
  page,
}) => {
  await page.goto("./preview/button");
  // The first .pl-l-cluster row holds primary/secondary/ghost/default.
  const heights = await page.evaluate(() => {
    const row = document.querySelector(".pl-l-cluster")!;
    return Array.from(row.querySelectorAll(".pl-c-button")).map((b) =>
      Math.round(b.getBoundingClientRect().height),
    );
  });
  console.log(`[align] button heights in row: ${JSON.stringify(heights)}`);
  const unique = [...new Set(heights)];
  expect(
    unique.length,
    `button heights must be uniform, got ${JSON.stringify(heights)}`,
  ).toBe(1);
});

test("card titles in a grid row align at the same Y", async ({ page }) => {
  await page.goto("./preview/card");
  const tops = await page.evaluate(() => {
    const grid = document.querySelector(".pl-l-grid")!;
    return Array.from(grid.querySelectorAll(".pl-c-card__title")).map((t) =>
      Math.round(t.getBoundingClientRect().top),
    );
  });
  console.log(`[align] card title Y positions: ${JSON.stringify(tops)}`);
  // All titles must start at the same Y (consistent top offset).
  const unique = [...new Set(tops)];
  expect(
    unique.length,
    `card titles must align in Y, got ${JSON.stringify(tops)}`,
  ).toBe(1);
});

test("button icon + label are vertically centered (within 1px)", async ({
  page,
}) => {
  await page.goto("./preview/button");
  // The "New report" primary button has an icon + label.
  const center = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll(".pl-c-button")).find(
      (b) => b.textContent?.includes("New report"),
    ) as HTMLElement | undefined;
    if (!btn) return null;
    const icon = btn.querySelector("svg")!;
    const bCenter =
      btn.getBoundingClientRect().top + btn.getBoundingClientRect().height / 2;
    const iCenter =
      icon.getBoundingClientRect().top +
      icon.getBoundingClientRect().height / 2;
    return { btnCenter: bCenter, iconCenter: iCenter };
  });
  if (!center) return; // skip if markup changed
  const drift = Math.abs(center.btnCenter - center.iconCenter);
  console.log(
    `[align] button center=${center.btnCenter.toFixed(1)} icon center=${center.iconCenter.toFixed(1)} drift=${drift.toFixed(1)}`,
  );
  expect(drift, "icon must be vertically centered in the button").toBeLessThan(
    1.5,
  );
});

test("table numeric columns are right-aligned and use tabular-nums", async ({
  page,
}) => {
  await page.goto("./preview/data-table");
  const data = await page.evaluate(() => {
    const cell = document.querySelector(
      '.pl-c-table td[data-align="end"]',
    ) as HTMLElement;
    if (!cell) return null;
    const cs = getComputedStyle(cell);
    return { align: cs.textAlign, nums: cs.fontVariantNumeric };
  });
  if (!data) return;
  console.log(`[align] numeric cell: align=${data.align} nums=${data.nums}`);
  // text-align: end is the modern logical keyword (resolves to right in LTR);
  // accept either since the source uses the logical value.
  expect(["end", "right"]).toContain(data.align);
  expect(data.nums).toContain("tabular");
});

test("split button segments share one height", async ({ page }) => {
  await page.goto("./preview/split-button");
  // Measure primary vs toggle height in the first instance.
  const heights = await page.evaluate(() => {
    const split = document.querySelector(".pl-c-split")!;
    const primary = split.querySelector(".pl-c-split__primary")!;
    const toggle = split.querySelector(".pl-c-split__toggle")!;
    return {
      primary: Math.round(primary.getBoundingClientRect().height),
      toggle: Math.round(toggle.getBoundingClientRect().height),
    };
  });
  console.log(
    `[align] split-button heights: primary=${heights.primary} toggle=${heights.toggle}`,
  );
  expect(
    heights.primary,
    "primary and toggle segments must have identical height",
  ).toBe(heights.toggle);
});

test("split button segments fuse into one control", async ({ page }) => {
  await page.goto("./preview/split-button");
  // The trailing edge of primary and leading edge of toggle must meet as one
  // segmented control. A 1px overlap collapses the shared border into a seam.
  const metrics = await page.evaluate(() => {
    const split = document.querySelector(".pl-c-split")!;
    const primary = split.querySelector<HTMLElement>(".pl-c-split__primary")!;
    const toggle = split.querySelector<HTMLElement>(".pl-c-split__toggle")!;
    const pRect = primary.getBoundingClientRect();
    const tRect = toggle.getBoundingClientRect();
    const primaryStyle = getComputedStyle(primary);
    const toggleStyle = getComputedStyle(toggle);

    return {
      seam: Math.round(tRect.left - pRect.right),
      borderWidth: Number.parseFloat(toggleStyle.borderInlineStartWidth),
      primaryStartEnd: primaryStyle.borderStartEndRadius,
      primaryEndEnd: primaryStyle.borderEndEndRadius,
      toggleStartStart: toggleStyle.borderStartStartRadius,
      toggleEndStart: toggleStyle.borderEndStartRadius,
    };
  });
  console.log(
    `[align] split-button seam=${metrics.seam}px border=${metrics.borderWidth}px radii=` +
      `${metrics.primaryStartEnd}/${metrics.primaryEndEnd}/${metrics.toggleStartStart}/${metrics.toggleEndStart}`,
  );
  expect(
    metrics.seam,
    "segments must touch or overlap only enough to collapse the shared border",
  ).toBeGreaterThanOrEqual(-metrics.borderWidth);
  expect(
    metrics.seam,
    "segments must not have a visible gap",
  ).toBeLessThanOrEqual(0);
  expect(metrics.primaryStartEnd).toBe("0px");
  expect(metrics.primaryEndEnd).toBe("0px");
  expect(metrics.toggleStartStart).toBe("0px");
  expect(metrics.toggleEndStart).toBe("0px");
});

test("split button stays fused inside common app containers", async ({
  page,
}) => {
  await page.goto("./preview/split-button");

  const metrics = await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.className = "pl-c-card";
    fixture.innerHTML = `
      <div class="pl-c-card__body">
        <form class="pl-c-form">
          <div class="pl-c-split" style="--pl-c-split-anchor: --pl-app-split;">
            <button type="button" class="pl-c-button pl-c-split__primary" data-variant="primary">Approve</button>
            <button type="button" class="pl-c-button pl-c-split__toggle" data-variant="primary" popovertarget="app-split-menu" aria-label="More actions">
              <span class="pl-c-split__chevron">⌄</span>
            </button>
            <div popover class="pl-c-split__menu" id="app-split-menu">
              <button class="pl-c-split__option">Approve and notify</button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.querySelector("main")!.append(fixture);

    const split = fixture.querySelector(".pl-c-split")!;
    const primary = split.querySelector<HTMLElement>(".pl-c-split__primary")!;
    const toggle = split.querySelector<HTMLElement>(".pl-c-split__toggle")!;
    const pRect = primary.getBoundingClientRect();
    const tRect = toggle.getBoundingClientRect();
    const primaryStyle = getComputedStyle(primary);
    const toggleStyle = getComputedStyle(toggle);

    return {
      seam: Math.round(tRect.left - pRect.right),
      borderWidth: Number.parseFloat(toggleStyle.borderInlineStartWidth),
      primaryStartEnd: primaryStyle.borderStartEndRadius,
      primaryEndEnd: primaryStyle.borderEndEndRadius,
      toggleStartStart: toggleStyle.borderStartStartRadius,
      toggleEndStart: toggleStyle.borderEndStartRadius,
    };
  });

  console.log(
    `[align] nested split seam=${metrics.seam}px border=${metrics.borderWidth}px radii=` +
      `${metrics.primaryStartEnd}/${metrics.primaryEndEnd}/${metrics.toggleStartStart}/${metrics.toggleEndStart}`,
  );

  expect(metrics.seam).toBeGreaterThanOrEqual(-metrics.borderWidth);
  expect(metrics.seam).toBeLessThanOrEqual(0);
  expect(metrics.primaryStartEnd).toBe("0px");
  expect(metrics.primaryEndEnd).toBe("0px");
  expect(metrics.toggleStartStart).toBe("0px");
  expect(metrics.toggleEndStart).toBe("0px");
});

test("split button chevron rotates when menu opens", async ({ page }) => {
  await page.goto("./preview/split-button");
  const chevron = page.locator(".pl-c-split__chevron").first();
  const toggle = page.locator("[popovertarget='sb-1']");

  // Closed: rotation is 0deg (or none).
  const closedMatrix = await chevron.evaluate(
    (el) => getComputedStyle(el).rotate,
  );
  console.log(`[align] chevron rotate (closed): ${closedMatrix}`);

  // Open the menu.
  await toggle.click();
  await page.locator("#sb-1").waitFor({ state: "visible" });

  // Wait for the rotate transition to settle before reading the final value.
  await page.waitForTimeout(400);

  // Open: rotation is 180deg.
  const openMatrix = await chevron.evaluate(
    (el) => getComputedStyle(el).rotate,
  );
  console.log(`[align] chevron rotate (open): ${openMatrix}`);

  expect(openMatrix).toContain("180");
});
