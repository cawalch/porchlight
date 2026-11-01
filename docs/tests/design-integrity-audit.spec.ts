import { expect, test } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const previewDir = join(process.cwd(), "src/pages/preview");
const previewRoutes = readdirSync(previewDir)
  .filter((file) => file.endsWith(".astro"))
  .map((file) => file.replace(/\.astro$/, ""));

test.describe("decoupled design system integrity & styleguide contract audits", () => {
  test("interactive controls across all preview pages never carry text-decoration: underline", async ({
    page,
  }) => {
    for (const route of previewRoutes) {
      await page.goto(`./preview/${route === "index" ? "" : route}`);
      const decorations = await page.evaluate(() => {
        const selector = `
          button, 
          [role="button"], 
          [role="tab"], 
          [role="menuitem"],
          a[class*="button"], 
          a[class*="nav"], 
          a[class*="tab"], 
          a[class*="item"],
          a[class*="chip"],
          .pl-c-button, 
          .pl-c-nav__item, 
          .pl-c-tabs__tab, 
          .pl-c-segmented__item, 
          .pl-c-chip,
          .pl-c-section-nav__link,
          .pl-c-split-button__action, 
          .pl-c-saved-views__button, 
          .pl-c-panel-deck__panel::scroll-marker
        `;
        const elements = Array.from(document.querySelectorAll(selector));
        return elements.map((el) => {
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            cls: el.className,
            text: el.textContent?.trim().slice(0, 25),
            decoration: style.textDecorationLine,
          };
        });
      });

      for (const item of decorations) {
        expect(
          item.decoration,
          `${route} > ${item.tag}.${item.cls} ("${item.text}") must not have underline`,
        ).toBe("none");
      }
    }
  });

  test("all rendered tables across documentation receive Porchlight table styling", async ({
    page,
  }) => {
    const tableAuditRoutes = previewRoutes.filter((route) => route !== "reset");

    for (const route of tableAuditRoutes) {
      await page.goto(`./preview/${route === "index" ? "" : route}`);
      const tables = await page.evaluate(() => {
        const tbls = Array.from(document.querySelectorAll("table"));
        return tbls.map((tbl) => {
          const style = getComputedStyle(tbl);
          const th = tbl.querySelector("th");
          const thStyle = th ? getComputedStyle(th) : null;
          const endCell = tbl.querySelector("[data-align='end']");
          const endStyle = endCell ? getComputedStyle(endCell) : null;
          const td = tbl.querySelector("td");
          const tdStyle = td ? getComputedStyle(td) : null;

          return {
            cls: tbl.className,
            parentCls: tbl.parentElement?.className,
            borderCollapse: style.borderCollapse,
            thPadding: thStyle?.paddingInlineStart ?? "0px",
            tdPadding: tdStyle?.paddingInlineStart ?? "0px",
            endAlign: endStyle?.textAlign ?? "none",
            hasEndCell: Boolean(endCell),
          };
        });
      });

      for (const t of tables) {
        expect(
          t.borderCollapse,
          `${route} table.${t.cls} inside ${t.parentCls} must use separate border collapse`,
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
    const flushRoutes = previewRoutes.filter(
      (r) => r.startsWith("app-") || ["split-pane", "card"].includes(r),
    );

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

  test("headings, table headers, and data labels never clip text silently without ellipsis", async ({
    page,
  }) => {
    const appRoutes = previewRoutes.filter((r) => r.startsWith("app-"));

    for (const width of [1440, 1024]) {
      await page.setViewportSize({ width, height: 900 });

      for (const route of appRoutes) {
        await page.goto(`./preview/${route}`);
        const clippings = await page.evaluate(() => {
          const textNodes = Array.from(
            document.querySelectorAll(
              "h1:not(.pl-u-sr-only), h2:not(.pl-u-sr-only), h3:not(.pl-u-sr-only), h4:not(.pl-u-sr-only), .pl-c-page-header__title, .pl-c-card__title, .pl-c-stat__label",
            ),
          );

          return textNodes
            .filter((el) => {
              const overflow = el.scrollWidth - el.clientWidth;
              if (overflow <= 1) return false;
              const s = getComputedStyle(el);
              return (
                (s.overflow === "hidden" ||
                  s.overflowX === "hidden" ||
                  s.overflow === "clip" ||
                  s.overflowX === "clip") &&
                s.textOverflow !== "ellipsis"
              );
            })
            .map((el) => ({
              tag: el.tagName,
              cls: el.className,
              text: el.textContent?.trim().slice(0, 30),
              overflow: el.scrollWidth - el.clientWidth,
            }));
        });

        for (const item of clippings) {
          expect(
            item.overflow,
            `${route} > ${item.tag}.${item.cls} ("${item.text}") clipped text silently at ${width}px without text-overflow: ellipsis`,
          ).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test("concentric corner radius geometry formula is obeyed without corner bulging", async ({
    page,
  }) => {
    // Audit core application showcases for concentric corner curvature
    const showcaseRoutes = previewRoutes.filter((r) => r.startsWith("app-"));

    for (const route of showcaseRoutes) {
      await page.goto(`./preview/${route}`);
      const clashes = await page.evaluate(() => {
        const issues: Array<{
          child: string;
          childRadius: number;
          parent: string;
          parentRadius: number;
          padding: number;
        }> = [];

        // Check containers that have a defined radius
        const containers = Array.from(
          document.querySelectorAll(
            ":is(.pl-c-card, .pl-c-panel-deck, .pl-c-split-pane, .pl-c-chart, .pl-c-dialog)",
          ),
        );

        for (const container of containers) {
          const cStyle = getComputedStyle(container);
          const parentRadius = parseFloat(cStyle.borderRadius) || 0;
          if (parentRadius <= 2) continue;

          const padding = parseFloat(cStyle.paddingTop) || 0;
          const isFlush =
            container.matches(":is([data-variant='flush'], [data-flush])") ||
            padding === 0;

          if (isFlush) {
            // Find direct or immediate nested block children (excluding pills/avatars)
            const children = Array.from(
              container.querySelectorAll(
                ":scope > :is(.pl-c-card__body, .pl-c-table-wrap, .pl-c-code-block, .pl-c-audit-stream, .pl-c-chart__plot, div, section)",
              ),
            );

            for (const child of children) {
              const chStyle = getComputedStyle(child);
              const childRadius = parseFloat(chStyle.borderRadius) || 0;

              // Pills and circular icons (radius >= 999px) are intentionally capsule-shaped
              if (childRadius >= 999) continue;

              // In flush mode, nested children must have 0px radius to avoid corner clipping
              if (childRadius > 0) {
                issues.push({
                  child: `${child.tagName}.${child.className}`,
                  childRadius,
                  parent: `${container.tagName}.${container.className}`,
                  parentRadius,
                  padding,
                });
              }
            }
          }
        }

        return issues;
      });

      for (const clash of clashes) {
        expect(
          clash.childRadius,
          `${route} > ${clash.child} (radius ${clash.childRadius}px) inside ${clash.parent} (padding ${clash.padding}px) violates flush 0px radius contract`,
        ).toBe(0);
      }
    }
  });

  test("HTML [hidden] elements are strictly removed from rendering across preview pages", async ({
    page,
  }) => {
    for (const route of previewRoutes) {
      await page.goto(`./preview/${route === "index" ? "" : route}`);
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

  test("all showcase app demos have zero involuntary horizontal overflow at desktop and tablet", async ({
    page,
  }) => {
    const appRoutes = previewRoutes.filter((r) => r.startsWith("app-"));

    for (const width of [1440, 1024]) {
      await page.setViewportSize({ width, height: 900 });

      for (const route of appRoutes) {
        await page.goto(`./preview/${route}`);
        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          return root.scrollWidth - root.clientWidth;
        });

        expect(
          overflow,
          `${route} should not have horizontal page overflow at ${width}px`,
        ).toBeLessThanOrEqual(1);
      }
    }
  });
});
