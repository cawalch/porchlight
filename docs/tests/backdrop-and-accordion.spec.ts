import { test, expect } from "@playwright/test";

test.describe("exclusive accordion", () => {
  test("native details name attribute coordinates single open behavior", async ({
    page,
  }) => {
    await page.goto("./preview/accordion");

    const exclusiveGroup = page.locator("#exclusive-accordion");
    await expect(exclusiveGroup).toBeVisible();

    const item1 = exclusiveGroup
      .locator('.pl-c-accordion__item[name="docs-faq"]')
      .nth(0);
    const item2 = exclusiveGroup
      .locator('.pl-c-accordion__item[name="docs-faq"]')
      .nth(1);

    // Initial state: both items start closed
    await expect(item1).not.toHaveAttribute("open");
    await expect(item2).not.toHaveAttribute("open");

    // Click item 1 summary to open it
    await item1.locator("summary").click();
    await expect(item1).toHaveAttribute("open", "");
    await expect(item2).not.toHaveAttribute("open");

    await expect
      .poll(async () => {
        return await item1.locator(".pl-c-accordion__icon").evaluate((el) => {
          return getComputedStyle(el).rotate;
        });
      })
      .toBe("180deg");

    // Click item 2 summary: item 2 opens, item 1 closes automatically
    await item2.locator("summary").click();
    await expect(item2).toHaveAttribute("open", "");
    await expect(item1).not.toHaveAttribute("open");

    await expect
      .poll(async () => {
        return await item2.locator(".pl-c-accordion__icon").evaluate((el) => {
          return getComputedStyle(el).rotate;
        });
      })
      .toBe("180deg");

    await expect
      .poll(async () => {
        return await item1.locator(".pl-c-accordion__icon").evaluate((el) => {
          return getComputedStyle(el).rotate;
        });
      })
      .toMatch(/^(none|0deg)$/);

    // Click item 1 summary to switch back
    await item1.locator("summary").click();
    await expect(item1).toHaveAttribute("open", "");
    await expect(item2).not.toHaveAttribute("open");

    await expect
      .poll(async () => {
        return await item1.locator(".pl-c-accordion__icon").evaluate((el) => {
          return getComputedStyle(el).rotate;
        });
      })
      .toBe("180deg");

    await expect
      .poll(async () => {
        return await item2.locator(".pl-c-accordion__icon").evaluate((el) => {
          return getComputedStyle(el).rotate;
        });
      })
      .toMatch(/^(none|0deg)$/);
  });
});

test.describe("backdrop transitions", () => {
  test("dialog ::backdrop defines opacity transition and reaches full opacity when open", async ({
    page,
  }) => {
    await page.goto("./preview/dialog");

    const dialog = page.locator("#confirm-dialog");
    await page.locator('[data-open="confirm-dialog"]').click();
    await expect(dialog).toBeVisible();

    // Verify transition property is defined
    const transitionProperty = await dialog.evaluate((el) => {
      return getComputedStyle(el, "::backdrop").transitionProperty;
    });
    expect(transitionProperty).toContain("opacity");

    // Wait for enter transition to reach full opacity
    await expect
      .poll(async () => {
        return await dialog.evaluate((el) => {
          return Number.parseFloat(getComputedStyle(el, "::backdrop").opacity);
        });
      })
      .toBeCloseTo(1, 1);
  });

  test("drawer ::backdrop defines opacity transition and reaches full opacity when open", async ({
    page,
  }) => {
    await page.goto("./preview/drawer");

    const drawer = page.locator("#drawer-end");
    await page.locator('[popovertarget="drawer-end"]').first().click();
    await expect(drawer).toBeVisible();

    // Verify transition property is defined
    const transitionProperty = await drawer.evaluate((el) => {
      return getComputedStyle(el, "::backdrop").transitionProperty;
    });
    expect(transitionProperty).toContain("opacity");

    // Wait for enter transition to reach full opacity
    await expect
      .poll(async () => {
        return await drawer.evaluate((el) => {
          return Number.parseFloat(getComputedStyle(el, "::backdrop").opacity);
        });
      })
      .toBeCloseTo(1, 1);
  });
});
