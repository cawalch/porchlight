import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

type PreviewPage = {
  path: string;
  heading?: string;
  root: string;
};

const corePreviews: PreviewPage[] = [
  { path: "./preview/button", heading: "Button", root: ".pl-c-button" },
  { path: "./preview/field", heading: "Field", root: ".pl-c-field__control" },
  { path: "./preview/form", heading: "Form", root: ".pl-c-form" },
  {
    path: "./preview/data-table",
    heading: "Data table",
    root: ".pl-c-table-wrap",
  },
  { path: "./preview/tabs", heading: "Tabs", root: ".pl-c-tabs" },
  { path: "./preview/toolbar", heading: "Toolbar", root: ".pl-c-toolbar" },
  {
    path: "./preview/pagination",
    heading: "Pagination",
    root: ".pl-c-pagination",
  },
  {
    path: "./preview/split-button",
    heading: "Split button",
    root: ".pl-c-split",
  },
  { path: "./preview/dropdown", heading: "Dropdown", root: ".pl-c-dropdown" },
  { path: "./preview/combobox", heading: "Combobox", root: ".pl-c-combobox" },
  { path: "./preview/tree", heading: "Tree view", root: ".pl-c-tree" },
  {
    path: "./preview/filter-builder",
    heading: "Filter builder",
    root: ".pl-c-filter-builder",
  },
  {
    path: "./preview/workflow-board",
    heading: "Workflow board",
    root: ".pl-c-workflow-board",
  },
  { path: "./preview/chart", heading: "Chart shell", root: ".pl-c-chart" },
];

const appPreviews: PreviewPage[] = [
  { path: "./preview/app-dense", root: ".dense-app" },
  {
    path: "./preview/app-list-detail",
    heading: "Operator queue",
    root: ".list-detail-split",
  },
  {
    path: "./preview/app-queue-triage",
    heading: "Queue triage",
    root: ".pl-c-workflow-board",
  },
  {
    path: "./preview/app-process-builder",
    heading: "Vendor onboarding",
    root: ".builder-editor-split",
  },
  {
    path: "./preview/app-settings-console",
    heading: "Settings",
    root: "#settings-console-form",
  },
  {
    path: "./preview/app-reporting-dashboard",
    heading: "Revenue performance",
    root: ".pl-c-chart",
  },
  {
    path: "./preview/app-command-workspace",
    heading: "Command center",
    root: "#workspace-command",
  },
];

const densities = ["compact", "dense"] as const;

async function reach(page: Page, preview: PreviewPage) {
  await page.goto(preview.path);
  if (preview.heading) {
    await expect(
      page.getByRole("heading", {
        name: preview.heading,
        exact: true,
        level: 1,
      }),
    ).toBeVisible();
  }
  await expect(page.locator(preview.root).first()).toBeVisible();
}

async function setDensity(page: Page, density: (typeof densities)[number]) {
  await page.evaluate((nextDensity) => {
    document.body.setAttribute("data-pl-density", nextDensity);
  }, density);
}

async function sampledImageVariance(page: Page, selector: string) {
  const locator = page.locator(selector).first();
  const box = await locator.boundingBox();

  expect(box, `${selector} should have a screenshotable box`).not.toBeNull();

  const clip = {
    x: Math.max(0, Math.floor(box!.x)),
    y: Math.max(0, Math.floor(box!.y)),
    width: Math.max(1, Math.min(720, Math.floor(box!.width))),
    height: Math.max(1, Math.min(420, Math.floor(box!.height))),
  };
  const buffer = await page.screenshot({ clip, scale: "css" });
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .resize({ width: 96, height: 64, fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let min = 255;
  let max = 0;
  let colorEdges = 0;
  const channels = info.channels;
  const stride = info.width * channels;

  for (let index = 0; index < data.length; index += channels) {
    const luminance =
      data[index] * 0.2126 +
      data[index + 1] * 0.7152 +
      data[index + 2] * 0.0722;
    min = Math.min(min, luminance);
    max = Math.max(max, luminance);

    if (index + channels < data.length) {
      const next =
        data[index + channels] * 0.2126 +
        data[index + channels + 1] * 0.7152 +
        data[index + channels + 2] * 0.0722;
      if (Math.abs(luminance - next) > 6) {
        colorEdges += 1;
      }
    }

    if (index + stride < data.length) {
      const below =
        data[index + stride] * 0.2126 +
        data[index + stride + 1] * 0.7152 +
        data[index + stride + 2] * 0.0722;
      if (Math.abs(luminance - below) > 6) {
        colorEdges += 1;
      }
    }
  }

  return {
    contrastRange: max - min,
    colorEdges,
  };
}

test.describe("compact and dense browser coverage", () => {
  test("density tokens reduce real control geometry in order", async ({
    page,
  }) => {
    await page.goto("./preview/button");
    await expect(
      page.getByRole("heading", { name: "Button", exact: true, level: 1 }),
    ).toBeVisible();

    const measures = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>(
        ".pl-c-button[data-variant='primary']:not([disabled])",
      );

      if (!button) {
        throw new Error("Missing primary button");
      }

      return ["comfortable", "compact", "dense", "touch"].map((density) => {
        document.body.setAttribute("data-pl-density", density);
        const bodyStyle = getComputedStyle(document.body);
        return {
          density,
          token: bodyStyle.getPropertyValue("--pl-control-block-size").trim(),
          height: button.getBoundingClientRect().height,
        };
      });
    });

    const byDensity = Object.fromEntries(
      measures.map((measure) => [measure.density, measure]),
    );

    expect(byDensity.comfortable.token).toBe("2.5rem");
    expect(byDensity.compact.token).toBe("2rem");
    expect(byDensity.dense.token).toBe("1.75rem");
    expect(byDensity.touch.token).toBe("2.75rem");
    expect(byDensity.compact.height).toBeLessThan(byDensity.comfortable.height);
    expect(byDensity.dense.height).toBeLessThan(byDensity.compact.height);
    expect(byDensity.touch.height).toBeGreaterThan(
      byDensity.comfortable.height,
    );
  });

  for (const density of densities) {
    test(`core component previews stay usable in ${density} mode`, async ({
      page,
    }) => {
      for (const width of [1280, 768, 360]) {
        await page.setViewportSize({
          width,
          height: width === 360 ? 760 : 820,
        });

        for (const preview of corePreviews) {
          await reach(page, preview);
          await setDensity(page, density);

          const state = await page.evaluate((rootSelector) => {
            const de = document.documentElement;
            const root = document.querySelector<HTMLElement>(rootSelector);
            const interactive = [
              ...document.querySelectorAll<HTMLElement>(
                [
                  ".pl-c-button",
                  ".pl-c-field__control",
                  ".pl-c-tabs__tab",
                  ".pl-c-segmented__item",
                  ".pl-c-pagination a",
                  ".pl-c-pagination button",
                  ".pl-c-split__primary",
                  ".pl-c-split__toggle",
                  ".pl-c-combobox__input",
                  ".pl-c-tree__item-row",
                  ".pl-c-filter-builder button",
                  ".pl-c-filter-builder select",
                ].join(", "),
              ),
            ]
              .filter((element) => element.offsetParent !== null)
              .filter((element) => {
                const rect = element.getBoundingClientRect();
                return (
                  rect.right > 0 &&
                  rect.left < innerWidth &&
                  rect.bottom > 0 &&
                  rect.top < innerHeight
                );
              })
              .slice(0, 12)
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  className: element.className,
                  width: rect.width,
                  height: rect.height,
                  right: rect.right,
                  left: rect.left,
                };
              });

            if (!root) {
              return null;
            }

            const rootRect = root.getBoundingClientRect();

            return {
              pageOverflow: de.scrollWidth - de.clientWidth,
              rootWidth: rootRect.width,
              rootHeight: rootRect.height,
              collapsedControls: interactive.filter(
                (item) =>
                  item.width < 16 ||
                  item.height < 16 ||
                  item.right < 0 ||
                  item.left > innerWidth,
              ),
            };
          }, preview.root);

          expect(state, `${preview.path} root should exist`).not.toBeNull();
          expect(
            state!.pageOverflow,
            `${preview.path} should not create page horizontal overflow at ${width}px`,
          ).toBeLessThanOrEqual(1);
          expect(
            state!.rootWidth,
            `${preview.path} root should have width`,
          ).toBeGreaterThan(0);
          expect(
            state!.rootHeight,
            `${preview.path} root should have height`,
          ).toBeGreaterThan(0);
          expect(
            state!.collapsedControls,
            `${preview.path} should not collapse visible controls in ${density}`,
          ).toEqual([]);
        }
      }
    });
  }

  test("data-heavy app previews keep overflow inside component scrollers", async ({
    page,
  }) => {
    for (const density of densities) {
      for (const width of [1280, 1024, 768]) {
        await page.setViewportSize({ width, height: 820 });

        for (const preview of appPreviews) {
          await reach(page, preview);
          await setDensity(page, density);

          const state = await page.evaluate((rootSelector) => {
            const de = document.documentElement;
            const root = document.querySelector<HTMLElement>(rootSelector);
            const tableWraps = [
              ...document.querySelectorAll<HTMLElement>(".pl-c-table-wrap"),
            ].map((wrap) => {
              const rect = wrap.getBoundingClientRect();
              const style = getComputedStyle(wrap);
              return {
                width: rect.width,
                scrollDelta: wrap.scrollWidth - wrap.clientWidth,
                overflowX: style.overflowX,
                right: rect.right,
              };
            });

            if (!root) {
              return null;
            }

            const rootRect = root.getBoundingClientRect();

            return {
              pageOverflow: de.scrollWidth - de.clientWidth,
              rootWidth: rootRect.width,
              rootHeight: rootRect.height,
              escapedScrollers: tableWraps.filter(
                (wrap) =>
                  wrap.scrollDelta > 1 &&
                  !["auto", "scroll"].includes(wrap.overflowX),
              ),
              tableWrapsPastViewport: tableWraps.filter(
                (wrap) =>
                  wrap.right > innerWidth + 1 || wrap.width > innerWidth + 1,
              ),
            };
          }, preview.root);

          expect(state, `${preview.path} root should exist`).not.toBeNull();
          expect(
            state!.pageOverflow,
            `${preview.path} should not create page overflow in ${density} mode at ${width}px`,
          ).toBeLessThanOrEqual(1);
          expect(state!.rootWidth).toBeGreaterThan(0);
          expect(state!.rootHeight).toBeGreaterThan(0);
          expect(state!.escapedScrollers).toEqual([]);
          expect(state!.tableWrapsPastViewport).toEqual([]);
        }
      }
    }
  });

  test("dark dense screenshots show nonblank visual signal in key regions", async ({
    page,
  }) => {
    const samples: PreviewPage[] = [
      { path: "./preview/button", heading: "Button", root: ".pl-c-button" },
      { path: "./preview/field", heading: "Field", root: ".pl-c-field" },
      {
        path: "./preview/data-table",
        heading: "Data table",
        root: ".pl-c-table-wrap",
      },
      {
        path: "./preview/workflow-board",
        heading: "Workflow board",
        root: ".pl-c-workflow-board",
      },
      {
        path: "./preview/app-process-builder",
        heading: "Vendor onboarding",
        root: ".builder-editor-split",
      },
      { path: "./preview/app-dense", root: ".dense-app" },
    ];

    await page.setViewportSize({ width: 1280, height: 820 });

    for (const preview of samples) {
      await reach(page, preview);
      await page.evaluate(() => {
        document.body.setAttribute("data-pl-theme", "dark");
      });
      await setDensity(page, "dense");

      const signal = await sampledImageVariance(page, preview.root);

      expect(
        signal.contrastRange,
        `${preview.path} should not screenshot as a blank block`,
      ).toBeGreaterThan(8);
      expect(
        signal.colorEdges,
        `${preview.path} should preserve visible UI edges in dense mode`,
      ).toBeGreaterThan(20);
    }
  });
});
