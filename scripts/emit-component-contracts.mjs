#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(root, "packages/porchlight");
const componentDir = resolve(packageRoot, "src/06-components");
const docsDir = resolve(root, "docs/src/content/components");
const contractsPath = resolve(packageRoot, "contracts/components.json");
const publicContractsPath = resolve(root, "docs/public/components.json");
const check = process.argv.includes("--check");

const packageJson = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8"),
);

const files = (await readdir(componentDir))
  .filter((file) => file.endsWith(".css"))
  .sort();

const components = [];
for (const file of files) {
  const slug = file.replace(/\.css$/, "");
  const css = await readFile(resolve(componentDir, file), "utf8");
  let docs = "";
  try {
    docs = await readFile(resolve(docsDir, `${slug}.mdx`), "utf8");
  } catch {
    continue;
  }

  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(docs)?.[1] ?? "";
  const field = (key) => {
    const match = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(frontmatter);
    return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
  };

  if (field("kind") === "pattern") continue;

  const classMatch = new RegExp(`\\.pl-c-${slug}\\b`).exec(css);
  const scopeMatch = /@scope\s*\(\s*([^)]+?)\s*\)/.exec(css);
  const fallbackSelector =
    /\.pl-c-[a-z0-9-]+/.exec(css.replace(/\/\*[\s\S]*?\*\//g, ""))?.[0] ?? null;
  const selector = classMatch
    ? `.pl-c-${slug}`
    : scopeMatch
      ? scopeMatch[1].split(",")[0].trim()
      : fallbackSelector;
  if (!selector) continue;

  components.push({
    name: slug,
    selector,
    import: `@cawalch/porchlight/components/${slug}.css`,
    importMinified: `@cawalch/porchlight/components/${slug}.min.css`,
    docs: `/components/${slug}`,
    preview: `/preview/${slug}`,
    status: field("status") ?? "stable",
    since: field("since"),
    title: field("title") ?? slug,
    description: field("description") ?? null,
  });
}

const contract = {
  $schema: "./components.schema.json",
  name: "@cawalch/porchlight",
  version: packageJson.version,
  generatedBy: "scripts/emit-component-contracts.mjs",
  rules: {
    useOnlyPublicClasses:
      "Use only pl-l-*, pl-c-*, pl-u-* classes documented in the component contract. Never invent utility or component classes.",
    semanticHtml:
      "Use real HTML elements: table, form, fieldset, label, input, button, nav, main, section, dialog, details. Do not replace them with divs.",
    applicationOwns:
      "The application owns data, state, focus management, keyboard controllers, persistence, and timers. Porchlight owns CSS contracts and static semantics.",
    tokens:
      "Prefer --pl-* tokens for spacing, color, radius, motion, and control sizing. Do not introduce parallel scales.",
    behavior:
      "Do not claim a behavior is built in unless the component contract says so. The docs list the responsibilities the application keeps.",
  },
  components,
};

const json = `${JSON.stringify(contract, null, 2)}\n`;

if (check) {
  const current = await readFile(contractsPath, "utf8").catch(() => "");
  const currentPublic = await readFile(publicContractsPath, "utf8").catch(
    () => "",
  );
  if (current !== json || currentPublic !== json) {
    console.error(
      "Component contracts are out of date. Run `pnpm contracts:generate`.",
    );
    process.exit(1);
  }
  console.log(`✓ ${components.length} component contracts match source`);
  process.exit(0);
}

await mkdir(dirname(contractsPath), { recursive: true });
await writeFile(contractsPath, json, "utf8");
await mkdir(dirname(publicContractsPath), { recursive: true });
await writeFile(publicContractsPath, json, "utf8");
console.log(`✓ wrote ${components.length} component contracts`);
