import { expect, test } from "@playwright/test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const componentSource = fileURLToPath(
  new URL("../../packages/porchlight/src/06-components/", import.meta.url),
);
const componentDocs = fileURLToPath(
  new URL("../src/content/components/", import.meta.url),
);
const componentPreviews = fileURLToPath(
  new URL("../src/pages/preview/", import.meta.url),
);
const enhancementsSource = fileURLToPath(
  new URL("../../packages/porchlight/src/08-enhancements.css", import.meta.url),
);
const layoutSource = fileURLToPath(
  new URL("../../packages/porchlight/src/05-layout.css", import.meta.url),
);
const frameworkEntry = fileURLToPath(
  new URL("../../packages/porchlight/porchlight.css", import.meta.url),
);

const componentSlugs = readdirSync(componentSource)
  .filter((file) => file.endsWith(".css"))
  .map((file) => file.replace(/\.css$/, ""))
  .sort();

test("every component stylesheet has a reference page and a preview", () => {
  const missing = componentSlugs.flatMap((slug) => {
    const gaps: string[] = [];
    if (!existsSync(`${componentDocs}${slug}.mdx`)) {
      gaps.push(`docs/src/content/components/${slug}.mdx`);
    }
    if (!existsSync(`${componentPreviews}${slug}.astro`)) {
      gaps.push(`docs/src/pages/preview/${slug}.astro`);
    }
    return gaps;
  });

  expect(
    missing,
    "Add the missing docs or preview, or remove the component stylesheet.",
  ).toEqual([]);
});

test("every component reference page has a component stylesheet", () => {
  const documented = readdirSync(componentDocs)
    .filter((file) => file.endsWith(".mdx"))
    .filter((file) => {
      const source = readFileSync(`${componentDocs}${file}`, "utf8");
      return !/^kind:\s*pattern\s*$/m.test(source);
    })
    .map((file) => file.replace(/\.mdx$/, ""))
    .sort();

  const missing = documented.filter((slug) => !componentSlugs.includes(slug));

  expect(
    missing,
    "Add the component stylesheet or move the page to a pattern.",
  ).toEqual([]);
});

test("enhancements use the current position-visibility value", () => {
  const source = readFileSync(enhancementsSource, "utf8");
  expect(source).toContain("position-visibility: anchor-visible;");
});

test("desktop shell keeps the drag and Window Controls Overlay contract", () => {
  const source = readFileSync(layoutSource, "utf8");
  expect(source).toContain("window-drag: move");
  expect(source).toContain("env(titlebar-area-x");
  expect(source).toContain("display-mode: window-controls-overlay");
});

test("every component stylesheet is imported by the source entry", () => {
  const source = readFileSync(frameworkEntry, "utf8");
  const missing = componentSlugs.filter(
    (slug) => !source.includes(`src/06-components/${slug}.css`),
  );

  expect(
    missing,
    "Add the component import to packages/porchlight/porchlight.css.",
  ).toEqual([]);
});
