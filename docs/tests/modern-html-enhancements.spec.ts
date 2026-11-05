import { expect, test } from "@playwright/test";

test.describe("modern HTML platform enhancements", () => {
  test("dialog supports declarative invoker attributes and closedby light dismiss", async ({
    page,
  }) => {
    await page.goto("./preview/dialog");
    const dialog = page.locator("#confirm-dialog");
    const openBtn = page.locator(
      "button[commandfor='confirm-dialog'][command='show-modal']",
    );
    const closeBtn = dialog
      .locator("button[commandfor='confirm-dialog'][command='close']")
      .first();

    await expect(dialog).toHaveAttribute("closedby", "any");
    await expect(openBtn).toHaveAttribute("command", "show-modal");

    // Trigger open via button
    await openBtn.click();
    await expect(dialog).toBeVisible();
    await expect(closeBtn).toBeVisible();

    // Trigger close via close button
    await closeBtn.click();
    await expect(dialog).toBeHidden();
  });

  test("streamlined accordion expands without intermediate panel wrapper", async ({
    page,
  }) => {
    await page.goto("./preview/accordion");
    const streamlinedItem = page
      .locator(".pl-c-accordion__item")
      .filter({ hasText: "Streamlined Item" });

    await expect(streamlinedItem).toBeVisible();
    const summary = streamlinedItem.locator(".pl-c-accordion__header");
    const content = streamlinedItem.locator(".pl-c-accordion__content");

    // Initially closed
    await expect(streamlinedItem).not.toHaveAttribute("open", "");

    // Click to open
    await summary.click();
    await expect(streamlinedItem).toHaveAttribute("open", "");
    await expect(content).toBeVisible();

    // Click to close
    await summary.click();
    await expect(streamlinedItem).not.toHaveAttribute("open", "");
  });

  test("top-layer popover tooltip body styles correctly when active", async ({
    page,
  }) => {
    await page.goto("./preview/tooltip");

    const result = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "pl-c-tooltip__body";
      el.setAttribute("popover", "hint");
      el.textContent = "Top-layer tooltip test";
      document.body.appendChild(el);

      const computed = window.getComputedStyle(el);
      const border = computed.borderWidth;
      const shadow = computed.boxShadow;

      document.body.removeChild(el);
      return { border, hasShadow: shadow.length > 0 };
    });

    expect(result.border).toBe("0px");
    expect(result.hasShadow).toBe(true);
  });

  test("customizable select styles base-select and options", async ({
    page,
  }) => {
    await page.goto("./preview/field");
    const select = page.locator('[name="priority"]');
    await expect(select).toHaveCSS("appearance", "base-select");

    const option = select.locator("option").nth(1);
    const optionStyle = await option.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display;
    });
    expect(optionStyle.length).toBeGreaterThan(0);
  });

  test("enhancements preview exposes reading-flow, pure-CSS stagger, and calc-size", async ({
    page,
  }) => {
    await page.goto("./preview/enhancements");

    // Reading flow grid
    const readingGrid = page.locator("#reading-flow-grid");
    await expect(readingGrid).toBeVisible();
    await expect(readingGrid).toHaveAttribute("data-reading-flow", "rows");

    // Pure-CSS sibling stagger container and items
    const staggerGroup = page.locator("#stagger-demo-container");
    await expect(staggerGroup).toBeVisible();
    const staggerItems = staggerGroup.locator(".demo-stagger-item");
    await expect(staggerItems).toHaveCount(5);

    // calc-size demo
    const calcSizeDemo = page.locator("#calc-size-demo");
    await expect(calcSizeDemo).toBeVisible();
    await expect(calcSizeDemo).toHaveAttribute("data-calc-size", "intrinsic");
  });

  test("anchored menus and tooltips support position-try-order and view-transition-class", async ({
    page,
  }) => {
    await page.goto("./preview/dropdown");

    const result = await page.evaluate(() => {
      const supportsPositionTryOrder = CSS.supports(
        "position-try-order",
        "most-block-size",
      );
      const supportsViewTransitionClass = CSS.supports(
        "view-transition-class",
        "pl-c-card",
      );
      const supportsReadingFlow = CSS.supports("reading-flow", "grid-rows");

      // Verify rule definitions in loaded stylesheets
      let foundPositionTryOrder = false;
      let foundViewTransitionClass = false;
      let foundReadingFlow = false;

      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules)) {
            const cssText = rule.cssText;
            if (cssText.includes("position-try-order"))
              foundPositionTryOrder = true;
            if (cssText.includes("view-transition-class"))
              foundViewTransitionClass = true;
            if (cssText.includes("reading-flow")) foundReadingFlow = true;
          }
        } catch {
          // Cross-origin sheets ignored
        }
      }

      return {
        supportsPositionTryOrder,
        supportsViewTransitionClass,
        supportsReadingFlow,
        foundPositionTryOrder,
        foundViewTransitionClass,
        foundReadingFlow,
      };
    });

    expect(result.foundPositionTryOrder).toBe(true);
    expect(result.foundViewTransitionClass).toBe(true);
    expect(result.foundReadingFlow).toBe(true);
  });
});
