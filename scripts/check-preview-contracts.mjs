#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const previewRoot = resolve(root, "docs/src/pages/preview");

const canonical = [
  "app-dashboard",
  "app-inbox",
  "app-telemetry-cockpit",
  "app-audit-studio",
  "app-record-detail",
  "app-settings-console",
];

const structuralValues = new Set([
  "0",
  "0px",
  "100%",
  "auto",
  "none",
  "inherit",
  "initial",
  "unset",
  "currentcolor",
  "center",
  "flex-start",
  "flex-end",
  "space-between",
  "space-around",
  "uppercase",
  "lowercase",
  "capitalize",
  "hidden",
  "visible",
  "ellipsis",
  "nowrap",
  "fixed",
  "relative",
  "absolute",
  "sticky",
  "700",
  "600",
  "500",
  "400",
  "1",
  "1.2",
  "1.5",
]);

const svgTags = new Set([
  "svg",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "g",
  "ellipse",
]);

const failures = [];

for (const slug of canonical) {
  const file = resolve(previewRoot, `${slug}.astro`);
  const source = await readFile(file, "utf8");
  const relative = `docs/src/pages/preview/${slug}.astro`;

  const styleBlock = /<style>([\s\S]*?)<\/style>/.exec(source)?.[1] ?? "";
  if (styleBlock && !/demo-only/i.test(styleBlock)) {
    failures.push(
      `${relative}: <style> block must start with a "Demo-only chrome" comment.`,
    );
  }

  const tagPattern = /<([a-z][a-z0-9-]*)\b[^>]*\bstyle="([^"]*)"/gi;
  for (const match of source.matchAll(tagPattern)) {
    const tag = match[1].toLowerCase();
    if (svgTags.has(tag)) continue;
    const style = match[2];
    for (const declaration of style.split(";")) {
      const [rawProperty, ...rawValue] = declaration.split(":");
      const property = rawProperty?.trim().toLowerCase();
      const value = rawValue.join(":").trim();
      if (!property || !value) continue;
      if (property.startsWith("--")) continue;
      if (value.includes("var(--pl-")) continue;
      if (structuralValues.has(value.toLowerCase())) continue;
      failures.push(
        `${relative}: inline ${property}: "${value}" uses a raw design value. Use a --pl-* token or a component class.`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error("Preview contract check failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `✓ ${canonical.length} canonical previews match the example contract`,
);
