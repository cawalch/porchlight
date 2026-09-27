import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./preview/field");
});

test("native picker keeps keyboard selection, validation, events and form reset", async ({
  page,
}) => {
  const select = page.locator('[name="priority"]');
  await expect(select).toHaveCSS("appearance", "base-select");
  await expect(select).toHaveCSS("background-image", "none");
  expect(
    await select.evaluate((el: HTMLSelectElement) => el.validity.valueMissing),
  ).toBe(true);
  await select.evaluate((el) =>
    el.addEventListener("change", () =>
      el.setAttribute("data-changed", "true"),
    ),
  );
  await select.focus();
  await page.keyboard.press("Space");
  await expect(select).toHaveJSProperty("value", "");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(select).toHaveValue("normal");
  await expect(select).toHaveAttribute("data-changed", "true");
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(select).toHaveValue("later"); // Disabled critical is skipped.
  const state = await page
    .locator("[data-preview-select]")
    .evaluate((el: HTMLFormElement) => ({
      valid: el.checkValidity(),
      data: Object.fromEntries(new FormData(el)),
    }));
  expect(state).toEqual({
    valid: true,
    data: { priority: "later", policy: "legacy" },
  });
  await expect(page.locator('[name="region"]')).toBeDisabled();
  await page.getByRole("button", { name: "Reset selections" }).click();
  await expect(select).toHaveValue("");
});

for (const density of ["compact", "comfortable", "touch"]) {
  test(`open picker fits mobile, dark RTL and ${density} density`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate((value) => {
      document.documentElement.dataset.plTheme = "dark";
      document.documentElement.dataset.plDensity = value;
      document.documentElement.dir = "rtl";
    }, density);
    const select = page.locator('[name="priority"]');
    await select.focus();
    await page.keyboard.press("Space");
    await expect(
      page.locator('[name="priority"] option[value="later"]'),
    ).toBeVisible();
    const metrics = await select.evaluate((el) => {
      const option = el.querySelector<HTMLOptionElement>('[value="later"]')!;
      const rect = option.getBoundingClientRect();
      const style = getComputedStyle(option);
      return {
        left: rect.left,
        right: rect.right,
        height: rect.height,
        minHeight: parseFloat(style.minBlockSize),
        lineHeight: parseFloat(style.lineHeight),
        bg: getComputedStyle(el, "::picker(select)").backgroundColor,
        expectedBg: getComputedStyle(el).backgroundColor,
      };
    });
    expect(metrics.left).toBeGreaterThanOrEqual(0);
    expect(metrics.right).toBeLessThanOrEqual(390);
    expect(metrics.height).toBeGreaterThanOrEqual(metrics.minHeight);
    expect(metrics.height).toBeGreaterThan(metrics.lineHeight * 2);
    expect(metrics.bg).toBe(metrics.expectedBg);
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });
    const rect = await select.boundingBox();
    expect(rect!.x).toBeGreaterThanOrEqual(0);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(390);
  });
}

test("forced colors retains focus, selected checkmark and disabled contrast", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  const select = page.locator('[name="priority"]');
  await select.focus();
  await expect(select).toHaveCSS("outline-style", "solid");
  await expect(select).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Space");
  const checked = page.locator('[name="priority"] option:checked');
  const colors = await checked.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      bg: style.backgroundColor,
      fg: style.color,
      check: getComputedStyle(el, "::checkmark").display,
    };
  });
  expect(colors.bg).not.toBe(colors.fg);
  expect(colors.check).not.toBe("none");
});

test("opt-in does not replace ordinary, multiple or listbox selects", async ({
  page,
}) => {
  const plain = page.getByRole("combobox", { name: /^Plan / });
  await expect(plain).toHaveCSS("appearance", "none");
  await plain.selectOption({ label: "Enterprise" });
  await expect(plain).toHaveValue("Enterprise");
  const select = page.locator('[name="priority"]');
  await select.evaluate((el) => el.setAttribute("multiple", ""));
  await expect(select).not.toHaveCSS("appearance", "base-select");
  await select.evaluate((el) => {
    el.removeAttribute("multiple");
    el.setAttribute("size", "3");
  });
  await expect(select).not.toHaveCSS("appearance", "base-select");
});
