import { test, expect } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`docs searches receive field styling (${theme})`, async ({ page }) => {
    for (const [route, selector] of [
      ["./components/button", "#docs-command-filter"],
      ["./preview/", "[data-preview-filter]"],
    ]) {
      await page.goto(route);
      await page.evaluate((value) => {
        document.documentElement.dataset.plTheme = value;
      }, theme);
      if (selector === "#docs-command-filter") {
        await page.locator("[data-docs-command-open]").click();
      }
      const input = page.locator(selector);
      await expect(input).toBeVisible();
      const style = await input.evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          appearance: cs.appearance,
          border: cs.borderTopStyle,
          radius: parseFloat(cs.borderTopLeftRadius),
          background: cs.backgroundColor,
        };
      });
      expect(style.appearance).toBe("none");
      expect(style.border).toBe("solid");
      expect(style.radius).toBeGreaterThan(0);
      expect(style.background).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test(`standalone and wrapped disabled fields retain affordance (${theme})`, async ({
    page,
  }) => {
    await page.goto("./preview/field");
    await page.evaluate((theme) => {
      document.documentElement.dataset.plTheme = theme;
      const fixture = document.createElement("section");
      fixture.id = "standalone-field-regression";
      fixture.innerHTML = `
        <label>Enabled<input id="standalone-enabled" class="pl-c-field__control"></label>
        <label>Disabled<input id="standalone-disabled" class="pl-c-field__control" disabled></label>
        <label class="pl-c-field">Wrapped<input id="wrapped-disabled" class="pl-c-field__control" disabled></label>`;
      document.body.append(fixture);
    }, theme);
    const styles = await page.evaluate(() => {
      const read = (id: string) => {
        const el = document.getElementById(id)!;
        const cs = getComputedStyle(el);
        return {
          opacity:
            Number(cs.opacity) *
            Number(getComputedStyle(el.parentElement!).opacity),
          cursor: cs.cursor,
          border: cs.borderTopStyle,
        };
      };
      return {
        enabled: read("standalone-enabled"),
        disabled: read("standalone-disabled"),
        wrapped: read("wrapped-disabled"),
      };
    });
    expect(styles.disabled.border).toBe("solid");
    expect(styles.disabled.opacity).toBeLessThan(styles.enabled.opacity);
    expect(styles.disabled.opacity).toBeGreaterThan(0);
    expect(styles.disabled.cursor).toBe("not-allowed");
    expect(styles.wrapped.opacity).toBe(styles.disabled.opacity);
  });

  test(`docs search retains an outline in forced colors (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("./components/button");
    await page.evaluate((theme) => {
      document.documentElement.dataset.plTheme = theme;
    }, theme);
    await page.locator("[data-docs-command-open]").click();
    const input = page.locator("#docs-command-filter");
    await input.fill("field");
    await expect(input).toBeFocused();
    await input.press("ArrowRight");
    const focus = await input.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        active: matchMedia("(forced-colors: active)").matches,
        visible: el.matches(":focus-visible"),
        style: cs.outlineStyle,
        width: parseFloat(cs.outlineWidth),
      };
    });
    expect(focus.active).toBe(true);
    expect(focus.visible).toBe(true);
    expect(focus.style).toBe("solid");
    expect(focus.width).toBeGreaterThanOrEqual(2);
  });
}
