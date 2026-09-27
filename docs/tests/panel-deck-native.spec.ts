import { expect, test } from "@playwright/test";

test("Chrome stable provides native panel selection, keyboard focus, and AX isolation", async ({
  page,
  browser,
}) => {
  expect(Number.parseInt(browser.version(), 10)).toBeGreaterThanOrEqual(154);
  await page.goto("./preview/panel-deck");
  expect(
    await page.evaluate(() => CSS.supports("scroll-marker-group: before tabs")),
    "Native coverage requires Chrome stable 154+; do not skip unsupported runs",
  ).toBe(true);
  const cdp = await page.context().newCDPSession(page);
  const accessibility = async () => {
    const { nodes } = await cdp.send("Accessibility.getFullAXTree");
    return nodes.filter((node) => !node.ignored);
  };
  const selected = async () =>
    (await accessibility())
      .filter((node) => node.role?.value === "tab")
      .slice(0, 3)
      .filter((node) =>
        node.properties?.some((p) => p.name === "selected" && p.value.value),
      )
      .map((node) => node.name?.value);

  const aligned = (index: number) =>
    page.locator("#workspace-deck").evaluate((deck, index) => {
      const panel = deck.children[index].getBoundingClientRect();
      const viewport = deck.getBoundingClientRect();
      return (
        Math.abs(panel.left - viewport.left) < 1 &&
        Math.abs(panel.right - viewport.right) < 1
      );
    }, index);
  await expect.poll(selected).toEqual(["Activity"]);
  await expect.poll(() => aligned(0)).toBe(true);
  await page.locator("#deck-start").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  await expect.poll(selected).toEqual(["Reports"]);
  await expect.poll(() => aligned(1)).toBe(true);
  const tree = await accessibility();
  expect(tree.some((node) => node.name?.value === "Read reports")).toBe(true);
  expect(tree.some((node) => node.name?.value === "Review activity")).toBe(
    false,
  );
  expect(tree.some((node) => node.name?.value === "Browse resources")).toBe(
    false,
  );
  expect(
    tree.some(
      (node) =>
        node.role?.value === "tab" &&
        node.name?.value === "Reports" &&
        node.properties?.some((p) => p.name === "focused" && p.value.value),
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Read reports" })).toBeFocused();
});

test("native marker bounds stay between neighboring content and panels at narrow widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await page.goto("./preview/panel-deck");
  await page
    .locator("#workspace-deck > section")
    .first()
    .evaluate((panel) => {
      panel.setAttribute(
        "data-label",
        "Recent workspace activity and upcoming organization-wide changes",
      );
    });
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: ".pl-c-panel-deck:not(:dir(rtl))",
  });
  for (const nodeId of nodeIds) {
    const { node } = await cdp.send("DOM.describeNode", { nodeId, depth: 2 });
    const group = node.pseudoElements!.find(
      (pseudo) => pseudo.pseudoType === "scroll-marker-group",
    )!;
    const groupBox = (
      await cdp.send("DOM.getBoxModel", { backendNodeId: group.backendNodeId })
    ).model.border;
    const panelBox = (await cdp.send("DOM.getBoxModel", { nodeId })).model
      .border;
    const markerBoxes: number[][] = [];
    for (const panel of node.children!.filter(
      (child) => child.nodeName === "SECTION",
    )) {
      const marker = panel.pseudoElements!.find(
        (pseudo) => pseudo.pseudoType === "scroll-marker",
      )!;
      const markerBox = (
        await cdp.send("DOM.getBoxModel", {
          backendNodeId: marker.backendNodeId,
        })
      ).model.border;
      markerBoxes.push(markerBox);
      expect(markerBox[1]).toBeGreaterThanOrEqual(groupBox[1]);
      expect(markerBox[5]).toBeLessThanOrEqual(groupBox[5]);
      expect(markerBox[5] + 8).toBeLessThanOrEqual(panelBox[1]);
    }
    markerBoxes.sort((a, b) => a[0] - b[0]);
    for (let index = 1; index < markerBoxes.length; index++) {
      expect(
        markerBoxes[index][0] - markerBoxes[index - 1][2],
      ).toBeGreaterThanOrEqual(4);
    }
  }
  const modes = await page
    .locator(".pl-c-panel-deck:not(:dir(rtl))")
    .evaluateAll((decks) =>
      decks.map((deck) => {
        const group = getComputedStyle(deck, "::scroll-marker-group");
        const marker = getComputedStyle(
          deck.firstElementChild!,
          "::scroll-marker",
        );
        const previous = deck.previousElementSibling!.getBoundingClientRect();
        const content = deck.getBoundingClientRect();
        return {
          height: parseFloat(group.blockSize),
          marker: parseFloat(marker.blockSize),
          space: content.top - previous.bottom,
          behavior: getComputedStyle(deck).scrollBehavior,
        };
      }),
    );
  for (const mode of modes) {
    expect(mode.space).toBeGreaterThanOrEqual(mode.height);
    expect(mode.behavior).toBe("auto");
  }
  expect(modes.map((mode) => mode.marker)).toEqual([40, 32, 40, 44]);
  await page.locator("#deck-start").focus();
  await page.keyboard.press("Tab");
  const focus = await page
    .locator("#workspace-deck > section")
    .first()
    .evaluate((panel) => {
      const marker = getComputedStyle(panel, "::scroll-marker");
      return {
        outline: marker.outlineStyle,
        width: parseFloat(marker.outlineWidth),
        selected: marker.textDecorationLine,
      };
    });
  expect(focus).toEqual({ outline: "solid", width: 2, selected: "underline" });
});

test("initial RTL content stays visible and accessible in the stacked fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./preview/panel-deck");
  const deck = page.getByRole("region", {
    name: "touch RTL example",
    exact: true,
  });
  await expect(deck).toHaveCSS("display", "grid");
  await expect(deck).toHaveCSS("scroll-marker-group", "none");
  const tree = await deck.ariaSnapshot();
  expect(tree).not.toMatch(/- tab\b/);
  for (const name of ["Recent activity", "Reports ready", "Team resources"]) {
    expect(tree).toContain(name);
    await expect(deck.getByRole("heading", { name })).toBeVisible();
  }
  const panels = await deck
    .locator(".pl-c-panel-deck__panel")
    .evaluateAll((panels) =>
      panels.map((panel) => ({
        top: panel.getBoundingClientRect().top,
        bottom: panel.getBoundingClientRect().bottom,
      })),
    );
  for (let index = 1; index < panels.length; index++) {
    expect(panels[index].top - panels[index - 1].bottom).toBeGreaterThanOrEqual(
      12,
    );
  }
});
