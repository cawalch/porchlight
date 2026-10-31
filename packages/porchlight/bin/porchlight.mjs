#!/usr/bin/env node
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(packageRoot, "dist");
const packageJson = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8"),
);

const usage = `Usage:
  porchlight <command> [options]

Commands:
  copy       Copy selected Porchlight CSS and manifest files to an output directory
  init       Scaffold a starter HTML page configured with Porchlight
  tokens     Inspect and query Porchlight design tokens

Options:
  --help, -h       Show this help
  --version, -v    Show Porchlight version (${packageJson.version})

Run "porchlight <command> --help" for help on a specific command.
`;

const copyUsage = `Usage:
  porchlight copy --out <dir> [options]

Options:
  --compat                 Copy compat.css (default when no bundle/components are selected)
  --full                   Copy porchlight.css
  --min                    Copy porchlight.min.css
  --core                   Copy core.css
  --layout                 Copy layout.css
  --utilities              Copy utilities.css
  --enhancements           Copy enhancements.css
  --components <list>      Copy component CSS files, comma-separated or repeated
  --all-components         Copy components.css
  --manifest               Copy porchlight.manifest.json (default)
  --no-manifest            Do not copy porchlight.manifest.json
  --clean                  Remove the output directory before copying
  --dry-run                Print files without copying
  --help, -h               Show this help

Examples:
  porchlight copy --out public/porchlight --compat
  porchlight copy --out public/porchlight --components button,field --layout --utilities
  porchlight copy --out public/porchlight --full
`;

const initUsage = `Usage:
  porchlight init [options]

Options:
  --out <file>             Target HTML file to create (default: index.html)
  --stdout                 Print starter template to stdout instead of writing to a file
  --cdn                    Link to Porchlight via CDN (default)
  --local                  Link to local porchlight.min.css
  --title <title>          Set document <title> (default: "Porchlight App")
  --force                  Overwrite target file if it already exists
  --help, -h               Show this help

Examples:
  porchlight init
  porchlight init --out src/index.html --local
  porchlight init --stdout > app.html
`;

const tokensUsage = `Usage:
  porchlight tokens [query] [options]

Options:
  --group <name>           Filter tokens by group / category name (case-insensitive)
  --json                   Output matching tokens as JSON
  --help, -h               Show this help

Examples:
  porchlight tokens
  porchlight tokens color
  porchlight tokens radius
  porchlight tokens --group Fonts
  porchlight tokens --group Colors --json
`;

function fail(message, commandUsage = usage) {
  console.error(`porchlight: ${message}`);
  console.error("");
  console.error(commandUsage);
  process.exit(1);
}

function addComponents(target, value) {
  for (const name of value.split(",")) {
    const trimmed = name.trim();
    if (trimmed) {
      target.add(trimmed);
    }
  }
}

function parseCopyArgs(argv) {
  const options = {
    components: new Set(),
    manifest: true,
    clean: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "copy":
        break;
      case "--out":
        options.out = argv[++i];
        if (!options.out) {
          fail("--out requires a directory", copyUsage);
        }
        break;
      case "--compat":
        options.compat = true;
        break;
      case "--full":
        options.full = true;
        break;
      case "--min":
        options.min = true;
        break;
      case "--core":
        options.core = true;
        break;
      case "--layout":
        options.layout = true;
        break;
      case "--utilities":
        options.utilities = true;
        break;
      case "--enhancements":
        options.enhancements = true;
        break;
      case "--components":
        if (!argv[i + 1]) {
          fail("--components requires a comma-separated list", copyUsage);
        }
        addComponents(options.components, argv[++i]);
        break;
      case "--all-components":
        options.allComponents = true;
        break;
      case "--manifest":
        options.manifest = true;
        break;
      case "--no-manifest":
        options.manifest = false;
        break;
      case "--clean":
        options.clean = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        console.log(copyUsage);
        process.exit(0);
        break;
      default:
        fail(`unknown option ${arg}`, copyUsage);
    }
  }

  if (!options.out) {
    fail("missing --out <dir>", copyUsage);
  }

  return options;
}

async function readManifest() {
  const manifestPath = resolve(distRoot, "porchlight.manifest.json");
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    fail(`unable to read manifest from ${manifestPath}. Run build first.`);
  }
}

async function readTokens() {
  const tokensPath = resolve(distRoot, "tokens.json");
  try {
    return JSON.parse(await readFile(tokensPath, "utf8"));
  } catch {
    fail(`unable to read tokens from ${tokensPath}. Run build first.`);
  }
}

function addFile(files, source, destination = source) {
  files.set(source, destination);
}

function selectFiles(options, manifest) {
  const files = new Map();
  const hasExplicitSelection =
    options.compat ||
    options.full ||
    options.min ||
    options.core ||
    options.layout ||
    options.utilities ||
    options.enhancements ||
    options.allComponents ||
    options.components.size > 0;

  if (!hasExplicitSelection) {
    options.compat = true;
  }

  const useMinified = Boolean(options.min);
  const isModularSelection =
    options.core ||
    options.layout ||
    options.utilities ||
    options.enhancements ||
    options.allComponents ||
    options.components.size > 0;

  if (options.full) addFile(files, manifest.files.full);
  if (options.min && !isModularSelection && !options.compat) {
    addFile(files, manifest.files.minified);
  }
  if (options.compat) {
    addFile(
      files,
      useMinified && manifest.files.compatMinified
        ? manifest.files.compatMinified
        : manifest.files.compat,
    );
  }
  if (options.core || options.components.size > 0 || options.allComponents) {
    addFile(
      files,
      useMinified && manifest.files.coreMinified
        ? manifest.files.coreMinified
        : manifest.files.core,
    );
  }
  if (options.layout) {
    addFile(
      files,
      useMinified && manifest.files.layoutMinified
        ? manifest.files.layoutMinified
        : manifest.files.layout,
    );
  }
  if (options.allComponents) {
    addFile(
      files,
      useMinified && manifest.files.componentsMinified
        ? manifest.files.componentsMinified
        : manifest.files.components,
    );
  }
  if (options.utilities) {
    addFile(
      files,
      useMinified && manifest.files.utilitiesMinified
        ? manifest.files.utilitiesMinified
        : manifest.files.utilities,
    );
  }
  if (options.enhancements) {
    addFile(
      files,
      useMinified && manifest.files.enhancementsMinified
        ? manifest.files.enhancementsMinified
        : manifest.files.enhancements,
    );
  }

  const componentsByName = new Map(
    manifest.components.map((component) => [component.name, component]),
  );
  for (const component of options.components) {
    const entry = componentsByName.get(component);
    if (!entry) {
      const names = [...componentsByName.keys()].join(", ");
      fail(
        `unknown component "${component}". Available components: ${names}`,
        copyUsage,
      );
    }
    for (const dependency of entry.dependencies ?? []) {
      const required = componentsByName.get(dependency);
      if (!required) {
        fail(
          `component "${component}" requires unknown component "${dependency}"`,
          copyUsage,
        );
      }
      addFile(
        files,
        useMinified && required.minified ? required.minified : required.file,
      );
    }
    addFile(files, useMinified && entry.minified ? entry.minified : entry.file);
  }

  if (options.manifest) {
    addFile(files, "dist/porchlight.manifest.json");
  }

  return [...files.entries()].map(([source, destination]) => ({
    source,
    destination,
  }));
}

async function copySelected(files, options) {
  const outDir = resolve(process.cwd(), options.out);
  if (options.clean && !options.dryRun) {
    await rm(outDir, { recursive: true, force: true });
  }
  if (!options.dryRun) {
    await mkdir(outDir, { recursive: true });
  }

  for (const file of files) {
    const source = resolve(packageRoot, file.source);
    const destination = resolve(outDir, relative("dist", file.destination));
    if (options.dryRun) {
      console.log(`${file.source} -> ${destination}`);
      continue;
    }
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    console.log(
      `copied ${file.source} -> ${relative(process.cwd(), destination)}`,
    );
  }
}

async function runInit(argv) {
  let out = "index.html";
  let toStdout = false;
  let useLocal = false;
  let title = "Porchlight App";
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--out":
        out = argv[++i];
        if (!out) fail("init: --out requires a file path", initUsage);
        break;
      case "--stdout":
        toStdout = true;
        break;
      case "--cdn":
        useLocal = false;
        break;
      case "--local":
        useLocal = true;
        break;
      case "--title":
        title = argv[++i];
        if (!title) fail("init: --title requires a value", initUsage);
        break;
      case "--force":
        force = true;
        break;
      case "--help":
      case "-h":
        console.log(initUsage);
        return;
      default:
        fail(`init: unknown option ${arg}`, initUsage);
    }
  }

  const cssLink = useLocal
    ? `<link rel="stylesheet" href="./porchlight.min.css" />`
    : `<link rel="stylesheet" href="https://unpkg.com/@cawalch/porchlight@^${packageJson.version}/dist/porchlight.min.css" />`;

  const template = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <!-- Porchlight native-CSS framework (declares @layer porchlight.*) -->
    ${cssLink}
  </head>
  <body>
    <div class="pl-l-box pl-u-flow">
      <header
        class="pl-l-cluster"
        style="justify-content: space-between; border-block-end: 1px solid var(--pl-color-border); padding-block-end: var(--pl-space-3);"
      >
        <div class="pl-l-cluster">
          <strong>Porchlight</strong>
          <span class="pl-c-badge" data-tone="accent">Starter</span>
        </div>
        <nav class="pl-l-cluster">
          <a href="#" class="pl-c-button" data-variant="ghost">Docs</a>
          <button type="button" class="pl-c-button" data-variant="primary">Get Started</button>
        </nav>
      </header>

      <main class="pl-l-stack">
        <section class="pl-c-card">
          <header class="pl-c-card__header">
            <h2 class="pl-c-card__title">Welcome to Porchlight</h2>
          </header>
          <div class="pl-c-card__body pl-u-flow">
            <p>
              Porchlight is a zero-dependency, native-CSS framework built on modern
              web standards: Cascade Layers, CSS Nesting, OKLCH colors, and container queries.
            </p>
          </div>
          <footer class="pl-c-card__footer pl-l-cluster">
            <button type="button" class="pl-c-button" data-variant="primary">Primary Action</button>
            <button type="button" class="pl-c-button" data-variant="secondary">Secondary Action</button>
          </footer>
        </section>
      </main>
    </div>
  </body>
</html>
`;

  if (toStdout) {
    process.stdout.write(template);
    return;
  }

  const targetPath = resolve(process.cwd(), out);
  if (!force) {
    try {
      await readFile(targetPath);
      fail(
        `target file "${out}" already exists. Use --force to overwrite.`,
        initUsage,
      );
    } catch {
      // file does not exist, proceed
    }
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, template, "utf8");
  console.log(
    `✓ created starter HTML template at ${relative(process.cwd(), targetPath)}`,
  );
}

async function runTokens(argv) {
  let query = "";
  let groupFilter = "";
  let asJson = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--group":
        groupFilter = argv[++i];
        if (!groupFilter)
          fail("tokens: --group requires a group name", tokensUsage);
        break;
      case "--json":
        asJson = true;
        break;
      case "--help":
      case "-h":
        console.log(tokensUsage);
        return;
      default:
        if (arg.startsWith("-")) {
          fail(`tokens: unknown option ${arg}`, tokensUsage);
        }
        if (!query) {
          query = arg;
        } else {
          query += ` ${arg}`;
        }
    }
  }

  const tokensDoc = await readTokens();
  const q = query.toLowerCase().trim();
  const gf = groupFilter.toLowerCase().trim();

  const matchedGroups = [];
  let totalTokens = 0;

  for (const group of tokensDoc.tokenGroups ?? []) {
    if (gf && !group.name.toLowerCase().includes(gf)) {
      continue;
    }
    const matchedTokens = group.tokens.filter((t) => {
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.value.toLowerCase().includes(q) ||
        t.group?.toLowerCase().includes(q)
      );
    });

    if (matchedTokens.length > 0) {
      matchedGroups.push({
        name: group.name,
        tokens: matchedTokens,
      });
      totalTokens += matchedTokens.length;
    }
  }

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          version: tokensDoc.version,
          total: totalTokens,
          groups: matchedGroups,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (matchedGroups.length === 0) {
    const filterDesc = [
      query ? `query "${query}"` : null,
      groupFilter ? `group "${groupFilter}"` : null,
    ]
      .filter(Boolean)
      .join(" and ");
    console.log(`No tokens matched ${filterDesc || "criteria"}.`);
    return;
  }

  for (const group of matchedGroups) {
    console.log(
      `\nGroup: ${group.name} (${group.tokens.length} token${group.tokens.length === 1 ? "" : "s"})`,
    );
    const maxNameLen = Math.min(
      40,
      Math.max(...group.tokens.map((t) => t.name.length)),
    );
    for (const t of group.tokens) {
      console.log(`  ${t.name.padEnd(maxNameLen)}  ${t.value}`);
    }
  }

  console.log(
    `\nShowing ${totalTokens} token${totalTokens === 1 ? "" : "s"} across ${matchedGroups.length} group${matchedGroups.length === 1 ? "" : "s"}.`,
  );
}

const args = process.argv.slice(2);
const firstArg = args[0];

if (!firstArg || firstArg === "--help" || firstArg === "-h") {
  console.log(usage);
  process.exit(0);
}

if (firstArg === "--version" || firstArg === "-v") {
  console.log(packageJson.version);
  process.exit(0);
}

if (firstArg === "copy") {
  const options = parseCopyArgs(args.slice(1));
  const manifest = await readManifest();
  const files = selectFiles(options, manifest);
  await copySelected(files, options);
} else if (firstArg === "init") {
  await runInit(args.slice(1));
} else if (firstArg === "tokens") {
  await runTokens(args.slice(1));
} else if (firstArg.startsWith("--out") || firstArg.startsWith("-")) {
  const options = parseCopyArgs(args);
  const manifest = await readManifest();
  const files = selectFiles(options, manifest);
  await copySelected(files, options);
} else {
  fail(`unknown command "${firstArg}"`);
}
