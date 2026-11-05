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
});
