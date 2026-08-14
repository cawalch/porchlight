import { test, expect } from "@playwright/test";

const shadowOffsetX = (shadow: string) => {
  const match = shadow.match(/(-?\d+(?:\.\d+)?)px\s+0px(?:\s|$)/);
  return match ? Number.parseFloat(match[1]) : Number.NaN;
};

test("RTL mirrors inline-edge accents and sticky depth", async ({ page }) => {
  await page.goto("./preview/nav");

  const ltrNav = await page.evaluate(() => {
    const active = document.querySelector(
      ".pl-c-nav__item[aria-current]",
    ) as HTMLElement;
    const style = getComputedStyle(active);
    return {
      bottomLeft: style.borderBottomLeftRadius,
      bottomRight: style.borderBottomRightRadius,
      shadow: style.boxShadow,
      topLeft: style.borderTopLeftRadius,
      topRight: style.borderTopRightRadius,
    };
  });
  await page.evaluate(() => (document.documentElement.dir = "rtl"));
  await page.waitForTimeout(200);
  const rtlNav = await page.evaluate(() => {
    const active = document.querySelector(
      ".pl-c-nav__item[aria-current]",
    ) as HTMLElement;
    const style = getComputedStyle(active);
    return {
      bottomLeft: style.borderBottomLeftRadius,
      bottomRight: style.borderBottomRightRadius,
      shadow: style.boxShadow,
      topLeft: style.borderTopLeftRadius,
      topRight: style.borderTopRightRadius,
    };
  });

  expect(shadowOffsetX(ltrNav.shadow)).toBeGreaterThan(0);
  expect(shadowOffsetX(rtlNav.shadow)).toBeLessThan(0);
  expect(Number.parseFloat(ltrNav.topLeft)).toBe(0);
  expect(Number.parseFloat(ltrNav.bottomLeft)).toBe(0);
  expect(Number.parseFloat(ltrNav.topRight)).toBeGreaterThan(0);
  expect(Number.parseFloat(rtlNav.topRight)).toBe(0);
  expect(Number.parseFloat(rtlNav.bottomRight)).toBe(0);
  expect(Number.parseFloat(rtlNav.topLeft)).toBeGreaterThan(0);

  await page.goto("./preview/data-table");
  const tableState = await page.evaluate(() => {
    const selected = document.querySelector(
      ".pl-c-table tbody tr[aria-selected='true']",
    ) as HTMLElement;
    const sticky = document.querySelector(
      ".pl-c-table .pl-c-table__sticky-col",
    ) as HTMLElement;
    const read = () => ({
      selected: getComputedStyle(selected).boxShadow,
      sticky: getComputedStyle(sticky).boxShadow,
    });
    const ltr = read();
    document.documentElement.dir = "rtl";
    const rtl = read();
    return { ltr, rtl };
  });

  expect(shadowOffsetX(tableState.ltr.selected)).toBeGreaterThan(0);
  expect(shadowOffsetX(tableState.rtl.selected)).toBeLessThan(0);
  expect(shadowOffsetX(tableState.ltr.sticky)).toBeGreaterThan(0);
  expect(shadowOffsetX(tableState.rtl.sticky)).toBeLessThan(0);
});

test("RTL drawer and toast motion originates from the logical edge", async ({
  page,
}) => {
  await page.goto("./preview/drawer");
  const drawer = await page.evaluate(() => {
    const read = () =>
      Object.fromEntries(
        ["start", "end"].map((side) => {
          const element = document.querySelector(
            `.pl-c-drawer[data-side="${side}"]`,
          ) as HTMLElement;
          return [
            side,
            getComputedStyle(element)
              .getPropertyValue("--pl-c-drawer-translate")
              .trim(),
          ];
        }),
      );
    const ltr = read();
    document.documentElement.dir = "rtl";
    const rtl = read();
    return { ltr, rtl };
  });

  expect(drawer.ltr).toEqual({ start: "-100%", end: "100%" });
  expect(drawer.rtl).toEqual({ start: "100%", end: "-100%" });

  await page.goto("./preview/toast");
  const toast = await page.evaluate(() => {
    const read = () =>
      Object.fromEntries(
        ["bottom-start", "bottom-end"].map((placement) => {
          const stack = document.querySelector(
            `.pl-c-toast-stack[data-placement="${placement}"]`,
          ) as HTMLElement;
          return [
            placement,
            getComputedStyle(stack)
              .getPropertyValue("--pl-c-toast-translate")
              .trim(),
          ];
        }),
      );
    const ltr = read();
    document.documentElement.dir = "rtl";
    const rtl = read();
    return { ltr, rtl };
  });

  expect(toast.ltr).toEqual({
    "bottom-start": "-100%",
    "bottom-end": "100%",
  });
  expect(toast.rtl).toEqual({
    "bottom-start": "100%",
    "bottom-end": "-100%",
  });
});

test("RTL select chevrons move to the padded inline-end edge", async ({
  page,
}) => {
  for (const path of ["drawer", "filter-builder"]) {
    await page.goto(`./preview/${path}`);
    const positions = await page.evaluate(() => {
      const select = document.querySelector(
        "select.pl-c-field__control",
      ) as HTMLElement;
      const ltr = getComputedStyle(select).backgroundPositionX;
      document.documentElement.dir = "rtl";
      const rtl = getComputedStyle(select).backgroundPositionX;
      return { ltr, rtl };
    });

    expect(positions.ltr).not.toBe(positions.rtl);
    expect(positions.ltr).toContain("100%");
    expect(positions.rtl).not.toContain("100%");
  }
});

test("mobile app-shell topbar contains its actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./preview/app-shell");

  const metrics = await page.evaluate(() => {
    const topbar = document.querySelector(".topbar") as HTMLElement;
    const actions = document.querySelector(".topbar__actions") as HTMLElement;
    const topbarRect = topbar.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    return {
      actionsBottom: actionsRect.bottom,
      actionsTop: actionsRect.top,
      topbarBottom: topbarRect.bottom,
      topbarTop: topbarRect.top,
    };
  });

  expect(metrics.actionsTop).toBeGreaterThanOrEqual(metrics.topbarTop);
  expect(metrics.actionsBottom).toBeLessThanOrEqual(metrics.topbarBottom);
});

test("chip filter bar uses the supported wrapping toolbar group", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./preview/chip");

  const group = page.locator(".pl-c-toolbar__group").last();
  await expect(group).toBeVisible();
  await expect(group).toHaveCSS("display", "flex");
  await expect(page.locator(".pl-c-toolbar__leading")).toHaveCount(0);
});
