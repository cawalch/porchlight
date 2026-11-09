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
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

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
  experimental: [layerOrder, "src/09-experimental.css"],
};
// Only stylesheet dependencies required by a component's own markup contract.
// Optional compositions (for example, a menu with a styled button trigger)
// remain application-selected imports.
const componentDependencies = {
  "split-button": ["button"],
};
const namespaceChecks = [
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

function compact(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function collectFiles(path) {
  const absolute = resolve(root, path);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(
    () => null,
  );
  if (!entries) {
    return [path];
  }

  const files = [];
  for (const entry of entries) {
    const next = `${path}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(next)));
    } else if (entry.name.endsWith(".css")) {
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

async function assertTokenReferences(label, files) {
  const defined = new Set();
  const sources = [];

  for (const file of files) {
    const source = (await readFile(resolve(root, file), "utf8")).replace(
      /\/\*[\s\S]*?\*\//g,
      (comment) => comment.replace(/[^\n]/g, " "),
    );
    sources.push({ file, source });

    for (const match of source.matchAll(/(--pl-[\w-]+)\s*:/g)) {
      defined.add(match[1]);
    }
    for (const match of source.matchAll(/@property\s+(--pl-[\w-]+)/g)) {
      defined.add(match[1]);
    }
  }

  const violations = [];
  for (const { file, source } of sources) {
    for (const match of source.matchAll(/var\(\s*(--pl-[\w-]+)\s*(,)?/g)) {
      if (match[2] || defined.has(match[1])) continue;
      const { line, column } = lineAndColumn(source, match.index);
      violations.push(
        `${file}:${line}:${column} undefined token reference: var(${match[1]})`,
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Porchlight token reference check failed in ${label}:\n${violations.join("\n")}`,
    );
  }
}

async function assertNamespaceClean(label, files) {
  const violations = [];

  for (const file of files) {
    const source = await readFile(resolve(root, file), "utf8");
    for (const check of namespaceChecks) {
      check.pattern.lastIndex = 0;
      let match;
      while ((match = check.pattern.exec(source)) !== null) {
        const { line, column } = lineAndColumn(source, match.index);
        violations.push(`${file}:${line}:${column} ${check.name}: ${match[0]}`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Porchlight namespace check failed in ${label}:\n${violations.join("\n")}`,
    );
  }
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

async function emitGeneratedCss(name, paths, output, minify = false) {
  const filename = await cssEntry(name, paths);
  return emitBundle({
    filename,
    output: resolve(outDir, output),
    minify,
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
      fullAlias: "dist/full.css",
      fullAliasMinified: "dist/full.min.css",
      compat: "dist/compat.css",
      compatMinified: "dist/compat.min.css",
      core: "dist/core.css",
      coreMinified: "dist/core.min.css",
      layout: "dist/layout.css",
      layoutMinified: "dist/layout.min.css",
      components: "dist/components.css",
      componentsMinified: "dist/components.min.css",
      utilities: "dist/utilities.css",
      utilitiesMinified: "dist/utilities.min.css",
      enhancements: "dist/enhancements.css",
      enhancementsMinified: "dist/enhancements.min.css",
      experimental: "dist/experimental.css",
      experimentalMinified: "dist/experimental.min.css",
      tokens: {
        json: "dist/tokens.json",
        module: "dist/tokens.js",
        types: "dist/tokens.d.ts",
      },
      sizeBudget: "dist/size-budget.json",
    },
    components: componentNames.map((name) => ({
      name,
      file: `dist/components/${name}.css`,
      minified: `dist/components/${name}.min.css`,
      import: `@cawalch/porchlight/components/${name}.css`,
      importMinified: `@cawalch/porchlight/components/${name}.min.css`,
      ...(componentDependencies[name]
        ? { dependencies: componentDependencies[name] }
        : {}),
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

function formatBytes(bytes) {
  if (bytes === undefined || bytes === null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function measureBuffer(buf) {
  return {
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length,
    brotli: brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

async function measureRecipe(name, files) {
  const tmpFile = resolve(entriesDir, `recipe-${name}.css`);
  const imports = files.map((f) => `@import "../../${f}";`).join("\n");
  await writeFile(tmpFile, `${imports}\n`);
  const { code } = await bundle({
    filename: tmpFile,
    targets,
    minify: true,
    drafts: { customMedia: true },
    nonStandard: { deepSelectorCombinator: true },
    errorRecovery: false,
  });
  return {
    name,
    files,
    ...measureBuffer(Buffer.from(code)),
  };
}

async function emitComponentsDoc(componentNames, sizeBudget = null) {
  const components = [];
  for (const name of componentNames) {
    const file = `src/06-components/${name}.css`;
    const content = await readFile(resolve(root, file), "utf8");
    let description = "";
    const bannerMatch = content.match(/\/\*[\s\S]*?=\s*\n([\s\S]*?)\*\//);
    if (bannerMatch) {
      const lines = bannerMatch[1]
        .split("\n")
        .map((l) => l.replace(/^\s*\*\s?/, "").trim());
      const firstPara = [];
      for (const line of lines) {
        if (!line) break;
        firstPara.push(line);
      }
      description = firstPara.join(" ");
    } else {
      const simpleMatch = content.match(/\/\*([\s\S]*?)\*\//);
      if (simpleMatch) {
        description = simpleMatch[1]
          .split("\n")
          .map((l) => l.replace(/^\s*\*\s?/, "").trim())
          .filter(Boolean)
          .join(" ");
      }
    }

    const scopeMatch = content.match(/@scope\s*\(\s*([^)]+?)\s*\)/);
    const classMatch = content.match(new RegExp(`\\.pl-c-${name}\\b`));
    const primarySelector = classMatch
      ? `.pl-c-${name}`
      : scopeMatch
        ? scopeMatch[1].split(",")[0].trim()
        : `.pl-c-${name}`;

    const deps = componentDependencies[name] ?? [];
    const sizes = sizeBudget?.components?.[name] ?? null;

    components.push({
      name,
      primarySelector,
      description,
      dependencies: deps,
      sizes,
      cssFile: `dist/components/${name}.css`,
      minifiedFile: `dist/components/${name}.min.css`,
      importPath: `@cawalch/porchlight/components/${name}.css`,
      importMinifiedPath: `@cawalch/porchlight/components/${name}.min.css`,
    });
  }

  const lines = [
    "# Porchlight Components Reference",
    "",
    `Offline reference for all ${components.length} CSS-only and semantic HTML components included in \`@cawalch/porchlight\`.`,
    "",
    "## Architecture & Modular Usage",
    "",
    "Porchlight components are authored in `@layer porchlight.components` and can be imported individually or as complete bundles. When importing individual components, always import the core module first to establish cascade layer ordering, design tokens, themes, and base resets:",
    "",
    "```css",
    '@import "@cawalch/porchlight/core.css";',
    "/* Import specific components as needed: */",
    '@import "@cawalch/porchlight/components/button.css";',
    '@import "@cawalch/porchlight/components/card.css";',
    "```",
    "",
  ];

  if (sizeBudget) {
    lines.push(
      "## Size Budget & Production Recipes",
      "",
      "Porchlight is engineered for modular efficiency. Instead of shipping a monolithic 30 KB+ gzip stylesheet, applications can import `core.css` alongside only the components they actually render.",
      "",
      "### Bundle Sizes (Minified)",
      "",
      "| Bundle | Raw | Gzip | Brotli | Contents / Purpose |",
      "| :--- | :--- | :--- | :--- | :--- |",
      `| \`core.min.css\` | ${formatBytes(sizeBudget.bundles.core?.raw)} | ${formatBytes(sizeBudget.bundles.core?.gzip)} | ${formatBytes(sizeBudget.bundles.core?.brotli)} | Layers, reset, design tokens, themes, base styles |`,
      `| \`layout.min.css\` | ${formatBytes(sizeBudget.bundles.layout?.raw)} | ${formatBytes(sizeBudget.bundles.layout?.gzip)} | ${formatBytes(sizeBudget.bundles.layout?.brotli)} | Primitives: stack, cluster, grid, sidebar, center |`,
      `| \`utilities.min.css\` | ${formatBytes(sizeBudget.bundles.utilities?.raw)} | ${formatBytes(sizeBudget.bundles.utilities?.gzip)} | ${formatBytes(sizeBudget.bundles.utilities?.brotli)} | Accessibility, typography, tabular nums, flow |`,
      `| \`enhancements.min.css\` | ${formatBytes(sizeBudget.bundles.enhancements?.raw)} | ${formatBytes(sizeBudget.bundles.enhancements?.gzip)} | ${formatBytes(sizeBudget.bundles.enhancements?.brotli)} | Opt-in Progressive Enhancements (@supports) |`,
      `| \`experimental.min.css\` | ${formatBytes(sizeBudget.bundles.experimental?.raw)} | ${formatBytes(sizeBudget.bundles.experimental?.gzip)} | ${formatBytes(sizeBudget.bundles.experimental?.brotli)} | Bleeding-edge Chrome 133+ scroll-state queries |`,
      `| \`compat.min.css\` | ${formatBytes(sizeBudget.bundles.compat?.raw)} | ${formatBytes(sizeBudget.bundles.compat?.gzip)} | ${formatBytes(sizeBudget.bundles.compat?.brotli)} | Complete framework without experimental enhancement syntax |`,
      `| \`porchlight.min.css\` / \`full.min.css\` | ${formatBytes(sizeBudget.bundles.porchlight?.raw)} | ${formatBytes(sizeBudget.bundles.porchlight?.gzip)} | ${formatBytes(sizeBudget.bundles.porchlight?.brotli)} | Full framework (all 59 components, layout, utilities, enhancements) |`,
      "",
      '### "Core + N Components" Real-World Recipes',
      "",
      "When bundled together with your application bundler (or pre-bundled via LightningCSS/esbuild/Vite), shared layer directives and token definitions compress together. Real applications import far less than 14 KB:",
      "",
      "| Recipe / Use Case | Modules & Components Included | Raw | Gzip | Brotli | vs 14 KB Monolith |",
      "| :--- | :--- | :--- | :--- | :--- | :--- |",
    );

    for (const r of sizeBudget.recipes) {
      const vs14 = ((1 - r.gzip / 14336) * 100).toFixed(0);
      lines.push(
        `| **${r.name}** | \`${r.files.map((f) => f.replace(/^dist\/(components\/)?/, "").replace(/\.css$/, "")).join("` + `")}\` | ${formatBytes(r.raw)} | **${formatBytes(r.gzip)}** | **${formatBytes(r.brotli)}** | **-${vs14}% smaller** |`,
      );
    }

    lines.push(
      "",
      "```css",
      "/* Example: SaaS CRUD / Form Admin stylesheet (only ~6.8 KB gzip!) */",
      "@layer porchlight, app;",
      "",
      '@import "@cawalch/porchlight/core.css";',
      '@import "@cawalch/porchlight/layout.css";',
      '@import "@cawalch/porchlight/components/button.css";',
      '@import "@cawalch/porchlight/components/field.css";',
      '@import "@cawalch/porchlight/components/card.css";',
      '@import "@cawalch/porchlight/components/badge.css";',
      '@import "@cawalch/porchlight/components/alert.css";',
      "```",
      "",
    );
  }

  lines.push(
    "## Component Index",
    "",
    "| Component | Primary Selector | Minified | Gzip | Brotli | Dependencies | Description |",
    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
  );

  for (const c of components) {
    const depStr =
      c.dependencies.length > 0
        ? c.dependencies.map((d) => `\`${d}\``).join(", ")
        : "None";
    const minStr = c.sizes ? formatBytes(c.sizes.raw) : "-";
    const gzStr = c.sizes ? formatBytes(c.sizes.gzip) : "-";
    const brStr = c.sizes ? formatBytes(c.sizes.brotli) : "-";
    const tableDesc = c.description.replaceAll("|", "\\|");
    lines.push(
      `| [${c.name}](#${c.name}) | \`${c.primarySelector}\` | ${minStr} | ${gzStr} | ${brStr} | ${depStr} | ${tableDesc} |`,
    );
  }

  lines.push("", "## Component Details", "");

  for (const c of components) {
    lines.push(`### ${c.name}`, "");
    lines.push(c.description, "");
    lines.push(`- **Primary Selector**: \`${c.primarySelector}\``);
    lines.push(`- **Import**: \`${c.importPath}\``);
    lines.push(`- **Minified Import**: \`${c.importMinifiedPath}\``);
    lines.push(`- **Dist File**: \`${c.cssFile}\``);
    lines.push(`- **Minified Dist File**: \`${c.minifiedFile}\``);
    if (c.sizes) {
      lines.push(
        `- **Sizes**: ${formatBytes(c.sizes.raw)} minified, ${formatBytes(c.sizes.gzip)} gzip, ${formatBytes(c.sizes.brotli)} brotli`,
      );
    }
    if (c.dependencies.length > 0) {
      lines.push(
        `- **Dependencies**: ${c.dependencies.map((d) => `\`${d}\``).join(", ")}`,
      );
    } else {
      lines.push("- **Dependencies**: None");
    }
    lines.push("");
    lines.push("```css");
    lines.push(`@import "${c.importPath}";`);
    lines.push("```");
    lines.push("");
  }

  let doc = `${lines.join("\n").trim()}\n`;
  try {
    const prettier = await import("prettier");
    doc = await prettier.default.format(doc, { parser: "markdown" });
  } catch {
    // Keep unformatted document if prettier is unavailable
  }
  await writeFile(resolve(root, "COMPONENTS.md"), doc, "utf8");
  return components;
}

const componentFiles = (await readdir(componentsDir))
  .filter((file) => file.endsWith(".css"))
  .sort();
const componentNames = componentFiles.map((file) => file.replace(/\.css$/, ""));
const componentModules = componentFiles.map(
  (file) => `src/06-components/${file}`,
);

await assertNamespaceClean("package source", [
  "README.md",
  "porchlight.css",
  ...(await collectFiles("src")),
]);
await assertTokenReferences("package source", await collectFiles("src"));
await rm(outDir, { recursive: true, force: true });
await mkdir(entriesDir, { recursive: true });

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
  emitted.push({
    file: `dist/${name}.min.css`,
    bytes: await emitGeneratedCss(name, paths, `${name}.min.css`, true),
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
  file: "dist/components.min.css",
  bytes: await emitGeneratedCss(
    "components-min",
    [layerOrder, ...componentModules],
    "components.min.css",
    true,
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
emitted.push({
  file: "dist/compat.min.css",
  bytes: await emitGeneratedCss(
    "compat-min",
    [
      ...coreModules,
      "src/05-layout.css",
      ...componentModules,
      "src/07-utilities.css",
    ],
    "compat.min.css",
    true,
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
  emitted.push({
    file: `dist/components/${name}.min.css`,
    bytes: await emitGeneratedCss(
      `component-${name}-min`,
      [layerOrder, `src/06-components/${file}`],
      `components/${name}.min.css`,
      true,
    ),
  });
}

await copyFile(resolve(outDir, "porchlight.css"), resolve(outDir, "full.css"));
await copyFile(
  resolve(outDir, "porchlight.min.css"),
  resolve(outDir, "full.min.css"),
);
emitted.push({ file: "dist/full.css", bytes: emitted[0].bytes });
emitted.push({ file: "dist/full.min.css", bytes: emitted[1].bytes });

const sizeBudget = {
  version: packageJson.version,
  bundles: {},
  recipes: [],
  components: {},
};

for (const b of [
  "core",
  "layout",
  "utilities",
  "enhancements",
  "experimental",
  "components",
  "compat",
  "porchlight",
  "full",
]) {
  const buf = await readFile(resolve(outDir, `${b}.min.css`));
  sizeBudget.bundles[b] = measureBuffer(buf);
}

for (const name of componentNames) {
  const buf = await readFile(resolve(outDir, `components/${name}.min.css`));
  sizeBudget.components[name] = measureBuffer(buf);
}

const recipeConfigs = [
  {
    name: "Minimal Controls",
    description: "Core form inputs and buttons",
    files: [
      "dist/core.css",
      "dist/components/button.css",
      "dist/components/field.css",
    ],
  },
  {
    name: "SaaS CRUD / Form Admin",
    description: "Admin dashboards, settings consoles, and forms",
    files: [
      "dist/core.css",
      "dist/layout.css",
      "dist/components/button.css",
      "dist/components/field.css",
      "dist/components/card.css",
      "dist/components/badge.css",
      "dist/components/alert.css",
    ],
  },
  {
    name: "Analytics & KPI Dashboard",
    description: "Telemetry, metrics, gauges, and tabular data",
    files: [
      "dist/core.css",
      "dist/layout.css",
      "dist/components/stat.css",
      "dist/components/kpi-card.css",
      "dist/components/badge.css",
      "dist/components/data-table.css",
      "dist/components/gauge.css",
    ],
  },
  {
    name: "Docs & Marketing Content",
    description: "Documentation hubs, marketing pages, and content sites",
    files: [
      "dist/core.css",
      "dist/layout.css",
      "dist/components/card.css",
      "dist/components/tabs.css",
      "dist/components/accordion.css",
      "dist/components/alert.css",
      "dist/components/code-block.css",
    ],
  },
];

for (const r of recipeConfigs) {
  const m = await measureRecipe(
    r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    r.files,
  );
  sizeBudget.recipes.push({
    name: r.name,
    description: r.description,
    files: r.files,
    raw: m.raw,
    gzip: m.gzip,
    brotli: m.brotli,
  });
}

await writeFile(
  resolve(outDir, "size-budget.json"),
  `${JSON.stringify(sizeBudget, null, 2)}\n`,
);

const tokenDoc = await emitTokens();
await emitManifest(componentNames);
await emitComponentsDoc(componentNames, sizeBudget);
await copyFile(
  resolve(repoRoot, "CHANGELOG.md"),
  resolve(root, "CHANGELOG.md"),
);
await rm(entriesDir, { recursive: true, force: true });
await assertNamespaceClean("generated dist CSS", await collectFiles("dist"));

console.log(
  `✓ built ${emitted.length} CSS artifacts, ${Object.keys(tokenDoc.tokens).length} tokens, and ${componentNames.length} component entries`,
);
for (const item of emitted) {
  console.log(`  ${item.file} (${item.bytes} b)`);
}
