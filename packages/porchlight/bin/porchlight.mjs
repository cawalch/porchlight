#!/usr/bin/env node
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = resolve(packageRoot, "dist");

const usage = `Usage:
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
  --help                   Show this help

Examples:
  porchlight copy --out public/porchlight --compat
  porchlight copy --out public/porchlight --components button,field --layout --utilities
  porchlight copy --out public/porchlight --full
`;

function fail(message) {
  console.error(`porchlight: ${message}`);
  console.error("");
  console.error(usage);
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

function parseArgs(argv) {
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
          fail("--out requires a directory");
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
          fail("--components requires a comma-separated list");
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
        console.log(usage);
        process.exit(0);
        break;
      default:
        fail(`unknown option ${arg}`);
    }
  }

  if (!options.out) {
    fail("missing --out <dir>");
  }

  return options;
}

async function readManifest() {
  return JSON.parse(
    await readFile(resolve(distRoot, "porchlight.manifest.json"), "utf8"),
  );
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

  if (options.full) addFile(files, manifest.files.full);
  if (options.min) addFile(files, manifest.files.minified);
  if (options.compat) addFile(files, manifest.files.compat);
  if (options.core || options.components.size > 0 || options.allComponents) {
    addFile(files, manifest.files.core);
  }
  if (options.layout) addFile(files, manifest.files.layout);
  if (options.allComponents) addFile(files, manifest.files.components);
  if (options.utilities) addFile(files, manifest.files.utilities);
  if (options.enhancements) addFile(files, manifest.files.enhancements);

  const componentsByName = new Map(
    manifest.components.map((component) => [component.name, component.file]),
  );
  for (const component of options.components) {
    const file = componentsByName.get(component);
    if (!file) {
      const names = [...componentsByName.keys()].join(", ");
      fail(`unknown component "${component}". Available components: ${names}`);
    }
    addFile(files, file);
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

const options = parseArgs(process.argv.slice(2));
const manifest = await readManifest();
const files = selectFiles(options, manifest);
await copySelected(files, options);
