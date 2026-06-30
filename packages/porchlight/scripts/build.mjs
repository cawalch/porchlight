// Builds Porchlight's package artifacts. The full bundle remains the default,
// while modular CSS, token metadata, and a static-copy manifest make smaller
// app integrations possible without hand-maintained dist files.
import { bundle } from "lightningcss";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const repoRoot = resolve(root, "../..");
const entry = resolve(root, "porchlight.css");
const outDir = resolve(root, "dist");
const entriesDir = resolve(outDir, ".entries");
const componentsDir = resolve(root, "src/06-components");
const packageJson = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);

// lightningcss encodes a version as (major << 16 | minor << 8 | patch).
const chrome149 = (149 << 16) >>> 0;
const targets = { chrome: chrome149 };

const layerOrder = "src/00-layer-order.css";
const coreModules = [
  layerOrder,
  "src/01-reset.css",
  "src/02-tokens.css",
  "src/03-themes.css",
  "src/04-base.css",
];
const moduleEntries = {
  core: coreModules,
  layout: [layerOrder, "src/05-layout.css"],
  utilities: [layerOrder, "src/07-utilities.css"],
  enhancements: [layerOrder, "src/08-enhancements.css"],
};

function compact(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseTokens(css) {
  const registeredProperties = [];
  const propRe = /@property\s+(--pl-[\w-]+)\s*\{([^}]*)\}/g;
  let propMatch;
  while ((propMatch = propRe.exec(css)) !== null) {
    const body = propMatch[2];
    registeredProperties.push({
      name: propMatch[1],
      syntax: compact(body.match(/syntax:\s*"?([^;"]+)"?;/)?.[1] ?? ""),
      inherits: /inherits:\s*true/.test(body),
      initialValue: compact(body.match(/initial-value:\s*([^;]+);/)?.[1] ?? ""),
    });
  }

  const rootBody = css.match(/:root\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? "";
  const marks = [];
  const commentRe = /\/\*\s*([^*\n]+?)\s*\*\//g;
  let commentMatch;
  while ((commentMatch = commentRe.exec(rootBody)) !== null) {
    marks.push({
      idx: commentMatch.index,
      section: commentMatch[1].trim(),
    });
  }

  const tokenGroups = [];
  const tokens = {};
  const declRe = /(--pl-[\w-]+)\s*:\s*([\s\S]*?);/g;
  let declMatch;
  while ((declMatch = declRe.exec(rootBody)) !== null) {
    let groupName = "Other";
    for (const mark of marks) {
      if (mark.idx < declMatch.index) {
        groupName = mark.section;
      } else {
        break;
      }
    }

    let group = tokenGroups.find(({ name }) => name === groupName);
    if (!group) {
      group = { name: groupName, tokens: [] };
      tokenGroups.push(group);
    }

    const token = {
      name: declMatch[1],
      value: compact(declMatch[2]),
      group: groupName,
    };
    group.tokens.push(token);
    tokens[token.name] = token;
  }

  return { registeredProperties, tokenGroups, tokens };
}

async function cssEntry(name, paths) {
  const filename = resolve(entriesDir, `${name}.css`);
  const imports = paths.map((path) => `@import "../../${path}";`).join("\n");
  await writeFile(filename, `${imports}\n`);
  return filename;
}

async function emitBundle({ filename, output, minify = false }) {
  const { code } = await bundle({
    filename,
    targets,
    minify,
    drafts: { customMedia: true },
    nonStandard: { deepSelectorCombinator: true },
    errorRecovery: false,
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, code);
  return code.length;
}

async function emitGeneratedCss(name, paths, output) {
  const filename = await cssEntry(name, paths);
  return emitBundle({
    filename,
    output: resolve(outDir, output),
  });
}

async function emitTokens() {
  const css = await readFile(resolve(root, "src/02-tokens.css"), "utf8");
  const tokenDoc = {
    version: packageJson.version,
    ...parseTokens(css),
  };
  const json = `${JSON.stringify(tokenDoc, null, 2)}\n`;
  await writeFile(resolve(outDir, "tokens.json"), json);
  await writeFile(
    resolve(outDir, "tokens.js"),
    [
      `export const version = ${JSON.stringify(tokenDoc.version)};`,
      `export const tokens = ${JSON.stringify(tokenDoc.tokens, null, 2)};`,
      `export const tokenGroups = ${JSON.stringify(tokenDoc.tokenGroups, null, 2)};`,
      `export const registeredProperties = ${JSON.stringify(
        tokenDoc.registeredProperties,
        null,
        2,
      )};`,
      "export default { version, tokens, tokenGroups, registeredProperties };",
      "",
    ].join("\n"),
  );
  await writeFile(
    resolve(outDir, "tokens.d.ts"),
    [
      "export interface PorchlightToken {",
      "  name: string;",
      "  value: string;",
      "  group: string;",
      "}",
      "",
      "export interface PorchlightRegisteredProperty {",
      "  name: string;",
      "  syntax: string;",
      "  inherits: boolean;",
      "  initialValue: string;",
      "}",
      "",
      "export interface PorchlightTokenGroup {",
      "  name: string;",
      "  tokens: PorchlightToken[];",
      "}",
      "",
      "export declare const version: string;",
      "export declare const tokens: Record<string, PorchlightToken>;",
      "export declare const tokenGroups: PorchlightTokenGroup[];",
      "export declare const registeredProperties: PorchlightRegisteredProperty[];",
      "declare const tokenDoc: {",
      "  version: string;",
      "  tokens: Record<string, PorchlightToken>;",
      "  tokenGroups: PorchlightTokenGroup[];",
      "  registeredProperties: PorchlightRegisteredProperty[];",
      "};",
      "export default tokenDoc;",
      "",
    ].join("\n"),
  );

  return tokenDoc;
}

async function emitManifest(componentNames) {
  const manifest = {
    name: packageJson.name,
    version: packageJson.version,
    files: {
      full: "dist/porchlight.css",
      minified: "dist/porchlight.min.css",
      compat: "dist/compat.css",
      core: "dist/core.css",
      layout: "dist/layout.css",
      components: "dist/components.css",
      utilities: "dist/utilities.css",
      enhancements: "dist/enhancements.css",
      tokens: {
        json: "dist/tokens.json",
        module: "dist/tokens.js",
        types: "dist/tokens.d.ts",
      },
    },
    components: componentNames.map((name) => ({
      name,
      file: `dist/components/${name}.css`,
      import: `@cawalch/porchlight/components/${name}.css`,
    })),
    recommendedLoadOrder: [
      "dist/core.css",
      "dist/layout.css",
      "dist/components/<component>.css",
      "dist/utilities.css",
      "dist/enhancements.css",
    ],
  };
  await writeFile(
    resolve(outDir, "porchlight.manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

await rm(outDir, { recursive: true, force: true });
await mkdir(entriesDir, { recursive: true });

const componentFiles = (await readdir(componentsDir))
  .filter((file) => file.endsWith(".css"))
  .sort();
const componentNames = componentFiles.map((file) => file.replace(/\.css$/, ""));
const componentModules = componentFiles.map(
  (file) => `src/06-components/${file}`,
);

const emitted = [];
emitted.push({
  file: "dist/porchlight.css",
  bytes: await emitBundle({
    filename: entry,
    output: resolve(outDir, "porchlight.css"),
  }),
});
emitted.push({
  file: "dist/porchlight.min.css",
  bytes: await emitBundle({
    filename: entry,
    output: resolve(outDir, "porchlight.min.css"),
    minify: true,
  }),
});

for (const [name, paths] of Object.entries(moduleEntries)) {
  emitted.push({
    file: `dist/${name}.css`,
    bytes: await emitGeneratedCss(name, paths, `${name}.css`),
  });
}

emitted.push({
  file: "dist/components.css",
  bytes: await emitGeneratedCss(
    "components",
    [layerOrder, ...componentModules],
    "components.css",
  ),
});
emitted.push({
  file: "dist/compat.css",
  bytes: await emitGeneratedCss(
    "compat",
    [
      ...coreModules,
      "src/05-layout.css",
      ...componentModules,
      "src/07-utilities.css",
    ],
    "compat.css",
  ),
});

for (const file of componentFiles) {
  const name = file.replace(/\.css$/, "");
  emitted.push({
    file: `dist/components/${file}`,
    bytes: await emitGeneratedCss(
      `component-${name}`,
      [layerOrder, `src/06-components/${file}`],
      `components/${file}`,
    ),
  });
}

const tokenDoc = await emitTokens();
await emitManifest(componentNames);
await copyFile(
  resolve(repoRoot, "CHANGELOG.md"),
  resolve(root, "CHANGELOG.md"),
);
await rm(entriesDir, { recursive: true, force: true });

console.log(
  `✓ built ${emitted.length} CSS artifacts, ${Object.keys(tokenDoc.tokens).length} tokens, and ${componentNames.length} component entries`,
);
for (const item of emitted) {
  console.log(`  ${item.file} (${item.bytes} b)`);
}
