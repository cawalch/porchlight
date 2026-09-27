import { test, expect } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`card prose and toolbar slots share a consistent inset at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./preview/app-reporting-dashboard");
    const metrics = await page.evaluate(() => {
      const body = document.querySelector(".pl-c-card__body.pl-l-stack")!;
      const paragraphs = [...body.children];
      const first = paragraphs[0].getBoundingClientRect();
      const last = paragraphs[1].getBoundingClientRect();
      const card = document.querySelector(
        '[aria-labelledby="breakdown-title"]',
      )!;
      const cardStyle = getComputedStyle(card);
      const title = card
        .querySelector(".pl-c-card__title")!
        .getBoundingClientRect();
      return {
        paragraphGap: last.top - first.bottom,
        stackGap: parseFloat(getComputedStyle(body).rowGap),
        trailingSpace: body.getBoundingClientRect().bottom - last.bottom,
        titleInset: title.left - card.getBoundingClientRect().left,
        cardInset:
          parseFloat(cardStyle.paddingLeft) +
          parseFloat(cardStyle.borderLeftWidth),
      };
    });
    expect(metrics.paragraphGap).toBeCloseTo(metrics.stackGap, 1);
    expect(metrics.trailingSpace).toBeCloseTo(0, 1);
    expect(metrics.titleInset).toBeCloseTo(metrics.cardInset, 1);

    // Edge-to-edge cards still rely on the toolbar for their content inset.
    await page.goto("./preview/app-cases");
    await expect(page.locator(".cases-filters")).toHaveCSS("padding", "0px");
    const toolbarInset = await page
      .locator(".cases-toolbar-flat")
      .evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineStart));
    expect(toolbarInset).toBeGreaterThan(0);
  });

  test(`narrow card headers keep badges at their natural width at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./preview/app-list-detail");
    const metrics = await page
      .locator(".pl-c-card__header")
      .first()
      .evaluate((header) => {
        const badge = header.querySelector(".pl-c-badge")!;
        return {
          direction: getComputedStyle(header).flexDirection,
          headerWidth: header.getBoundingClientRect().width,
          badgeWidth: badge.getBoundingClientRect().width,
        };
      });
    expect(metrics.direction).toBe("column");
    expect(metrics.badgeWidth).toBeLessThan(metrics.headerWidth / 2);
  });
}

for (const width of [390, 1440]) {
  test(`queue triage separates sibling panels with the standard spacing at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("./preview/app-queue-triage");
    const panes = await page
      .locator(".pl-c-split-pane__pane > .pl-c-split-pane__pane-inner")
      .evaluateAll((bodies) =>
        bodies.map((body) => {
          const style = getComputedStyle(body);
          const children = [...body.children].map((child) =>
            child.getBoundingClientRect(),
          );
          return {
            inset: parseFloat(style.paddingBlockStart),
            gaps: children
              .slice(1)
              .map((child, i) => child.top - children[i].bottom),
          };
        }),
      );
    expect(panes).toHaveLength(2);
    expect(panes.map((pane) => pane.gaps.length)).toEqual([4, 2]);
    for (const pane of panes) {
      expect(pane.inset).toBeGreaterThan(0);
      for (const gap of pane.gaps) {
        // Both pane padding and the standard stack gap use --pl-space-4.
        expect(gap).toBeCloseTo(pane.inset, 1);
      }
    }
  });
}
