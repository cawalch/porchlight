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
      tokens: {
        json: "dist/tokens.json",
        module: "dist/tokens.js",
        types: "dist/tokens.d.ts",
      },
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

async function emitComponentsDoc(componentNames) {
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
        ? scopeMatch[1].trim()
        : `.pl-c-${name}`;

    const deps = componentDependencies[name] ?? [];

    components.push({
      name,
      primarySelector,
      description,
      dependencies: deps,
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
    "## Component Index",
    "",
    "| Component | Primary Selector | Dependencies | Description |",
    "| :--- | :--- | :--- | :--- |",
  ];

  for (const c of components) {
    const depStr =
      c.dependencies.length > 0
        ? c.dependencies.map((d) => `\`${d}\``).join(", ")
        : "None";
    const tableDesc = c.description.replaceAll("|", "\\|");
    lines.push(
      `| [${c.name}](#${c.name}) | \`${c.primarySelector}\` | ${depStr} | ${tableDesc} |`,
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

  const doc = `${lines.join("\n").trim()}\n`;
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

const tokenDoc = await emitTokens();
await emitManifest(componentNames);
await emitComponentsDoc(componentNames);
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
