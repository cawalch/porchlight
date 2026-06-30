import { spawnSync } from "node:child_process";
import { access, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

async function exists(path) {
  await access(resolve(root, path));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);

const requiredFiles = [
  "dist/porchlight.css",
  "dist/porchlight.min.css",
  "dist/compat.css",
  "dist/core.css",
  "dist/layout.css",
  "dist/components.css",
  "dist/utilities.css",
  "dist/enhancements.css",
  "dist/porchlight.manifest.json",
  "dist/tokens.json",
  "dist/tokens.js",
  "dist/tokens.d.ts",
  "CHANGELOG.md",
  "bin/porchlight.mjs",
];

await Promise.all(requiredFiles.map((file) => exists(file)));

const componentSourceFiles = (await readdir(resolve(root, "src/06-components")))
  .filter((file) => file.endsWith(".css"))
  .sort();
await Promise.all(
  componentSourceFiles.map((file) => exists(`dist/components/${file}`)),
);

const exportsMap = packageJson.exports;
for (const path of [
  ".",
  "./min.css",
  "./compat.css",
  "./core.css",
  "./layout.css",
  "./components.css",
  "./components/*.css",
  "./utilities.css",
  "./enhancements.css",
  "./tokens",
  "./tokens.json",
  "./manifest.json",
  "./src/*",
]) {
  assert(exportsMap[path], `Missing package export: ${path}`);
}

for (const removedAlias of [
  "./css",
  "./min",
  "./source",
  "./porchlight.css",
  "./dist",
  "./dist/porchlight.css",
  "./dist/porchlight.min.css",
]) {
  assert(
    !exportsMap[removedAlias],
    `Removed alias is still exported: ${removedAlias}`,
  );
}

const tokenDoc = JSON.parse(
  await readFile(resolve(root, "dist/tokens.json"), "utf8"),
);
assert(tokenDoc.tokens["--pl-brand-1"], "Missing color token --pl-brand-1");
assert(tokenDoc.tokens["--pl-space-1"], "Missing spacing token --pl-space-1");
assert(tokenDoc.tokens["--pl-text-sm"], "Missing type token --pl-text-sm");
assert(
  tokenDoc.registeredProperties.some(
    ({ name }) => name === "--pl-motion-scale",
  ),
  "Missing registered property --pl-motion-scale",
);

const manifest = JSON.parse(
  await readFile(resolve(root, "dist/porchlight.manifest.json"), "utf8"),
);
assert(
  manifest.components.length === componentSourceFiles.length,
  "Manifest component count does not match source components",
);
assert(
  manifest.recommendedLoadOrder.includes("dist/core.css"),
  "Manifest does not include core.css in the load order",
);

const copyRoot = await mkdtemp(resolve(tmpdir(), "porchlight-copy-"));
const compatCopy = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "copy",
    "--out",
    resolve(copyRoot, "compat"),
    "--compat",
  ],
  { encoding: "utf8" },
);
assert(
  compatCopy.status === 0,
  `compat copy failed: ${compatCopy.stderr || compatCopy.stdout}`,
);
await exists(resolve(copyRoot, "compat/compat.css"));
await exists(resolve(copyRoot, "compat/porchlight.manifest.json"));

const partialCopy = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "copy",
    "--out",
    resolve(copyRoot, "partial"),
    "--components",
    "button,field",
    "--layout",
    "--utilities",
  ],
  { encoding: "utf8" },
);
assert(
  partialCopy.status === 0,
  `partial copy failed: ${partialCopy.stderr || partialCopy.stdout}`,
);
await exists(resolve(copyRoot, "partial/core.css"));
await exists(resolve(copyRoot, "partial/layout.css"));
await exists(resolve(copyRoot, "partial/components/button.css"));
await exists(resolve(copyRoot, "partial/components/field.css"));
await exists(resolve(copyRoot, "partial/utilities.css"));

console.log(
  `✓ package smoke passed for ${componentSourceFiles.length} components and ${Object.keys(tokenDoc.tokens).length} tokens`,
);
