import { expect, test } from "@playwright/test";

const cases = [
  {
    name: "popover menu",
    root: "pl-c-menu",
    trigger: "pl-c-button pl-c-menu__trigger",
    popover: "pl-c-menu__popover",
    token: "--pl-c-menu-anchor",
  },
  {
    name: "dropdown",
    root: "pl-c-dropdown",
    trigger: "pl-c-dropdown__trigger",
    popover: "pl-c-dropdown__menu",
    token: "--pl-c-dropdown-anchor",
  },
  {
    name: "split button",
    root: "pl-c-split",
    trigger: "pl-c-button pl-c-split__toggle",
    popover: "pl-c-split__menu",
    token: "--pl-c-split-anchor",
  },
  {
    name: "date picker",
    root: "pl-c-date-picker",
    trigger: "pl-c-date-picker__trigger",
    popover: "pl-c-date-picker__popover",
    token: "--pl-c-date-picker-anchor",
  },
] as const;

for (const component of cases) {
  test(`${component.name} uses its own trigger with repeated instances`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1000, height: 850 });
    await page.goto("./preview/popover-menu");
    await page.evaluate(({ root, trigger, popover }) => {
      const fixture = document.createElement("div");
      fixture.id = "implicit-anchor-fixture";
      fixture.style.cssText =
        "position:fixed;inset:130px auto auto 80px;z-index:1000";
      const instance = (suffix: string) => `
        <div class="${root}">
          <button type="button" class="${trigger}" id="trigger-${suffix}"
            popovertarget="popover-${suffix}">${suffix}</button>
          <div class="${popover}" id="popover-${suffix}" popover>
            <button type="button">Action</button>
          </div>
        </div>`;
      fixture.innerHTML = `${instance("first")}
        <div style="block-size:220px"></div>${instance("second")}`;
      document.body.append(fixture);
    }, component);

    await page.locator("#trigger-first").click();
    const firstPopover = page.locator("#popover-first");
    await expect(firstPopover).toBeVisible();
    const result = await page.evaluate(() => {
      const first = document
        .querySelector("#trigger-first")!
        .getBoundingClientRect();
      const second = document
        .querySelector("#trigger-second")!
        .getBoundingClientRect();
      const popover = document
        .querySelector("#popover-first")!
        .getBoundingClientRect();
      return {
        supportsAnchorPositioning: CSS.supports("position-area: block-end"),
        gapToFirst: Math.abs(popover.top - first.bottom),
        gapToSecond: Math.abs(popover.top - second.bottom),
        withinViewport:
          popover.left >= 0 &&
          popover.right <= innerWidth &&
          popover.top >= 0 &&
          popover.bottom <= innerHeight,
      };
    });
    expect(result.withinViewport).toBe(true);
    if (result.supportsAnchorPositioning) {
      expect(result.gapToFirst).toBeLessThanOrEqual(40);
      expect(result.gapToSecond).toBeGreaterThan(100);
    }
  });

  test(`${component.name} preserves an explicit named anchor`, async ({
    page,
  }) => {
    await page.goto("./preview/popover-menu");
    await page.evaluate(({ root, trigger, popover, token }) => {
      const fixture = document.createElement("div");
      fixture.className = root;
      fixture.style.setProperty(token, "--explicit-trigger");
      fixture.innerHTML = `
        <button type="button" class="${trigger}" popovertarget="explicit-popover">Open</button>
        <div class="${popover}" id="explicit-popover" popover>Content</div>`;
      document.body.append(fixture);
    }, component);
    const values = await page.evaluate(() => ({
      anchorName: getComputedStyle(
        document.querySelector('[popovertarget="explicit-popover"]')!,
      ).getPropertyValue("anchor-name"),
      positionAnchor: getComputedStyle(
        document.querySelector("#explicit-popover")!,
      ).getPropertyValue("position-anchor"),
    }));
    if (await page.evaluate(() => CSS.supports("position-anchor: --x"))) {
      expect(values.anchorName).toBe("--explicit-trigger");
      expect(values.positionAnchor).toBe("--explicit-trigger");
    }
  });
}
