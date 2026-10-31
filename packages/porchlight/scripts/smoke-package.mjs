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
  "dist/compat.min.css",
  "dist/core.css",
  "dist/core.min.css",
  "dist/layout.css",
  "dist/layout.min.css",
  "dist/components.css",
  "dist/components.min.css",
  "dist/utilities.css",
  "dist/utilities.min.css",
  "dist/enhancements.css",
  "dist/enhancements.min.css",
  "dist/porchlight.manifest.json",
  "dist/tokens.json",
  "dist/tokens.js",
  "dist/tokens.d.ts",
  "CHANGELOG.md",
  "COMPONENTS.md",
  "bin/porchlight.mjs",
];

await Promise.all(requiredFiles.map((file) => exists(file)));

const componentSourceFiles = (await readdir(resolve(root, "src/06-components")))
  .filter((file) => file.endsWith(".css"))
  .sort();
await Promise.all([
  ...componentSourceFiles.map((file) => exists(`dist/components/${file}`)),
  ...componentSourceFiles.map((file) =>
    exists(`dist/components/${file.replace(/\.css$/, ".min.css")}`),
  ),
]);

const componentsMd = await readFile(resolve(root, "COMPONENTS.md"), "utf8");
for (const file of componentSourceFiles) {
  const name = file.replace(/\.css$/, "");
  assert(
    componentsMd.includes(`### ${name}`) &&
      componentsMd.includes(`@cawalch/porchlight/components/${name}.css`),
    `COMPONENTS.md missing reference to component "${name}"`,
  );
}

// The package builder must not fold scroll timelines into animation shorthands.
// Lightning CSS 1.33 can emit `animation: ... view()` / `scroll(root)`, which
// browsers reject even though they support the animation-timeline longhand.
for (const [file, timelines] of [
  ["dist/porchlight.css", ["view()", "scroll(root)"]],
  ["dist/porchlight.min.css", ["view()", "scroll(root)"]],
  ["dist/compat.css", ["view()", "scroll(root)"]],
  ["dist/components.css", ["view()", "scroll(root)"]],
  ["dist/components/reveal.css", ["view()"]],
  ["dist/components/scroll-progress.css", ["scroll(root)"]],
]) {
  const css = await readFile(resolve(root, file), "utf8");
  assert(
    !/\banimation\s*:[^;{}]*(?:view\(\)|scroll\(root\))/i.test(css),
    `${file} folds a scroll timeline into an invalid animation shorthand`,
  );
  for (const timeline of timelines) {
    assert(
      css.includes(`animation-timeline: ${timeline}`) ||
        css.includes(`animation-timeline:${timeline}`),
      `${file} is missing animation-timeline: ${timeline}`,
    );
  }
}

assert(
  packageJson.style === "dist/porchlight.min.css",
  "package.json style must point to minified bundle",
);

const exportsMap = packageJson.exports;
for (const path of [
  ".",
  "./porchlight.css",
  "./unminified.css",
  "./min.css",
  "./compat.css",
  "./compat.min.css",
  "./core.css",
  "./core.min.css",
  "./layout.css",
  "./layout.min.css",
  "./components.css",
  "./components.min.css",
  "./components/*.min.css",
  "./components/*.css",
  "./utilities.css",
  "./utilities.min.css",
  "./enhancements.css",
  "./enhancements.min.css",
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
const componentsByName = new Map(
  manifest.components.map((component) => [component.name, component]),
);
for (const component of manifest.components) {
  for (const name of component.dependencies ?? []) {
    const dependency = componentsByName.get(name);
    assert(dependency, `${component.name} has unknown dependency ${name}`);
    assert(name !== component.name, `${component.name} depends on itself`);
    assert(
      !dependency.dependencies?.length,
      `Nested dependencies need explicit copy support: ${component.name} -> ${name}`,
    );
  }
}
assert(
  componentsByName.get("split-button")?.dependencies?.join(",") === "button",
  "Split button must declare its button CSS dependency",
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

const splitCopy = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "copy",
    "--out",
    resolve(copyRoot, "split"),
    "--components",
    "split-button",
  ],
  { encoding: "utf8" },
);
assert(
  splitCopy.status === 0,
  `split-button copy failed: ${splitCopy.stderr || splitCopy.stdout}`,
);
await exists(resolve(copyRoot, "split/core.css"));
await exists(resolve(copyRoot, "split/components/button.css"));
await exists(resolve(copyRoot, "split/components/split-button.css"));
const copiedComponents = (
  await readdir(resolve(copyRoot, "split/components"))
).sort();
assert(
  copiedComponents.join(",") === "button.css,split-button.css",
  `Unexpected split-button CSS files: ${copiedComponents.join(", ")}`,
);
assert(
  splitCopy.stdout.indexOf("button.css") <
    splitCopy.stdout.indexOf("split-button.css"),
  "Button CSS must be copied before split-button CSS",
);
const splitCss = await readFile(
  resolve(copyRoot, "split/components/split-button.css"),
  "utf8",
);
assert(
  splitCss.includes(".pl-c-split__divider") &&
    splitCss.includes(".pl-c-menu__divider"),
  "Split CSS must style its divider and previously documented divider markup",
);

const minCopy = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "copy",
    "--out",
    resolve(copyRoot, "minified"),
    "--components",
    "button",
    "--layout",
    "--min",
  ],
  { encoding: "utf8" },
);
assert(
  minCopy.status === 0,
  `min copy failed: ${minCopy.stderr || minCopy.stdout}`,
);
await exists(resolve(copyRoot, "minified/core.min.css"));
await exists(resolve(copyRoot, "minified/layout.min.css"));
await exists(resolve(copyRoot, "minified/components/button.min.css"));

// CLI --help and --version
const helpRun = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "--help"],
  { encoding: "utf8" },
);
assert(helpRun.status === 0, "CLI --help failed");
assert(
  helpRun.stdout.includes("Commands:") &&
    helpRun.stdout.includes("init") &&
    helpRun.stdout.includes("tokens"),
  "CLI --help output missing commands",
);

const versionRun = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "--version"],
  { encoding: "utf8" },
);
assert(versionRun.status === 0, "CLI --version failed");
assert(
  versionRun.stdout.trim() === packageJson.version,
  "CLI --version mismatch",
);

// CLI init --stdout
const initStdout = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "init", "--stdout"],
  { encoding: "utf8" },
);
assert(initStdout.status === 0, "CLI init --stdout failed");
assert(
  initStdout.stdout.includes("<!doctype html>") &&
    initStdout.stdout.includes("porchlight.min.css") &&
    initStdout.stdout.includes("pl-c-button") &&
    initStdout.stdout.includes("pl-c-card"),
  "CLI init --stdout output missing required template markup",
);

// CLI init --out
const initTarget = resolve(copyRoot, "init-test/index.html");
const initOut = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "init",
    "--out",
    initTarget,
    "--local",
    "--title",
    "Test App",
  ],
  { encoding: "utf8" },
);
assert(
  initOut.status === 0,
  `CLI init --out failed: ${initOut.stderr || initOut.stdout}`,
);
await exists(initTarget);
const initContent = await readFile(initTarget, "utf8");
assert(
  initContent.includes("<title>Test App</title>") &&
    initContent.includes("./porchlight.min.css"),
  "CLI init file missing expected options",
);

// CLI init collision check (fails without --force)
const initCollision = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "init", "--out", initTarget],
  { encoding: "utf8" },
);
assert(
  initCollision.status === 1,
  "CLI init should fail when target exists without --force",
);
assert(
  initCollision.stderr.includes("already exists"),
  "CLI init collision error message missing",
);

// CLI init overwrite with --force
const initForce = spawnSync(
  process.execPath,
  [
    resolve(root, "bin/porchlight.mjs"),
    "init",
    "--out",
    initTarget,
    "--force",
    "--title",
    "Overwritten App",
  ],
  { encoding: "utf8" },
);
assert(initForce.status === 0, "CLI init --force failed");
const initOverwritten = await readFile(initTarget, "utf8");
assert(
  initOverwritten.includes("<title>Overwritten App</title>"),
  "CLI init --force did not overwrite file",
);

// CLI tokens grouped inspection
const tokensAll = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "tokens"],
  { encoding: "utf8" },
);
assert(tokensAll.status === 0, "CLI tokens failed");
assert(
  tokensAll.stdout.includes("Group: Fonts") &&
    tokensAll.stdout.includes("--pl-font-sans"),
  "CLI tokens missing expected group or token",
);

// CLI tokens query filtering
const tokensQuery = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "tokens", "radius"],
  { encoding: "utf8" },
);
assert(tokensQuery.status === 0, "CLI tokens query failed");
assert(
  tokensQuery.stdout.includes("--pl-radius-md"),
  "CLI tokens query missing expected token",
);

// CLI tokens group filter
const tokensGroup = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "tokens", "--group", "Fonts"],
  { encoding: "utf8" },
);
assert(tokensGroup.status === 0, "CLI tokens --group failed");
assert(
  tokensGroup.stdout.includes("Group: Fonts") &&
    !tokensGroup.stdout.includes("Group: Spacers"),
  "CLI tokens --group did not filter groups properly",
);

// CLI tokens JSON format
const tokensJson = spawnSync(
  process.execPath,
  [resolve(root, "bin/porchlight.mjs"), "tokens", "--group", "Fonts", "--json"],
  { encoding: "utf8" },
);
assert(tokensJson.status === 0, "CLI tokens --json failed");
const parsedJson = JSON.parse(tokensJson.stdout);
assert(
  Array.isArray(parsedJson.groups) && parsedJson.groups.length === 1,
  "CLI tokens --json did not return expected JSON structure",
);
assert(
  parsedJson.groups[0].name === "Fonts",
  "CLI tokens --json returned unexpected group",
);

console.log(
  `✓ package smoke passed for ${componentSourceFiles.length} components and ${Object.keys(tokenDoc.tokens).length} tokens`,
);
