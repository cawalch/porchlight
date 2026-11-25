import { expect, test } from "@playwright/test";

test("tree preview supports keyboard navigation and selection", async ({
  page,
}) => {
  await page.goto("./preview/tree");
  const tree = page.getByRole("tree", { name: "Claims automation library" });
  const item = (name: string) =>
    tree.getByRole("treeitem", { name: new RegExp(`^${name}`) });
  const intake = item("Intake processes");
  const triage = item("FNOL triage");
  const coverage = item("Coverage verification");
  const disabled = item("Regulatory hold rules");

  await page.getByRole("button", { name: "Add folder" }).focus();
  await page.keyboard.press("Tab");
  await expect(intake).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(triage).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(coverage).toBeFocused();
  await expect(triage).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter");
  await expect(coverage).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(intake).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(intake).toHaveAttribute("aria-expanded", "false");
  await expect(triage).toBeHidden();
  await page.keyboard.press("ArrowDown");
  await expect(item("Rule sets")).toBeFocused();
  await page.keyboard.press("End");
  await expect(item("Shared templates")).toBeFocused();
  await page.keyboard.press("Home");
  await expect(intake).toBeFocused();
  await page.keyboard.press("r");
  await page.keyboard.press("r");
  await expect(disabled).toBeFocused();
  await page.keyboard.press("Space");
  await expect(tree.locator('[aria-selected="true"]')).toContainText(
    "Coverage verification",
  );
  await expect(tree.locator('[tabindex="0"]')).toHaveCount(1);

  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
  });
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowLeft");
  await expect(intake).toHaveAttribute("aria-expanded", "true");
  await expect(intake).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(triage).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(intake).toBeFocused();
});
