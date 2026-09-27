import { test, expect } from "@playwright/test";

const route = "./preview/app-record-detail";
const current = ".pl-c-section-nav__link:target-current";

test("record links support keyboard fragments and actual scrolling through the last short section", async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.locator(current)).toHaveText("Overview");
  const activity = page
    .getByRole("navigation", { name: "Record sections" })
    .getByRole("link", { name: "Activity" });
  await activity.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#record-activity$/);
  await expect(page.locator("#record-activity")).toBeFocused();
  await expect(page.locator(current)).toHaveText("Activity");
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(page.locator(current)).toHaveText("Billing");
  await expect(page).toHaveURL(/#record-activity$/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator(current)).toHaveText("Overview");
  // Current styling must not turn the contents into a tab widget or hide regions.
  await expect(
    page.getByRole("region", { name: /Overview|Activity|Permissions|Billing/ }),
  ).toHaveCount(4);
  await expect(page.getByRole("tab")).toHaveCount(0);
});

test("nested scroll targets update independently of document scroll", async ({
  page,
}) => {
  await page.goto("./preview/section-nav");
  const region = page.getByRole("region", { name: "Example record" });
  await region.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(page.locator(current)).toHaveText("Notes");
  await region.evaluate((el) => el.scrollTo(0, 0));
  await expect(page.locator(current)).toHaveText("Summary");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page.locator(current)).toHaveText("History");
});

for (const density of ["compact", "comfortable", "touch"]) {
  test(`mobile ${density} RTL layout keeps navigation above well-spaced sections`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.locator("html").evaluate((el, value) => {
      el.setAttribute("dir", "rtl");
      el.setAttribute("data-pl-density", value);
      el.setAttribute("data-pl-theme", value === "compact" ? "light" : "dark");
    }, density);
    await expect(page.locator(".record-nav")).toHaveCSS("position", "static");
    const geometry = await page.evaluate(() => {
      const nav = document
        .querySelector(".record-nav")!
        .getBoundingClientRect();
      const cards = [...document.querySelectorAll(".record-section")].map(
        (el) => el.getBoundingClientRect(),
      );
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        gap: cards[0].top - nav.bottom,
        cardGaps: cards.slice(1).map((card, i) => card.top - cards[i].bottom),
      };
    });
    expect(geometry.overflow).toBe(false);
    expect(geometry.gap).toBeGreaterThanOrEqual(24);
    expect(Math.min(...geometry.cardGaps)).toBeGreaterThanOrEqual(24);
    await page
      .getByRole("navigation", { name: "Record sections" })
      .getByRole("link", { name: "Activity" })
      .click();
    await expect(page.locator(current)).toHaveText("Activity");
    const clearance = await page
      .locator("#record-activity")
      .evaluate(
        (el) =>
          el.getBoundingClientRect().top -
          document.querySelector(".site-header")!.getBoundingClientRect()
            .bottom,
      );
    expect(clearance).toBeGreaterThanOrEqual(15);
  });
}

test("gallery transitions remeasure docs chrome; fallback links still navigate", async ({
  page,
}) => {
  await page.goto("./preview/");
  await page
    .locator('a.preview-card__main[href$="/preview/app-record-detail"]')
    .click();
  await expect
    .poll(() =>
      page
        .locator(".record-shell")
        .evaluate((el) => el.style.getPropertyValue("--record-docs-header")),
    )
    .not.toBe("");
  await page.addStyleTag({
    content: ".pl-c-section-nav { scroll-target-group: none; }",
  });
  await page
    .getByRole("navigation", { name: "Record sections" })
    .getByRole("link", { name: "Billing" })
    .click();
  await expect(page).toHaveURL(/#record-billing$/);
  await expect(page.locator("#record-billing")).toBeFocused();
});

test("forced-colors current link retains a non-color cue", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto(route);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(page.locator(current)).toHaveText("Billing");
  await expect(page.locator(current)).toHaveCSS(
    "text-decoration-line",
    "underline",
  );
});

test("current links preserve native link roles in the accessibility tree", async ({
  page,
}) => {
  await page.goto(route);
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await expect(page.locator(current)).toHaveText("Billing");
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const links = nodes.filter(
    (node) =>
      node.role?.value === "link" &&
      ["Overview", "Activity", "Permissions", "Billing"].includes(
        node.name?.value,
      ),
  );
  expect(links).toHaveLength(4);
  expect(links.every((node) => !node.ignored)).toBe(true);
  await cdp.detach();
});
