import { expect, test } from "@playwright/test";

test("split-pane headers share an inset regardless of the pane's HTML tag", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("./preview/split-pane");
  const headers = await page
    .locator(".process-builder .pl-c-split-pane__header")
    .evaluateAll((elements) =>
      elements.map((element) => ({
        top: element.getBoundingClientRect().top,
        padding: getComputedStyle(element).padding,
      })),
    );
  expect(headers).toHaveLength(2);
  expect(headers[0].top).toBeCloseTo(headers[1].top, 1);
  expect(headers[0].padding).toBe(headers[1].padding);
  await expect(page.locator("main.builder-workspace")).toHaveCSS(
    "padding-block",
    "0px",
  );
});

for (const width of [390, 1440]) {
  test(`split-pane headers stay inside rounded corners at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "app-command-workspace",
      "app-queue-triage",
      "app-list-detail",
    ]) {
      await page.goto(`./preview/${route}`);
      if (route === "app-command-workspace") {
        await expect(page.locator("#workspace-command")).toBeVisible();
        await page.keyboard.press("Escape");
      }
      const pane = page
        .locator(".pl-l-app-shell__main .pl-c-split-pane")
        .first();
      await pane.scrollIntoViewIfNeeded();
      // Put the top edge below the site header before sampling its corners.
      await pane.evaluate((element) =>
        window.scrollBy(0, element.getBoundingClientRect().top - 180),
      );
      const corners = await pane.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return [box.left + 2, box.right - 2].map((x) => {
          const hit = document.elementFromPoint(x, box.top + 2);
          return !!hit?.closest(".pl-c-split-pane__header");
        });
      });
      expect(
        corners,
        `${route}: headers must not paint outside rounded corners`,
      ).toEqual([false, false]);
    }
  });
}

for (const direction of ["ltr", "rtl"] as const) {
  test(`rounded surface accents follow the inline-start edge in ${direction}`, async ({
    page,
  }) => {
    for (const [route, selector] of [
      ["alert", ".pl-c-alert"],
      ["card", ".pl-c-card"],
      ["toast", ".pl-c-toast"],
      ["workflow-board", ".pl-c-workflow-card[data-selected]"],
      ["workflow-board", ".pl-c-workflow-lane"],
    ]) {
      await page.goto(`./preview/${route}`);
      await page.locator("html").evaluate((html, dir) => {
        html.setAttribute("dir", dir);
      }, direction);
      if (route === "card")
        await page
          .locator(selector)
          .first()
          .evaluate((element) =>
            element.setAttribute("data-variant", "accent"),
          );
      if (selector === ".pl-c-workflow-lane")
        await page
          .locator(selector)
          .first()
          .evaluate((element) => element.setAttribute("data-tone", "accent"));
      const edge = await page
        .locator(selector)
        .first()
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            start: style.borderInlineStartWidth,
            end: style.borderInlineEndWidth,
            left: style.borderLeftWidth,
            right: style.borderRightWidth,
            radius: parseFloat(style.borderStartStartRadius),
          };
        });
      expect(edge.start, selector).toBe("3px");
      expect(edge.end, selector).toBe("1px");
      expect(direction === "ltr" ? edge.left : edge.right, selector).toBe(
        "3px",
      );
      expect(edge.radius, selector).toBeGreaterThan(0);
    }
  });

  test(`selecting a workflow card keeps its text aligned in ${direction}`, async ({
    page,
  }) => {
    await page.goto("./preview/workflow-board");
    await page.locator("html").evaluate((html, dir) => {
      html.setAttribute("dir", dir);
    }, direction);
    const card = page.locator(".pl-c-workflow-card").first();
    await card.evaluate((element) => element.setAttribute("data-selected", ""));
    const position = () =>
      card.locator(".pl-c-workflow-card__title").evaluate((title) => {
        const box = title.getBoundingClientRect();
        return { left: box.left, right: box.right };
      });
    const selected = await position();
    await card.evaluate((element) => {
      element.removeAttribute("data-selected");
    });

    expect(
      (await position())[direction === "ltr" ? "left" : "right"],
    ).toBeCloseTo(selected[direction === "ltr" ? "left" : "right"], 1);
  });
}

test("toast preview shadows can extend beyond the static stack", async ({
  page,
}) => {
  await page.goto("./preview/toast");
  const toast = page.locator('[data-toast="demo"]').last();
  await toast.scrollIntoViewIfNeeded();
  await expect(page.locator(".pl-c-toast-stack").first()).toHaveCSS(
    "overflow-x",
    "visible",
  );
  const toggle = page.getByRole("switch", { name: "Show toasts" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(toggle).toBeChecked();
  for (let i = 0; i < 3; i++) {
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await page.waitForTimeout(50);
  }
  await toast.evaluate((element) =>
    (element as HTMLElement).style.setProperty("--pl-c-toast-shadow", "none"),
  );
  await expect(toast).toHaveCSS("box-shadow", "none");
});
