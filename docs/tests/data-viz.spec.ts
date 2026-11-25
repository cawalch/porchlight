import { expect, test } from "@playwright/test";

test("sparkline is decorative and the summary carries the meaning", async ({
  page,
}) => {
  await page.goto("./preview/data-viz");

  const sparkline = page.locator(".pl-c-sparkline");
  await expect(sparkline).toBeVisible();
  await expect(sparkline).toHaveAttribute("aria-hidden", "true");
  await expect(
    page.getByText("Revenue trend: up 12.4% over the last 7 days."),
  ).toHaveCount(1);
});

test("bar values produce proportional fills and a table fallback", async ({
  page,
}) => {
  await page.goto("./preview/data-viz");

  const bars = page.locator(".pl-c-bar-chart__fill");
  await expect(bars).toHaveCount(7);

  const heights = await bars.evaluateAll((elements) =>
    elements.map((element) => element.getBoundingClientRect().height),
  );
  expect(heights[3]).toBeGreaterThan(heights[0]);
  expect(heights[6]).toBeLessThan(heights[3]);

  await expect(
    page.locator("table.pl-u-sr-only caption", {
      hasText: "Requests by day",
    }),
  ).toHaveCount(1);
});

test("heatmap cells vary by value and keep a table fallback", async ({
  page,
}) => {
  await page.goto("./preview/data-viz");

  const cells = page.locator(".pl-c-heatmap__cell");
  await expect(cells).toHaveCount(28);

  const colors = await cells.evaluateAll((elements) =>
    elements
      .slice(0, 2)
      .map((element) => getComputedStyle(element).backgroundColor),
  );
  expect(colors[0]).not.toBe(colors[1]);

  await expect(
    page.locator("table.pl-u-sr-only caption", {
      hasText: "Activity by day and week",
    }),
  ).toHaveCount(1);
});
