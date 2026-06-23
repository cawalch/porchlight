// Bundles the source porchlight.css (which @imports each layer module) into a
// single distributable file via Lightning CSS, targeting Chrome 149+. Emits a
// readable dist and a minified one. No consumer bundler required after this.
import { bundle } from "lightningcss";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const entry = resolve(root, "porchlight.css");
const outDir = resolve(root, "dist");

// lightningcss encodes a version as (major << 16 | minor << 8 | patch).
const chrome149 = (149 << 16) >>> 0;
const targets = { chrome: chrome149 };

// Feature flags: keep modern CSS as-is (our baseline is Chrome 149), but let
// Lightning CSS handle @import inlining + minification.
const features = {
  // Leave nesting, @layer, @property, light-dark(), container queries native.
};

async function emit({ minify }, suffix) {
  const { code } = await bundle({
    filename: entry,
    targets,
    minify,
    drafts: { customMedia: true },
    nonStandard: { deepSelectorCombinator: true },
    errorRecovery: false,
  });
  await writeFile(resolve(outDir, `porchlight${suffix}.css`), code);
  return code.length;
}

await mkdir(outDir, { recursive: true });
const readable = await emit({ minify: false }, "");
const min = await emit({ minify: true }, ".min");

console.log(
  `✓ built dist/porchlight.css (${readable} b) and dist/porchlight.min.css (${min} b)`,
);
void features;
