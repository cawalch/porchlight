import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const newComponentPages = [
  { path: "./preview/calendar", heading: "Calendar", root: ".c-date-range" },
  { path: "./preview/combobox", heading: "Combobox", root: ".c-combobox" },
  { path: "./preview/tree", heading: "Tree view", root: ".c-tree" },
  {
    path: "./preview/split-pane",
    heading: "Split pane",
    root: ".c-split-pane",
  },
  {
    path: "./preview/filter-builder",
    heading: "Filter builder",
    root: ".c-filter-builder",
  },
  {
    path: "./preview/workflow-board",
    heading: "Workflow board",
    root: ".c-workflow-board",
  },
  { path: "./preview/chart", heading: "Chart shell", root: ".c-chart" },
] as const;

const frameworkSpecificSelectorPattern =
  /\[(?:hx-[^\]]*|x-[^\]]*|v-[^\]]*|data-reactroot[^\]]*|data-v-[^\]]*)\]/;

const pixelDistance = (a: Uint8Array, b: Uint8Array) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

const samplePagePixel = async (page: Page, point: { x: number; y: number }) => {
  const buffer = await page.screenshot({
    clip: {
      x: Math.round(point.x),
      y: Math.round(point.y),
      width: 1,
      height: 1,
    },
    scale: "css",
  });
  const { data } = await sharp(buffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  return data;
};

test.describe("modern app component contracts", () => {
  for (const component of newComponentPages) {
    test(`${component.heading} preview renders without mobile page overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 820 });
      await page.goto(component.path);

      await expect(
        page.getByRole("heading", { name: component.heading, level: 1 }),
      ).toBeVisible();
      await expect(page.locator(component.root).first()).toBeVisible();

      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });

      expect(
        overflow,
        `${component.path} should keep overflow inside component scrollers`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test("calendar exposes semantic date, range, invalid, disabled, and popover state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 820 });
    await page.goto("./preview/calendar");

    await expect(page.locator(".c-calendar__grid[role='grid']")).toHaveCount(2);
    await expect(
      page.locator(".c-date-range .c-calendar__day[aria-current='date']"),
    ).toBeVisible();
    await expect(
      page
        .locator(".c-date-range .c-calendar__day[aria-selected='true']")
        .first(),
    ).toBeVisible();
    await expect(
      page.locator(".c-date-range .c-calendar__day[data-in-range]"),
    ).toHaveCount(3);
    await page
      .locator(".c-date-range .c-calendar__grid")
      .scrollIntoViewIfNeeded();
    const rangeGapSamples = await page
      .locator(".c-date-range .c-calendar__grid")
      .evaluate((grid) => {
        const start = grid
          .querySelector<HTMLElement>("[data-range-start]")
          ?.getBoundingClientRect();
        const inRange = Array.from(
          grid.querySelectorAll<HTMLElement>("[data-in-range]"),
          (day) => day.getBoundingClientRect(),
        );
        const end = grid
          .querySelector<HTMLElement>("[data-range-end]")
          ?.getBoundingClientRect();

        if (!start || inRange.length < 3 || !end) {
          throw new Error("Expected complete range geometry");
        }

        const sampleY = start.top + start.height / 2;

        return {
          leftBridge: { x: (start.right + inRange[0].left) / 2, y: sampleY },
          innerTrack: {
            x: (inRange[0].right + inRange[1].left) / 2,
            y: sampleY,
          },
          rightBridge: {
            x: (inRange[inRange.length - 1].right + end.left) / 2,
            y: sampleY,
          },
        };
      });
    const [leftBridge, innerTrack, rightBridge] = await Promise.all([
      samplePagePixel(page, rangeGapSamples.leftBridge),
      samplePagePixel(page, rangeGapSamples.innerTrack),
      samplePagePixel(page, rangeGapSamples.rightBridge),
    ]);

    expect(pixelDistance(leftBridge, innerTrack)).toBeLessThanOrEqual(4);
    expect(pixelDistance(rightBridge, innerTrack)).toBeLessThanOrEqual(4);
    await expect(
      page.locator(".c-date-range .c-calendar__day:disabled").first(),
    ).toBeVisible();
    await expect(
      page.locator(".c-field__control[aria-invalid='true']").first(),
    ).toBeVisible();

    const popover = page.locator("#case-due-calendar");
    await expect(popover).toBeHidden();
    await page.getByRole("button", { name: "Choose due date" }).click();
    await expect(popover).toBeVisible();

    const popoverGeometry = await popover.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const topElement = document.elementFromPoint(
        Math.min(window.innerWidth - 1, rect.right - 4),
        Math.min(
          window.innerHeight - 1,
          rect.top + Math.min(80, rect.height / 2),
        ),
      );

      return {
        bottom: rect.bottom,
        right: rect.right,
        scrollDelta: element.scrollHeight - element.clientHeight,
        topElementId: topElement?.id,
        topElementClass: `${topElement?.className ?? ""}`,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        zIndex: Number.parseInt(style.zIndex, 10),
      };
    });

    expect(popoverGeometry.scrollDelta).toBeLessThanOrEqual(1);
    expect(popoverGeometry.right).toBeLessThanOrEqual(
      popoverGeometry.viewportWidth + 1,
    );
    expect(popoverGeometry.bottom).toBeLessThanOrEqual(
      popoverGeometry.viewportHeight + 1,
    );
    expect(popoverGeometry.zIndex).toBeGreaterThanOrEqual(1000);
    expect(
      `${popoverGeometry.topElementId} ${popoverGeometry.topElementClass}`,
    ).toContain("case-due-calendar");
  });

  test("combobox exposes ARIA listbox contracts and async/invalid states", async ({
    page,
  }) => {
    await page.goto("./preview/combobox");

    const input = page.locator(".c-combobox__input[role='combobox']").first();
    await expect(input).toHaveAttribute("aria-expanded", "true");
    await expect(input).toHaveAttribute("aria-controls", "assignee-list");
    await expect(input).toHaveAttribute(
      "aria-activedescendant",
      "assignee-nia",
    );
    await expect(
      page.locator(".c-combobox__popup[role='listbox']").first(),
    ).toBeVisible();
    await expect(
      page
        .locator(".c-combobox__option[role='option'][aria-selected='true']")
        .first(),
    ).toBeVisible();
    await expect(
      page.locator(".c-combobox__status[data-loading]"),
    ).toBeVisible();
    await expect(
      page.locator(".c-combobox__input[aria-invalid='true']"),
    ).toBeVisible();
    await expect(page.locator(".c-combobox--multi .c-chip")).toHaveCount(2);
  });

  test("tree and split panes expose APG-aligned state hooks", async ({
    page,
  }) => {
    await page.goto("./preview/tree");
    await expect(page.locator(".c-tree[role='tree']")).toBeVisible();
    await expect(
      page
        .locator(".c-tree__item[role='treeitem'][aria-expanded='true']")
        .first(),
    ).toBeVisible();
    await expect(
      page.locator(".c-tree__item[aria-selected='true']").first(),
    ).toBeVisible();
    await expect(
      page.locator(".c-tree__group[role='group']").first(),
    ).toBeVisible();

    const treeRhythm = await page.evaluate(() => {
      const rows = [...document.querySelectorAll(".c-tree__item-row")];
      const rowRects = rows
        .slice(0, 7)
        .map((row) => row.getBoundingClientRect());
      const gaps = rowRects
        .slice(1)
        .map((rect, index) => rect.top - rowRects[index].bottom)
        .filter((gap) => gap >= 0);
      const collapsedItem = document.querySelector(
        '.c-tree__item[aria-expanded="false"]',
      );
      const collapsedRow = collapsedItem?.querySelector(".c-tree__item-row");
      return {
        maxGap: Math.max(...gaps),
        collapsedItemHeight: collapsedItem?.getBoundingClientRect().height ?? 0,
        collapsedRowHeight: collapsedRow?.getBoundingClientRect().height ?? 0,
      };
    });

    expect(treeRhythm.maxGap).toBeLessThanOrEqual(8);
    expect(treeRhythm.collapsedItemHeight).toBeLessThanOrEqual(
      treeRhythm.collapsedRowHeight + 1,
    );

    await page.goto("./preview/split-pane");
    const separator = page
      .locator(".c-split-pane__separator[role='separator']")
      .first();
    await expect(separator).toBeVisible();
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
    await expect(separator).toHaveAttribute("aria-valuenow");
    await expect(
      page.locator(".c-split-pane[data-orientation='vertical']"),
    ).toBeVisible();

    const logSplitContainment = await page
      .locator(".log-split .c-split-pane__pane--start")
      .evaluate((pane) => ({
        verticalOverflow: pane.scrollHeight - pane.clientHeight,
        horizontalOverflow: pane.scrollWidth - pane.clientWidth,
        scrollbarGutter: getComputedStyle(pane).scrollbarGutter,
      }));
    expect(logSplitContainment.verticalOverflow).toBeLessThanOrEqual(1);
    expect(logSplitContainment.horizontalOverflow).toBeLessThanOrEqual(1);
    expect(logSplitContainment.scrollbarGutter).toContain("stable");
  });

  test("workflow, chart, and filter surfaces expose app-owned state hooks", async ({
    page,
  }) => {
    await page.goto("./preview/workflow-board");
    await expect(
      page.locator(".c-workflow-board__lanes[data-scroll='inline']"),
    ).toBeVisible();
    await expect(
      page.locator(".c-workflow-lane[data-drop-target]"),
    ).toBeVisible();
    await expect(page.locator(".c-workflow-card[data-dragging]")).toBeVisible();
    await expect(page.locator(".c-workflow-card[data-selected]")).toBeVisible();

    await page.goto("./preview/chart");
    await expect(page.locator(".c-chart__plot[role='img']")).toBeVisible();
    await expect(page.locator(".c-chart[data-state='loading']")).toBeVisible();
    await expect(page.locator(".c-chart[data-state='empty']")).toBeVisible();
    await expect(page.locator(".c-chart[data-state='error']")).toBeVisible();
    await expect(page.locator(".c-chart__table .c-table")).toBeVisible();

    await page.goto("./preview/filter-builder");
    await expect(
      page.locator(".c-saved-views__button[aria-current='true']"),
    ).toBeVisible();
    await expect(
      page.locator(".c-query-chip[aria-invalid='true']"),
    ).toBeVisible();
    await expect(
      page.locator(".c-filter-builder__group[data-operator='or']"),
    ).toBeVisible();
    await expect(
      page.locator(".c-filter-builder__row[aria-invalid='true']"),
    ).toBeVisible();
  });

  test("new component CSS remains framework-selector agnostic", async () => {
    const cssFiles = [
      "../../packages/porchlight/src/06-components/calendar.css",
      "../../packages/porchlight/src/06-components/combobox.css",
      "../../packages/porchlight/src/06-components/tree.css",
      "../../packages/porchlight/src/06-components/split-pane.css",
      "../../packages/porchlight/src/06-components/filter-builder.css",
      "../../packages/porchlight/src/06-components/workflow-board.css",
      "../../packages/porchlight/src/06-components/chart.css",
    ];

    for (const cssFile of cssFiles) {
      const css = await readFile(new URL(cssFile, import.meta.url), "utf8");
      expect(
        css,
        `${cssFile} must not target framework runtime attributes`,
      ).not.toMatch(frameworkSpecificSelectorPattern);
    }
  });
});
