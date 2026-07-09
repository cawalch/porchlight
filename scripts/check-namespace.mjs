#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url);
const allowedExtensions = new Set([
  ".astro",
  ".css",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".txt",
]);
const roots = [
  "README.md",
  "packages/porchlight/README.md",
  "packages/porchlight/porchlight.css",
  "packages/porchlight/src",
  "docs/public",
  "docs/src",
  "docs/tests",
];
const ignoredPathParts = new Set([
  ".astro",
  "dist",
  "node_modules",
  "reports",
  "test-results",
]);
const ignoredFiles = new Set([
  "CHANGELOG.md",
  "PLAN.md",
  "ROADMAP.md",
  "STATUS.md",
  "docs/src/content/guides/naming-migration.mdx",
]);
const checks = [
  {
    name: "unprefixed public class",
    pattern: /(?<!pl-)\.[clu]-[a-z0-9][A-Za-z0-9_-]*/g,
  },
  {
    name: "unprefixed class token",
    pattern: /(?<!pl-)\b[clu]-[a-z0-9][A-Za-z0-9_-]*/g,
  },
  {
    name: "unprefixed public custom property",
    pattern: /--(?:c|l|u|app)-[A-Za-z0-9_-]+/g,
  },
  {
    name: "unprefixed global data attribute",
    pattern: /\bdata-(?:theme|density)\b/g,
  },
];

function extname(path) {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot);
}

function isIgnored(path) {
  return (
    ignoredFiles.has(path) ||
    path.split("/").some((part) => ignoredPathParts.has(part))
  );
}

async function collect(path) {
  if (isIgnored(path)) return [];

  const absolute = new URL(path, root);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(
    () => null,
  );
  if (!entries) {
    return allowedExtensions.has(extname(path)) ? [path] : [];
  }

  const files = [];
  for (const entry of entries) {
    const next = join(path, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      files.push(...(await collect(next)));
    } else if (!isIgnored(next) && allowedExtensions.has(extname(next))) {
      files.push(next);
    }
  }
  return files;
}

function lineAndColumn(source, index) {
  const before = source.slice(0, index);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: lines.at(-1).length + 1,
  };
}

const files = (await Promise.all(roots.map((path) => collect(path)))).flat();
const violations = [];

for (const file of files) {
  const source = await readFile(new URL(file, root), "utf8");
  for (const check of checks) {
    check.pattern.lastIndex = 0;
    let match;
    while ((match = check.pattern.exec(source)) !== null) {
      const { line, column } = lineAndColumn(source, match.index);
      violations.push({
        file,
        line,
        column,
        name: check.name,
        value: match[0],
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Porchlight namespace check failed:");
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} ${violation.name}: ${violation.value}`,
    );
  }
  process.exit(1);
}

console.log(`✓ namespace check passed for ${files.length} files`);
