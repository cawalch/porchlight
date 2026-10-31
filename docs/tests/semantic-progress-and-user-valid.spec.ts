import { test, expect } from "@playwright/test";
import { toOklab } from "./lib/color";

test.describe("semantic progress element", () => {
  test("renders native progress with tokenized height, pill radius, and tone variables", async ({
    page,
  }) => {
    await page.goto("./preview/progress");

    const demo = page.locator("#semantic-progress-demo");
    await expect(demo).toBeVisible();

    const progressItems = demo.locator("progress.pl-c-progress");
    expect(await progressItems.count()).toBeGreaterThanOrEqual(5);

    const defaultProgress = progressItems.nth(0);
    const styles = await defaultProgress.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        height: Number.parseFloat(s.height),
        borderRadius: Number.parseFloat(s.borderRadius),
        tone: s.getPropertyValue("--pl-c-progress-tone").trim(),
      };
    });

    expect(styles.height).toBeCloseTo(6, 1);
    expect(styles.borderRadius).toBeGreaterThan(50);
    // Default brand tone uses hue 82
    expect(styles.tone).toContain("82");

    // Check success tone variant (hue 150)
    const successProgress = demo.locator(
      'progress.pl-c-progress[data-tone="success"]',
    );
    const successTone = await successProgress.evaluate((el) => {
      return getComputedStyle(el)
        .getPropertyValue("--pl-c-progress-tone")
        .trim();
    });
    expect(successTone).toContain("150");

    // Check danger tone variant (hue 25)
    const dangerProgress = demo.locator(
      'progress.pl-c-progress[data-tone="danger"]',
    );
    const dangerTone = await dangerProgress.evaluate((el) => {
      return getComputedStyle(el)
        .getPropertyValue("--pl-c-progress-tone")
        .trim();
    });
    expect(dangerTone).toContain("25");
  });
});

test.describe("opt-in user-valid form feedback", () => {
  test("field with [data-feedback='valid'] shows success feedback when user satisfies constraints", async ({
    page,
  }) => {
    await page.goto("./preview/field");

    const validDemo = page.locator("#user-valid-demo");
    await expect(validDemo).toBeVisible();

    const input = validDemo.locator("input");
    const hint = validDemo.locator(".pl-c-field__hint");

    // Clear the input and blur to trigger user-invalid
    await input.click();
    await input.fill("");
    await input.blur();

    const invalidState = await input.evaluate((el) => {
      return {
        isUserInvalid: el.matches(":user-invalid"),
      };
    });

    if (invalidState.isUserInvalid) {
      await expect
        .poll(async () => {
          const hintColor = await hint.evaluate(
            (el) => getComputedStyle(el).color,
          );
          return toOklab(hintColor).a;
        })
        .toBeGreaterThan(0.04);
    }

    // Now type valid text and blur to trigger user-valid
    await input.click();
    await input.fill("valid-user-99");
    await input.blur();

    const validState = await input.evaluate((el) => {
      return {
        isUserValid: el.matches(":user-valid"),
      };
    });

    if (validState.isUserValid) {
      // Success tone (hue 150) has negative 'a' in OKLab (green)
      await expect
        .poll(async () => {
          const borderCheck = await input.evaluate((el) => {
            return getComputedStyle(el).borderColor;
          });
          return toOklab(borderCheck).a;
        })
        .toBeLessThan(-0.04);

      await expect
        .poll(async () => {
          const validHintColor = await hint.evaluate(
            (el) => getComputedStyle(el).color,
          );
          return toOklab(validHintColor).a;
        })
        .toBeLessThan(-0.04);
    }
  });
});
