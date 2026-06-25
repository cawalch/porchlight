import { test, expect } from "@playwright/test";

async function tabUntil(
  page: import("@playwright/test").Page,
  selector: string,
  maxTabs = 30,
) {
  for (let i = 0; i < maxTabs; i++) {
    const matched = await page.evaluate((sel) => {
      const active = document.activeElement;
      return active instanceof Element && active.matches(sel);
    }, selector);
    if (matched) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Could not tab to ${selector}`);
}

test("inline fields align on desktop and stack without overflow on mobile", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const field = page.locator("[data-preview-inline]");
  const label = field.locator(".c-field__label");
  const control = field.locator(".c-field__control");

  const desktop = {
    label: await label.boundingBox(),
    control: await control.boundingBox(),
  };
  expect(desktop.label).not.toBeNull();
  expect(desktop.control).not.toBeNull();
  expect(desktop.control!.x).toBeGreaterThan(desktop.label!.x);
  expect(Math.abs(desktop.control!.y - desktop.label!.y)).toBeLessThan(16);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./preview/field");
  const mobileField = page.locator("[data-preview-inline]");
  const mobile = {
    label: await mobileField.locator(".c-field__label").boundingBox(),
    control: await mobileField.locator(".c-field__control").boundingBox(),
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  };
  expect(mobile.label).not.toBeNull();
  expect(mobile.control).not.toBeNull();
  expect(mobile.control!.y).toBeGreaterThan(mobile.label!.y);
  expect(mobile.overflow).toBe(false);
});

test("hidden-label inline fields do not reserve the label gutter", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const metrics = await page.locator(".toolbar-demo").evaluate((toolbar) => {
    const field = toolbar.querySelector(".c-field");
    const input = toolbar.querySelector(".c-field__control");
    if (!field || !input) return null;
    const fieldRect = field.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    return {
      fieldWidth: fieldRect.width,
      inputWidth: inputRect.width,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics!.inputWidth / metrics!.fieldWidth).toBeGreaterThan(0.9);
});

test("form grids use multiple columns on desktop and one column on mobile", async ({
  page,
}) => {
  await page.goto("./preview/form");
  const desktopBoxes = await page
    .locator("[data-preview-form-grid] .c-form__grid > *")
    .evaluateAll((els) =>
      els.slice(0, 4).map((el) => {
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y) };
      }),
    );
  const firstRowY = desktopBoxes[0].y;
  const desktopColumns = desktopBoxes.filter(
    (box) => Math.abs(box.y - firstRowY) < 8,
  ).length;
  expect(desktopColumns).toBeGreaterThanOrEqual(2);

  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("./preview/form");
  const mobileBoxes = await page
    .locator("[data-preview-form-grid] .c-form__grid > *")
    .evaluateAll((els) =>
      els.slice(0, 4).map((el) => {
        const rect = el.getBoundingClientRect();
        return { x: Math.round(rect.x), y: Math.round(rect.y) };
      }),
    );
  for (let i = 1; i < mobileBoxes.length; i++) {
    expect(mobileBoxes[i].y).toBeGreaterThan(mobileBoxes[i - 1].y);
  }
});

test("choice groups keep native checkbox and radio controls", async ({ page }) => {
  await page.goto("./preview/form");

  const group = page.locator("[data-preview-choice-group]");
  await expect(group.locator("legend")).toHaveText("Email updates");

  const first = group.locator(".c-choice__input").first();
  await expect(first).toHaveAttribute("type", "checkbox");
  await expect(first).toBeChecked();
  await expect(group.locator(".c-choice__input:disabled")).toBeVisible();

  await tabUntil(page, "[data-preview-choice-group] .c-choice__input");
  const focus = await first.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      focusVisible: el.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineStyle).not.toBe("none");
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThan(0);

  const checkedRadio = page.locator("input[name='cadence']:checked");
  await expect(checkedRadio).toHaveAttribute("type", "radio");
});

test("input groups move focus indication to the group while labels target native inputs", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const input = page.locator("#workspace-slug");
  await expect(page.locator("label[for='workspace-slug']")).toHaveText(
    "Workspace URL",
  );
  await expect(input).toBeVisible();

  await tabUntil(page, "#workspace-slug");
  const styles = await page.locator("[data-preview-input-group]").evaluate((el) => {
    const inputEl = el.querySelector("input");
    const groupStyle = getComputedStyle(el);
    const inputStyle = inputEl ? getComputedStyle(inputEl) : null;
    return {
      active: inputEl === document.activeElement,
      groupShadow: groupStyle.boxShadow,
      inputShadow: inputStyle?.boxShadow ?? "",
    };
  });

  expect(styles.active).toBe(true);
  expect(styles.groupShadow).not.toBe("none");
  expect(styles.inputShadow).toBe("none");
});

test("input groups reflect aria-invalid from server or framework validation", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const group = page.locator("[data-preview-group-invalid]");
  const styles = await group.evaluate((el) => {
    const input = el.querySelector("input");
    const groupStyle = getComputedStyle(el);
    return {
      invalid: input?.getAttribute("aria-invalid"),
      shadow: groupStyle.boxShadow,
      borderColor: groupStyle.borderColor,
    };
  });

  expect(styles.invalid).toBe("true");
  expect(styles.shadow).not.toBe("none");
  expect(styles.borderColor).not.toBe("ButtonBorder");
});
