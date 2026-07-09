import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = dirname(fileURLToPath(import.meta.url));
const componentCssFiles = [
  resolve(testDir, "../../packages/porchlight/src/06-components/field.css"),
  resolve(testDir, "../../packages/porchlight/src/06-components/form.css"),
];

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

function ringColor(boxShadow: string): string | null {
  if (!boxShadow || boxShadow === "none") return null;
  const ok = boxShadow.match(/oklch\([^)]+\)|oklab\([^)]+\)|rgba?\([^)]+\)/);
  return ok ? ok[0] : null;
}

async function resolveTokenColor(
  page: import("@playwright/test").Page,
  token: string,
) {
  return page.evaluate((tokenName) => {
    const probe = document.createElement("div");
    probe.style.color = `var(${tokenName})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

test("field and form CSS stay framework agnostic", async () => {
  const css = componentCssFiles
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  expect(css).toContain('.pl-c-field__hint[data-tone="warning"]');
  expect(css).toContain('.pl-c-choice-group__hint[data-tone="warning"]');
  expect(css).not.toMatch(
    /\[(?:hx-|x-|v-|data-reactroot|data-reactid|data-v-)[^\]]*\]/,
  );
});

test("field messages support required markers and explicit tones", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const required = page.locator("[data-preview-required]");
  await expect(required.locator(".pl-c-field__required")).toHaveText("*");
  await expect(required.locator(".pl-c-field__control")).toHaveAttribute(
    "required",
    "",
  );
  await expect(required.locator(".pl-c-field__control")).toHaveAttribute(
    "aria-describedby",
    "workspace-name-help",
  );

  const warningText = await resolveTokenColor(page, "--pl-color-warning-text");
  const successText = await resolveTokenColor(page, "--pl-color-success-text");
  const dangerText = await resolveTokenColor(page, "--pl-color-danger-text");

  await expect(
    page.locator('.pl-c-field__hint[data-tone="warning"]').first(),
  ).toHaveCSS("color", warningText);
  await expect(
    page.locator('.pl-c-field__hint[data-tone="success"]').first(),
  ).toHaveCSS("color", successText);
  await expect(
    page.locator('.pl-c-field__hint[data-tone="danger"]').first(),
  ).toHaveCSS("color", dangerText);

  const messages = page.locator(
    "[data-preview-messages] .pl-c-field__messages",
  );
  await expect(messages.locator(".pl-c-field__hint")).toHaveCount(3);
  const layout = await messages.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      display: style.display,
      rowGap: parseFloat(style.rowGap),
      overflow: el.scrollWidth > el.clientWidth + 1,
    };
  });
  expect(layout.display).toBe("grid");
  expect(layout.rowGap).toBeGreaterThan(0);
  expect(layout.overflow).toBe(false);
});

test("native and ARIA validity states remain standard HTML driven", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const neutral = page.locator(
    "[data-preview-aria-valid] .pl-c-field__control",
  );
  const neutralStyles = await neutral.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      invalid: el.getAttribute("aria-invalid"),
      shadow: style.boxShadow,
      borderColor: style.borderColor,
    };
  });
  expect(neutralStyles.invalid).toBe("false");
  expect(neutralStyles.shadow).toBe("none");
  expect(neutralStyles.borderColor).not.toBe(
    await resolveTokenColor(page, "--pl-color-danger"),
  );

  const urlField = page.locator(".pl-c-field__control[type='url']");
  await urlField.fill("not-a-url");
  await urlField.blur();
  await page.waitForTimeout(300);

  const hintColor = await urlField.evaluate((el) => {
    const hint = el.closest(".pl-c-field")?.querySelector(".pl-c-field__hint");
    return hint instanceof HTMLElement ? getComputedStyle(hint).color : null;
  });
  expect(hintColor).toBe(
    await resolveTokenColor(page, "--pl-color-danger-text"),
  );
});

test("framework-neutral fragments can be replaced and retoggled", async ({
  page,
}) => {
  await page.goto("./preview/field");

  await page.locator("[data-preview-framework-contract]").evaluate((el) => {
    el.outerHTML = `
      <div class="pl-c-field" data-preview-framework-contract>
        <label class="pl-c-field__label" for="fragment-email">Fragment email</label>
        <input
          id="fragment-email"
          class="pl-c-field__control"
          name="email"
          type="email"
          value="taken@example.com"
          aria-invalid="true"
          aria-describedby="fragment-email-error"
        />
        <span
          class="pl-c-field__hint"
          id="fragment-email-error"
          data-tone="danger"
          role="alert"
        >That email is already invited.</span>
      </div>
    `;
  });

  const fragment = page.locator("[data-preview-framework-contract]");
  const dangerState = await fragment.evaluate((el) => {
    const input = el.querySelector(".pl-c-field__control");
    const hint = el.querySelector(".pl-c-field__hint");
    if (!(input instanceof HTMLElement) || !(hint instanceof HTMLElement)) {
      return null;
    }

    return {
      invalid: input.getAttribute("aria-invalid"),
      inputShadow: getComputedStyle(input).boxShadow,
      hintColor: getComputedStyle(hint).color,
    };
  });
  expect(dangerState).not.toBeNull();
  expect(dangerState!.invalid).toBe("true");
  expect(dangerState!.inputShadow).not.toBe("none");
  expect(dangerState!.hintColor).toBe(
    await resolveTokenColor(page, "--pl-color-danger-text"),
  );

  await fragment.locator(".pl-c-field__control").evaluate((el) => {
    el.setAttribute("aria-invalid", "false");
    el.setAttribute("value", "new@example.com");
  });
  await fragment.locator(".pl-c-field__hint").evaluate((el) => {
    el.setAttribute("data-tone", "warning");
    el.removeAttribute("role");
    el.textContent = "Changing this address sends a confirmation email.";
  });
  await page.waitForTimeout(300);

  const warningState = await fragment.evaluate((el) => {
    const input = el.querySelector(".pl-c-field__control");
    const hint = el.querySelector(".pl-c-field__hint");
    if (!(input instanceof HTMLElement) || !(hint instanceof HTMLElement)) {
      return null;
    }

    return {
      invalid: input.getAttribute("aria-invalid"),
      inputShadow: getComputedStyle(input).boxShadow,
      hintColor: getComputedStyle(hint).color,
    };
  });
  expect(warningState).not.toBeNull();
  expect(warningState!.invalid).toBe("false");
  expect(warningState!.inputShadow).toBe("none");
  expect(warningState!.hintColor).toBe(
    await resolveTokenColor(page, "--pl-color-warning-text"),
  );
});

test("inline fields align on desktop and stack without overflow on mobile", async ({
  page,
}) => {
  await page.goto("./preview/field");

  const field = page.locator("[data-preview-inline]");
  const label = field.locator(".pl-c-field__label");
  const control = field.locator(".pl-c-field__control");

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
  const mobile = await mobileField.evaluate((field) => {
    const label = field.querySelector(".pl-c-field__label");
    const control = field.querySelector(".pl-c-field__control");
    if (!(label instanceof HTMLElement) || !(control instanceof HTMLElement)) {
      return null;
    }

    const fieldRect = field.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const tolerance = 1;

    return {
      label: { y: labelRect.y },
      control: { y: controlRect.y },
      overflow:
        field.scrollWidth > field.clientWidth + tolerance ||
        controlRect.left < fieldRect.left - tolerance ||
        controlRect.right > fieldRect.right + tolerance ||
        controlRect.right > window.innerWidth + tolerance,
    };
  });
  if (mobile === null) {
    throw new Error("Inline field preview markup was not found");
  }

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
    const field = toolbar.querySelector(".pl-c-field");
    const input = toolbar.querySelector(".pl-c-field__control");
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
    .locator("[data-preview-form-grid] .pl-c-form__grid > *")
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
    .locator("[data-preview-form-grid] .pl-c-form__grid > *")
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

test("choice groups keep native checkbox and radio controls", async ({
  page,
}) => {
  await page.goto("./preview/form");

  const group = page.locator("[data-preview-choice-group]");
  await expect(group.locator("legend")).toHaveText("Email updates");

  const first = group.locator(".pl-c-choice__input").first();
  await expect(first).toHaveAttribute("type", "checkbox");
  await expect(first).toBeChecked();
  await expect(group.locator(".pl-c-choice__input:disabled")).toBeVisible();
  await expect(group.locator(".pl-c-choice-group__hint")).toHaveCSS(
    "color",
    await resolveTokenColor(page, "--pl-color-warning-text"),
  );

  await tabUntil(page, "[data-preview-choice-group] .pl-c-choice__input");
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

test("choice group hints support grouped invalid state", async ({ page }) => {
  await page.goto("./preview/form");

  const group = page.locator("[data-preview-choice-invalid]");
  await expect(group).toHaveAttribute("aria-invalid", "true");
  await expect(group).toHaveAttribute(
    "aria-describedby",
    "review-routing-error",
  );
  await expect(group.locator(".pl-c-choice-group__hint")).toHaveCSS(
    "color",
    await resolveTokenColor(page, "--pl-color-danger-text"),
  );
  await expect(group.locator(".pl-c-choice__input")).toHaveCount(2);
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
  const styles = await page
    .locator("[data-preview-input-group]")
    .evaluate((el) => {
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

for (const theme of ["light", "dark"] as const) {
  test(`focused invalid input groups use the standard focus ring in ${theme}`, async ({
    page,
  }) => {
    await page.goto("./preview/field");
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-pl-theme", value);
    }, theme);

    await tabUntil(page, "#workspace-slug");
    await page.waitForTimeout(300);
    const focusColor = ringColor(
      await page
        .locator("[data-preview-input-group]")
        .evaluate((el) => getComputedStyle(el).boxShadow),
    );
    expect(
      focusColor,
      "baseline input group focus ring must resolve",
    ).not.toBeNull();

    const invalid = page.locator("#server-slug");
    await invalid.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await page.waitForTimeout(300);

    const invalidStyles = await page
      .locator("[data-preview-group-invalid]")
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          ring: style.boxShadow,
          borderColor: style.borderColor,
        };
      });
    expect(ringColor(invalidStyles.ring)).toBe(focusColor);

    const dangerBorder = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.color = "var(--pl-color-danger)";
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(invalidStyles.borderColor).toBe(dangerBorder);
  });
}
