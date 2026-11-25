import { expect, test } from "@playwright/test";

test(".pl-c-swatch has base dimensions and border without page-level CSS", async ({
  page,
}) => {
  await page.goto("./preview/utilities");
  const rect = await page.evaluate(() => {
    const el = document.createElement("span");
    el.className = "pl-c-swatch";
    el.setAttribute("data-color", "oklch(58% 0.18 260deg)");
    document.body.append(el);
    const box = el.getBoundingClientRect();
    const border = getComputedStyle(el).borderTopStyle;
    el.remove();
    return { width: box.width, height: box.height, border };
  });
  expect(rect.width).toBeGreaterThan(0);
  expect(rect.height).toBeGreaterThan(0);
  expect(rect.border).toBe("solid");
});

test(".pl-u-visually-hidden focus reveal sets overflow: visible", async ({
  page,
}) => {
  await page.goto("./preview/utilities");
  const state = await page.evaluate(() => {
    const link = document.createElement("a");
    link.className = "pl-u-visually-hidden";
    link.href = "#main";
    link.textContent = "Skip to content";
    document.body.append(link);
    link.focus();
    const cs = getComputedStyle(link);
    const result = {
      position: cs.position,
      overflow: cs.overflow,
      clipPath: cs.clipPath,
    };
    link.remove();
    return result;
  });
  expect(state.position).toBe("static");
  expect(state.overflow).toBe("visible");
  expect(state.clipPath).toBe("none");
});

test(".pl-u-transition-scope does not clip overflow unless opted in", async ({
  page,
}) => {
  await page.goto("./preview/utilities");
  const overflows = await page.evaluate(() => {
    const plain = document.createElement("div");
    plain.className = "pl-u-transition-scope";
    const clipped = document.createElement("div");
    clipped.className = "pl-u-transition-scope";
    clipped.setAttribute("data-pl-transition-scope", "clip");
    document.body.append(plain, clipped);
    const result = {
      plain: getComputedStyle(plain).overflow,
      clipped: getComputedStyle(clipped).overflow,
    };
    plain.remove();
    clipped.remove();
    return result;
  });
  expect(overflows.plain).not.toBe("clip");
  expect(overflows.clipped).toBe("clip");
});

test("forced-colors sets --pl-opacity-disabled to 1 and disables with GrayText", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("./preview/field");
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      opacity: cs.getPropertyValue("--pl-opacity-disabled").trim(),
      disabledText: cs.getPropertyValue("--pl-color-text-disabled").trim(),
    };
  });
  expect(tokens.opacity).toBe("1");
  expect(tokens.disabledText.toLowerCase()).toBe("graytext");
});
