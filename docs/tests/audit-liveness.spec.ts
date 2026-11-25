import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const srcDir = resolve(repoRoot, "packages/porchlight/src");
const docsSrcDir = resolve(repoRoot, "docs/src");
const docsTestsDir = resolve(repoRoot, "docs/tests");
const distFullPath = resolve(repoRoot, "packages/porchlight/dist/full.css");

function collectFiles(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full, exts));
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

test("every --pl-* token defined in 02-tokens.css is referenced in src/ or docs/", () => {
  const tokensCss = readFileSync(resolve(srcDir, "02-tokens.css"), "utf8");
  const allConsumerText = [
    ...collectFiles(srcDir, [".css"]),
    ...collectFiles(docsSrcDir, [".astro", ".css", ".mdx", ".ts", ".mjs"]),
    ...collectFiles(docsTestsDir, [".ts"]),
  ]
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");

  const defined = new Set<string>();
  for (const match of tokensCss.matchAll(/(--pl-[a-z0-9-]+)\s*:/g)) {
    defined.add(match[1]);
  }

  const publicScaleTokens = new Set([
    "--pl-density",
    "--pl-tone",
    "--pl-text-display",
    "--pl-tracking-normal",
    "--pl-brand-1",
    "--pl-brand-2",
    "--pl-brand-3",
    "--pl-brand-5",
    "--pl-brand-8",
    "--pl-brand-9",
  ]);

  const unreferenced: string[] = [];
  for (const token of defined) {
    if (publicScaleTokens.has(token)) continue;
    const refRegex = new RegExp(
      `var\\(\\s*${token}\\b|\\b${token}\\b(?!\\s*:)`,
    );
    if (!refRegex.test(allConsumerText)) {
      unreferenced.push(token);
    }
  }

  expect(unreferenced, "unreferenced --pl-* tokens in 02-tokens.css").toEqual(
    [],
  );
});

test("every sublayer declared in 00-layer-order.css contains rules in dist/full.css", () => {
  const orderCss = readFileSync(resolve(srcDir, "00-layer-order.css"), "utf8");
  const fullCss = readFileSync(distFullPath, "utf8");

  const layerMatch = orderCss.match(
    /@layer\s+porchlight\s*\{\s*@layer\s+([^;]+);/,
  );
  expect(layerMatch).toBeTruthy();
  const sublayers = layerMatch![1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const emptyLayers: string[] = [];
  for (const layer of sublayers) {
    const pattern = new RegExp(`@layer\\s+(?:porchlight\\.)?${layer}\\s*\\{`);
    if (!pattern.test(fullCss)) {
      emptyLayers.push(layer);
    }
  }

  expect(emptyLayers, "empty layers in dist/full.css").toEqual([]);
});
