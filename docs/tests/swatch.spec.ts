import { expect, test } from "@playwright/test";

test("token-filled swatches keep their token color when typed attr() is supported", async ({
  page,
}) => {
  await page.goto("./preview/swatch");

  const tokenSwatches = page.locator(".pl-c-swatch:not([data-color])");
  await expect(tokenSwatches.first()).toBeVisible();

  const styles = await tokenSwatches.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        border: style.borderTopColor,
      };
    }),
  );

  for (const style of styles) {
    expect(style.background).not.toBe(style.border);
  }

  const firstFour = styles.slice(0, 4).map((style) => style.background);
  expect(new Set(firstFour).size).toBe(4);
});

test("data-color swatches still use their explicit color", async ({ page }) => {
  await page.goto("./preview/swatch");

  const dataSwatches = page.locator(".pl-c-swatch[data-color]");
  await expect(dataSwatches).toHaveCount(3);

  const colors = await dataSwatches.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).backgroundColor),
  );

  expect(new Set(colors).size).toBe(3);
  for (const color of colors) {
    expect(color).not.toBe("rgba(0, 0, 0, 0)");
  }
});
