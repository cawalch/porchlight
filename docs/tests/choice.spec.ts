import { expect, test } from "@playwright/test";

test("choice rows and cards keep native inputs as the source of truth", async ({
  page,
}) => {
  await page.goto("./preview/choice");

  await expect(page.locator(".pl-c-choice__control")).toHaveCount(3);
  await expect(page.locator(".pl-c-choice__control:disabled")).toHaveCount(1);
  await expect(page.locator(".pl-c-choice-card__control")).toHaveCount(3);
  await expect(page.locator(".pl-c-choice-card__control:checked")).toHaveCount(
    1,
  );
});

test("selected choice cards get a distinct visual treatment", async ({
  page,
}) => {
  await page.goto("./preview/choice");

  const selected = page.locator(".pl-c-choice-card").nth(1);
  const unselected = page.locator(".pl-c-choice-card").first();
  const selectedStyle = await selected.evaluate((el) => {
    const style = getComputedStyle(el);
    return { border: style.borderColor, background: style.backgroundColor };
  });
  const unselectedStyle = await unselected.evaluate((el) => {
    const style = getComputedStyle(el);
    return { border: style.borderColor, background: style.backgroundColor };
  });

  expect(selectedStyle.border).not.toBe(unselectedStyle.border);
  expect(selectedStyle.background).not.toBe(unselectedStyle.background);
});
