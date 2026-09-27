import { test, expect } from "@playwright/test";

for (const direction of ["ltr", "rtl"]) {
  test(`overflow edges follow content and direction: ${direction}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto("./preview/scroll-region");
    const region = page.locator("#queue");
    await region.evaluate((el, dir) => el.setAttribute("dir", dir), direction);
    const start = () =>
      region.evaluate(
        (el, dir) => el.scrollTo(dir === "rtl" ? el.scrollWidth : 0, 0),
        direction,
      );
    await start();
    const edges = () =>
      region.evaluate((el) => {
        const s = getComputedStyle(el, "::after");
        return [
          s.borderInlineStartColor,
          s.borderInlineEndColor,
          s.borderBlockStartColor,
          s.borderBlockEndColor,
        ].map((c) => c !== "rgba(0, 0, 0, 0)");
      });
    await expect.poll(edges).toEqual([false, true, false, true]);
    await region.evaluate(
      (el, dir) => el.scrollTo(dir === "rtl" ? -40 : 40, 100),
      direction,
    );
    await expect.poll(edges).toEqual([true, true, true, true]);
    const header = region.locator("th").first();
    await expect
      .poll(() =>
        header.evaluate(
          (el) => getComputedStyle(el, "::after").borderBlockEndWidth,
        ),
      )
      .toBe("2px");
    const cell = region.locator("td").first();
    await expect
      .poll(() =>
        cell.evaluate(
          (el) => getComputedStyle(el, "::before").borderInlineEndWidth,
        ),
      )
      .toBe("2px");
    await region.evaluate(
      (el, dir) =>
        el.scrollTo(
          dir === "rtl" ? -el.scrollWidth : el.scrollWidth,
          el.scrollHeight,
        ),
      direction,
    );
    await expect.poll(edges).toEqual([true, false, true, false]);
    await start();
    await expect.poll(edges).toEqual([false, true, false, true]);
    await expect
      .poll(() =>
        header.evaluate(
          (el) => getComputedStyle(el, "::after").borderBlockEndWidth,
        ),
      )
      .toBe("0px");
    await expect
      .poll(() =>
        cell.evaluate((el) => getComputedStyle(el, "::before").content),
      )
      .toBe("none");
    await region.locator("a").first().click();
    await expect(page).toHaveURL(/#case-detail$/);
  });
}

test("fitting content has no indicators; keyboard scrolling remains operable", async ({
  page,
}) => {
  await page.goto("./preview/scroll-region");
  const short = page.locator("#short");
  await expect
    .poll(() =>
      short.evaluate((el) => getComputedStyle(el, "::after").borderColor),
    )
    .toBe("rgba(0, 0, 0, 0)");
  const queue = page.getByRole("region", { name: "Case queue" });
  await queue.focus();
  await page.keyboard.press("ArrowDown");
  await expect
    .poll(() => queue.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  // Removing overflow must remove the indicators without a JS state controller.
  await queue.evaluate((el) => {
    el.innerHTML = "<p>Queue cleared</p>";
  });
  await expect
    .poll(() =>
      queue.evaluate((el) => getComputedStyle(el, "::after").borderColor),
    )
    .toBe("rgba(0, 0, 0, 0)");
});

test("sticky-shell shadow observes the bar, and clears at the start", async ({
  page,
}) => {
  await page.goto("./preview/enhancements");
  const region = page.getByRole("region", { name: "Sticky-shell scroll demo" });
  const bar = region.locator(".pl-c-sticky-shell__bar");
  const shadow = () =>
    bar.evaluate((el) => getComputedStyle(el, "::after").boxShadow);
  await expect.poll(shadow).toBe("none");
  await region.evaluate((el) => el.scrollTo(0, 200));
  await expect.poll(shadow).not.toBe("none");
  const gap = await bar.evaluate(
    (el) =>
      el.getBoundingClientRect().top -
      el.parentElement!.getBoundingClientRect().top,
  );
  expect(gap).toBeCloseTo(1, 0);
  await region.evaluate((el) => el.scrollTo(0, 0));
  await expect.poll(shadow).toBe("none");
});

test("forced colors keep state boundaries and reduced motion adds no transition", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("./preview/scroll-region");
  const queue = page.locator("#queue");
  const highlight = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "color: Highlight; forced-color-adjust: none";
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  const edge = () =>
    queue.evaluate((el) => getComputedStyle(el, "::after").borderBlockEndColor);
  await expect.poll(edge).toBe(highlight);
  const state = await queue.evaluate((el) => {
    const s = getComputedStyle(el, "::after");
    return {
      border: s.borderBlockEndStyle,
      width: s.borderBlockEndWidth,
      transition: s.transitionDuration,
    };
  });
  expect(state.border).toBe("solid");
  expect(state.width).toBe("2px");
  expect(parseFloat(state.transition)).toBeLessThanOrEqual(0.001);
  await queue.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect.poll(edge).toBe("rgba(0, 0, 0, 0)");
  await expect
    .poll(() =>
      page
        .locator("#short")
        .evaluate((el) => getComputedStyle(el, "::after").borderColor),
    )
    .toBe("rgba(0, 0, 0, 0)");
});

for (const mode of ["compact", "comfortable", "touch"]) {
  test(`scroll region remains accessible at mobile width in ${mode} density`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./preview/scroll-region");
    await page.locator("html").evaluate((el, density) => {
      el.setAttribute("data-pl-density", density);
      el.setAttribute(
        "data-pl-theme",
        density === "compact" ? "light" : "dark",
      );
    }, mode);
    const layout = await page.evaluate(() => {
      const region = document.querySelector("#queue")!;
      const helper = document.querySelector("#case-detail")!;
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        gap:
          helper.getBoundingClientRect().top -
          region.getBoundingClientRect().bottom,
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.gap).toBeGreaterThanOrEqual(12);
    const { default: AxeBuilder } = await import("@axe-core/playwright");
    const results = await new AxeBuilder({ page }).include("#queue").analyze();
    expect(results.violations).toEqual([]);
  });
}
