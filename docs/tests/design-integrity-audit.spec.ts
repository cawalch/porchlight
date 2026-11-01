import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const previewDir = join(process.cwd(), "src/pages/preview");
const previewRoutes = readdirSync(previewDir)
  .filter((file) => file.endsWith(".astro"))
  .map((file) => file.replace(/\.astro$/, ""))
  .filter((route) => route !== "index");

test.describe("design system integrity & styleguide contract audits", () => {
  test("interactive controls never carry text-decoration: underline in default or active states", async ({
    page,
  }) => {
    // Audit core control pages
    const controlRoutes = [
      "panel-deck",
      "button",
      "tabs",
      "segmented",
      "nav",
      "chip",
      "split-button",
      "filter-builder",
      "app-cases",
      "app-audit-studio",
      "app-telemetry-cockpit",
      "app-siem",
    ];

    for (const route of controlRoutes) {
      await page.goto(`./preview/${route}`);
      const decorations = await page.evaluate(() => {
        const selector =
          ":is(.pl-c-button, .pl-c-tabs__tab, .pl-c-nav__item, .pl-c-segmented__item, .pl-c-chip, .pl-c-split-button__action, .pl-c-saved-views__button, .pl-c-segmented label)";
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.map((el) => {
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            cls: el.className,
            text: el.textContent?.trim().slice(0, 20),
            decoration: style.textDecorationLine,
          };
        });
      });

      for (const item of decorations) {
        expect(
          item.decoration,
          `${route} > ${item.cls} ("${item.text}") must not have underline`,
        ).toBe("none");
      }
    }
  });

  test("tables inside containers or fallbacks receive full Porchlight styling and alignment", async ({
    page,
  }) => {
    const tableRoutes = [
      "chart",
      "data-table",
      "app-cases",
      "app-reporting-dashboard",
      "app-dense",
    ];

    for (const route of tableRoutes) {
      await page.goto(`./preview/${route}`);
      const tables = await page.evaluate(() => {
        const tbls = Array.from(document.querySelectorAll(".pl-c-table"));
        return tbls.map((tbl) => {
          const style = getComputedStyle(tbl);
          const th = tbl.querySelector("th");
          const thStyle = th ? getComputedStyle(th) : null;
          const endCell = tbl.querySelector("[data-align='end']");
          const endStyle = endCell ? getComputedStyle(endCell) : null;
          const td = tbl.querySelector("td");
          const tdStyle = td ? getComputedStyle(td) : null;

          return {
            borderCollapse: style.borderCollapse,
            thPadding: thStyle?.paddingInlineStart ?? "0px",
            tdPadding: tdStyle?.paddingInlineStart ?? "0px",
            endAlign: endStyle?.textAlign ?? "none",
            hasEndCell: Boolean(endCell),
          };
        });
      });

      expect(
        tables.length,
        `${route} should have at least one table`,
      ).toBeGreaterThan(0);
      for (const t of tables) {
        expect(
          t.borderCollapse,
          `${route} table must use separate border collapse`,
        ).toBe("separate");
        expect(
          parseFloat(t.thPadding),
          `${route} table header must have non-zero padding`,
        ).toBeGreaterThan(0);
        expect(
          parseFloat(t.tdPadding),
          `${route} table cell must have non-zero padding`,
        ).toBeGreaterThan(0);
        if (t.hasEndCell) {
          expect(
            t.endAlign,
            `${route} [data-align='end'] must align to end or right`,
          ).toMatch(/^(?:end|right)$/);
        }
      }
    }
  });

  test("flush containers and nested children eliminate corner radius bleed and double borders", async ({
    page,
  }) => {
    const flushRoutes = [
      "app-cases",
      "app-siem",
      "app-dashboard",
      "app-audit-studio",
      "app-telemetry-cockpit",
    ];

    for (const route of flushRoutes) {
      await page.goto(`./preview/${route}`);
      const nestedRadii = await page.evaluate(() => {
        const results: Array<{
          selector: string;
          radius: string;
          borderBottom: string;
        }> = [];

        // Tables inside flush cards
        document
          .querySelectorAll(
            ":is(.pl-c-card[data-variant='flush'], .pl-c-card[data-flush]) .pl-c-table-wrap",
          )
          .forEach((el) => {
            const style = getComputedStyle(el);
            results.push({
              selector: "table-wrap in flush card",
              radius: style.borderRadius,
              borderBottom: style.borderBottomWidth,
            });
          });

        // Corner table cells inside flush cards
        document
          .querySelectorAll(
            ":is(.pl-c-card[data-variant='flush'], .pl-c-card[data-flush]) .pl-c-table thead tr:first-child th:first-child",
          )
          .forEach((el) => {
            const style = getComputedStyle(el);
            results.push({
              selector: "table corner cell in flush card",
              radius: style.borderTopLeftRadius,
              borderBottom: style.borderBottomWidth,
            });
          });

        return results;
      });

      for (const res of nestedRadii) {
        expect(
          parseFloat(res.radius),
          `${route} > ${res.selector} must have 0 border-radius`,
        ).toBe(0);
      }
    }
  });

  test("HTML [hidden] elements are strictly removed from rendering across preview pages", async ({
    page,
  }) => {
    // Check key dynamic pages that toggle or declare hidden
    const hiddenRoutes = [
      "index",
      "chart",
      "combobox",
      "command-palette",
      "app-asset-inventory",
    ];

    for (const route of hiddenRoutes) {
      await page.goto(`./preview/${route}`);
      const hiddenStates = await page.evaluate(() => {
        const hiddenEls = Array.from(document.querySelectorAll("[hidden]"));
        return hiddenEls.map((el) => ({
          tag: el.tagName,
          id: el.id,
          cls: el.className,
          display: getComputedStyle(el).display,
        }));
      });

      for (const item of hiddenStates) {
        expect(
          item.display,
          `${route} > ${item.tag}.${item.cls} with [hidden] must compute to display: none`,
        ).toBe("none");
      }
    }
  });

  test("all showcase app demos have zero involuntary horizontal overflow at desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const appRoutes = previewRoutes.filter((r) => r.startsWith("app-"));
    for (const route of appRoutes) {
      await page.goto(`./preview/${route}`);
      const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });

      expect(
        overflow,
        `${route} should not have horizontal page overflow at 1440px`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
