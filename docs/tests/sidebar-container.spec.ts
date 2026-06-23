import { test, expect } from "@playwright/test";

/**
 * .l-sidebar container-query guard.
 *
 * .l-sidebar does NOT declare container-type itself (an element can't query
 * its own size). It defaults to two columns and collapses to one only when a
 * nearest ANCESTOR container is narrower than 48rem. This pins both halves of
 * that contract so the fix from this PR can't regress.
 */

test("sidebar stays two-column without a container ancestor", async ({
  page,
}) => {
  await page.goto("./preview/layout");
  // Bare .l-sidebar in the open body (no container ancestor): default layout.
  const cols = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "l-sidebar";
    el.style.width = "20rem"; // narrow, but no container → query never matches
    document.body.append(el);
    const grid = getComputedStyle(el).gridTemplateColumns;
    el.remove();
    return grid;
  });
  // Two tracks (sidebar + main), not a single 1fr.
  expect(cols.split(" ").length).toBe(2);
});

test("sidebar collapses to one column inside a narrow container", async ({
  page,
}) => {
  await page.goto("./preview/layout");
  const cols = await page.evaluate(() => {
    const wrap = document.createElement("div");
    wrap.style.containerType = "inline-size";
    wrap.style.width = "30rem"; // below the 48rem breakpoint
    const sb = document.createElement("div");
    sb.className = "l-sidebar";
    wrap.append(sb);
    document.body.append(wrap);
    const grid = getComputedStyle(sb).gridTemplateColumns;
    wrap.remove();
    return grid;
  });
  // Collapsed = a single track. (1fr resolves to its used px value here because
  // the container has a definite size; assert track count, not the literal.)
  expect(cols.trim().split(/\s+/).length).toBe(1);
});
