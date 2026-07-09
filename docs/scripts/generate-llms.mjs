import { readdir, readFile, writeFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const PUBLIC = new URL("public/", ROOT);

const paths = {
  short: new URL("llms.txt", PUBLIC),
  full: new URL("llms-full.txt", PUBLIC),
};

const sourcePaths = {
  components: new URL("src/content/components/", ROOT),
  previews: new URL("src/pages/preview/", ROOT),
};

const baseUrl = "https://cawalch.github.io/porchlight/";

const primaryLinks = [
  ["Getting started", "/guides/getting-started"],
  ["Composition recipes", "/guides/composition-recipes"],
  ["Layout primitives", "/guides/layout"],
  ["Utilities", "/guides/utilities"],
  ["Browser support", "/guides/browser-support"],
  ["Component reference", "/components"],
  ["Preview gallery", "/preview"],
  ["Full model pack", "/llms-full.txt"],
];

const bestExamples = [
  [
    "/preview/app-list-detail",
    "list/detail workspace with a persistent table and selected-record panel",
  ],
  [
    "/preview/app-queue-triage",
    "queue triage workspace with SLA lanes, priority list, and decision fields",
  ],
  [
    "/preview/app-process-builder",
    "process builder/admin shell with library, draft map, and inspector panel",
  ],
  [
    "/preview/app-settings-console",
    "settings console with local navigation, forms, alerts, and danger zone",
  ],
  [
    "/preview/app-reporting-dashboard",
    "reporting dashboard with filters, KPIs, charts, and breakdown table",
  ],
  [
    "/preview/app-command-workspace",
    "command-driven workspace with palette, result cards, detail, and feedback",
  ],
  [
    "/preview/app-dashboard",
    "full app shell with KPI grid, data table, nav, and page actions",
  ],
  ["/preview/dashboard", "compact dashboard composition proof"],
  ["/preview/app-dense", "dense admin/data-console layout"],
  ["/preview/app-cases", "case queue with filters and detail panel"],
  [
    "/preview/form",
    "forms, grids, input groups, choice groups, and validation states",
  ],
  [
    "/preview/field",
    "native controls, messages, required markers, and framework-neutral validation",
  ],
];

const coreRules = [
  "Use layout primitives for structure: pl-l-app-shell, pl-l-container, pl-l-stack, pl-l-grid, pl-l-cluster, pl-l-sidebar.",
  "Use components for semantics and chrome: pl-c-card, pl-c-toolbar, pl-c-page-header, pl-c-form, pl-c-field, pl-c-table-wrap, pl-c-table, pl-c-pagination, pl-c-nav, pl-c-stat, pl-c-tabs, pl-c-badge.",
  "Use utilities only for small adjustments: pl-u-muted, pl-u-muted-sm, pl-u-truncate, pl-u-sr-only, pl-u-min-0.",
  "Use real HTML semantics: table, thead, tbody, th, td, form, fieldset, legend, label, input, select, textarea, button, a, nav, main, section, h1-h3.",
  "Prefer Porchlight tokens such as --pl-space-* and --pl-color-* over new app-local spacing and color scales.",
  "Keep app CSS small and local. Add app CSS for page-specific widths, one-off splits, or product-specific alignment only.",
];

const avoidRules = [
  "Do not make div-based tables. Use table/thead/tbody/tr/th/td inside pl-c-table-wrap.",
  "Do not put page headers inside pl-c-toolbar. Use pl-c-page-header inside padded content; use pl-c-toolbar on data-region edges.",
  "Do not nest cards inside cards for layout. Use pl-l-grid, pl-l-sidebar, pl-l-stack, or sibling pl-c-card elements.",
  "Do not omit pl-c-table-wrap around pl-c-table.",
  "Do not invent new spacing scales. Use pl-l-stack, pl-l-grid, pl-l-cluster, and --pl-space-* tokens.",
  "Do not use placeholders as the only labels. Use visible labels or pl-u-sr-only labels.",
  "Do not style framework state through app-specific class toggles when native attributes already exist. Prefer aria-selected, aria-current, aria-expanded, aria-invalid, disabled, required, and data-tone.",
  "Do not make htmx, Alpine, Vue, or React wrappers the Porchlight contract. Any renderer should emit the same native HTML.",
  "Do not build marketing-style hero layouts for SaaS/admin tools. Prefer dense but calm application surfaces.",
];

const recipeIndex = [
  [
    "App shell",
    "Use for workspaces, dashboards, inboxes, consoles, and admin tools.",
  ],
  [
    "List/detail workspace",
    "Use a split pane when users need to scan records and act on one selected item without route churn.",
  ],
  [
    "Queue triage",
    "Use workflow lanes, saved views, a priority table, and compact decision fields for operational review.",
  ],
  [
    "Process builder/admin shell",
    "Use a low-friction library/map/inspector layout for authoring workflows without exposing every advanced control at once.",
  ],
  [
    "Settings console",
    "Use local navigation, grouped native forms, alerts, and explicit destructive-action framing.",
  ],
  [
    "Reporting dashboard",
    "Use filter controls, KPI stats, chart shells, insight queues, and source tables for repeat reporting.",
  ],
  [
    "Command-driven workspace",
    "Use command palette semantics plus visible result/detail surfaces when commands are the primary app control.",
  ],
  [
    "Dashboard",
    "Use pl-c-page-header, pl-l-grid KPI cards, and app-surface cards.",
  ],
  [
    "Data region",
    "Use pl-c-card, pl-c-toolbar, pl-c-table-wrap, pl-c-table, and pagination.",
  ],
  [
    "Settings page",
    "Use pl-l-sidebar for local nav and pl-c-form/pl-c-field for real controls.",
  ],
  [
    "Dense admin",
    "Use density, truncation, numeric alignment, and real table semantics.",
  ],
  [
    "Validation form",
    "Use native constraints, aria-invalid, aria-describedby, and data-tone messages.",
  ],
];

const snippets = {
  appShell: `<div class="pl-l-app-shell">
  <header class="pl-l-app-shell__topbar">
    <div class="pl-l-cluster" style="--pl-l-cluster-justify: space-between;">
      <strong>Acme</strong>
      <button class="pl-c-button" data-variant="ghost">Search</button>
    </div>
  </header>
  <aside class="pl-l-app-shell__sidebar">
    <nav class="pl-c-nav" aria-label="Main navigation">
      <a class="pl-c-nav__item" href="/dashboard" aria-current="page">
        <span class="pl-c-nav__label">Dashboard</span>
      </a>
    </nav>
  </aside>
  <main class="pl-l-app-shell__main">
    <div class="pl-l-container pl-l-stack" style="--pl-l-stack-gap: var(--pl-space-6);">
      <!-- page sections -->
    </div>
  </main>
</div>`,
  dashboard: `<div class="pl-c-page-header">
  <div class="pl-c-page-header__heading">
    <h1 class="pl-c-page-header__title">Dashboard</h1>
    <span class="pl-c-page-header__subtitle">Overview of workspace health</span>
  </div>
  <div class="pl-c-page-header__actions">
    <button class="pl-c-button" data-variant="secondary">Export</button>
    <button class="pl-c-button" data-variant="primary">New report</button>
  </div>
</div>

<div class="pl-l-grid" style="--pl-l-grid-min: 14rem;">
  <section class="pl-c-card" data-surface="app">
    <div class="pl-c-card__body">
      <div class="pl-c-stat">
        <span class="pl-c-stat__label">Monthly revenue</span>
        <div class="pl-c-stat__value">$48,200<span class="pl-c-stat__unit">/mo</span></div>
        <span class="pl-c-stat__trend" data-direction="up">12.4%</span>
      </div>
    </div>
  </section>
</div>`,
  dataRegion: `<section class="pl-c-card" data-surface="app">
  <div class="pl-c-toolbar">
    <div class="pl-c-toolbar__group">
      <label class="pl-c-field">
        <span class="pl-u-sr-only">Search accounts</span>
        <input class="pl-c-field__control" type="search" placeholder="Search accounts..." />
      </label>
      <button class="pl-c-button" data-variant="ghost">Filter</button>
    </div>
    <div class="pl-c-toolbar__group">
      <button class="pl-c-button" data-variant="primary">New account</button>
    </div>
  </div>
  <div class="pl-c-table-wrap" style="border-inline: 0; border-radius: 0;">
    <table class="pl-c-table" style="--pl-c-table-min: 42rem;">
      <thead>
        <tr>
          <th class="pl-c-table__check"><input type="checkbox" aria-label="Select all" /></th>
          <th class="pl-c-table__sticky-col" data-sort="asc">Account <span class="pl-c-table__sort-icon"></span></th>
          <th>Status</th>
          <th data-align="end">MRR</th>
        </tr>
      </thead>
      <tbody>
        <tr aria-selected="true">
          <td class="pl-c-table__check"><input type="checkbox" checked aria-label="Select Acme" /></td>
          <td class="pl-c-table__sticky-col">Acme Ops</td>
          <td><span class="pl-c-badge" data-tone="success">Active</span></td>
          <td data-align="end">$2,400</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="pl-c-toolbar" style="border-block-end: 0; border-block-start: 1px solid var(--pl-color-border);">
    <div class="pl-c-toolbar__group"><span class="pl-u-muted-sm">Showing 1-10 of 247</span></div>
    <div class="pl-c-toolbar__group">
      <nav class="pl-c-pagination" aria-label="Accounts pagination">
        <button class="pl-c-pagination__nav" disabled>Prev</button>
        <button class="pl-c-pagination__page" aria-current="page">1</button>
        <button class="pl-c-pagination__nav">Next</button>
      </nav>
    </div>
  </div>
</section>`,
  settings: `<div class="pl-l-sidebar" style="--pl-l-sidebar-size: 14rem;">
  <nav class="pl-c-nav" aria-label="Settings sections">
    <a class="pl-c-nav__item" href="#profile" aria-current="page">
      <span class="pl-c-nav__label">Profile</span>
    </a>
  </nav>
  <section class="pl-c-card">
    <div class="pl-c-card__body">
      <form class="pl-c-form">
        <div class="pl-c-form__grid">
          <label class="pl-c-field">
            <span class="pl-c-field__label">Workspace name</span>
            <input class="pl-c-field__control" value="Acme Ops" />
          </label>
          <div class="pl-c-field">
            <label class="pl-c-field__label" for="workspace-slug">Workspace URL</label>
            <div class="pl-c-input-group">
              <input id="workspace-slug" class="pl-c-field__control" value="acme-ops" />
              <span class="pl-c-input-group__addon">.porchlight.app</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  </section>
</div>`,
  denseAdmin: `<main class="pl-l-app-shell__main" data-pl-density="dense">
  <div class="pl-l-container pl-l-stack" style="--pl-l-stack-gap: var(--pl-space-4);">
    <div class="pl-c-page-header">
      <div class="pl-c-page-header__heading">
        <h1 class="pl-c-page-header__title">Event queue</h1>
        <span class="pl-c-page-header__subtitle">1,248 events, 36 critical</span>
      </div>
    </div>
    <section class="pl-c-card" data-surface="app">
      <div class="pl-c-toolbar">
        <div class="pl-c-toolbar__group"><span class="pl-u-muted-sm">Filtered to production</span></div>
      </div>
      <div class="pl-c-table-wrap" data-pl-density="dense" style="border-inline: 0; border-radius: 0;">
        <table class="pl-c-table" style="--pl-c-table-min: 54rem;">
          <thead>
            <tr><th>Time</th><th>Host</th><th>Message</th><th data-align="end">Score</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><time>10:42:18</time></td>
              <td><code>api-04</code></td>
              <td class="pl-u-truncate" style="max-inline-size: 22rem;">Unexpected auth spike from edge region</td>
              <td data-align="end">98</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</main>`,
  validationForm: `<form class="pl-c-form">
  <div class="pl-c-form__grid">
    <label class="pl-c-field">
      <span class="pl-c-field__label">
        Workspace name
        <span class="pl-c-field__required" aria-hidden="true">*</span>
      </span>
      <input class="pl-c-field__control" required aria-describedby="workspace-name-help" />
      <span class="pl-c-field__hint" id="workspace-name-help">Use a name your team recognizes.</span>
    </label>

    <div class="pl-c-field">
      <label class="pl-c-field__label" for="workspace-url">Workspace URL</label>
      <div class="pl-c-input-group">
        <input
          id="workspace-url"
          class="pl-c-field__control"
          value="acme ops"
          aria-invalid="true"
          aria-describedby="workspace-url-help workspace-url-error"
        />
        <span class="pl-c-input-group__addon">.porchlight.app</span>
      </div>
      <span class="pl-c-field__messages">
        <span class="pl-c-field__hint" id="workspace-url-help">Use lowercase letters, numbers, and hyphens.</span>
        <span class="pl-c-field__hint" id="workspace-url-error" data-tone="danger" role="alert">Spaces are not allowed.</span>
      </span>
    </div>
  </div>
</form>`,
};

function bullets(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function links(items) {
  return items.map(([label, href]) => `- ${label}: ${href}`).join("\n");
}

function absoluteLinks(items) {
  return items
    .map(
      ([label, href]) =>
        `- ${label}: ${new URL(href.replace(/^\//, ""), baseUrl).toString()}`,
    )
    .join("\n");
}

function routeLinks(slugs, prefix) {
  return slugs.map((slug) => `- ${prefix}/${slug}`).join("\n");
}

function componentReference(componentLinks) {
  return componentLinks
    .map((slug) => `- ${slug}: /components/${slug}`)
    .join("\n");
}

function fenced(value) {
  return `\`\`\`html\n${value}\n\`\`\``;
}

async function slugsFrom(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => entry.name.slice(0, -extension.length))
    .filter((slug) => slug !== "index")
    .sort((a, b) => a.localeCompare(b));
}

function assertRoutesExist(previewLinks) {
  const knownPreviews = new Set(previewLinks);
  const missingPreviews = bestExamples
    .map(([route]) => route.replace(/^\/preview\//, ""))
    .filter((slug) => !knownPreviews.has(slug));

  if (missingPreviews.length > 0) {
    throw new Error(
      `Curated LLM preview routes are missing: ${missingPreviews.join(", ")}`,
    );
  }
}

async function loadReference() {
  const [componentLinks, previewLinks] = await Promise.all([
    slugsFrom(sourcePaths.components, ".mdx"),
    slugsFrom(sourcePaths.previews, ".astro"),
  ]);

  assertRoutesExist(previewLinks);

  return { componentLinks, previewLinks };
}

function renderShort() {
  return `# Porchlight LLM guide

> Porchlight is a no-dependency, native-CSS framework for modern SaaS and admin interfaces. It uses real HTML semantics, CSS custom properties, native CSS layers/scopes, and framework-agnostic component classes.

Use this short file to route quickly. Use /llms-full.txt when generating or refactoring full screens.

## Primary docs

${links(primaryLinks)}

## Core composition rules

${bullets(coreRules)}

## Avoid

${bullets(avoidRules)}

## Best first examples

${links(bestExamples)}

## Agent routing

- Building a full app screen: start with /guides/composition-recipes, then copy the closest /preview/app-* pattern.
- Building list/detail UX: use /components/app-list-detail and /preview/app-list-detail.
- Building triage UX: use /components/app-queue-triage and /preview/app-queue-triage.
- Building process/admin UX: use /components/app-process-builder and /preview/app-process-builder.
- Building settings UX: use /components/app-settings-console and /preview/app-settings-console.
- Building reporting UX: use /components/app-reporting-dashboard and /preview/app-reporting-dashboard.
- Building command-first UX: use /components/app-command-workspace and /preview/app-command-workspace.
- Building a table workflow: use /components/data-table and /preview/data-table.
- Building forms: use /components/form, /components/field, /preview/form, and /preview/field.
- Building dense/admin UX: use /components/app-dense and /preview/app-dense.
- Unsure which class exists: use /components first, then /preview for rendered composition.
`;
}

function renderFull({ componentLinks, previewLinks }) {
  return `# Porchlight model composition pack

> This file is optimized for coding agents that need to compose Porchlight components into working app screens. It is generated from the same source as /llms.txt so the short and full model guides stay synchronized.

## Project identity

Porchlight is a no-dependency, native-CSS framework for SaaS applications, admin consoles, dense data tools, and model-generated UI. It is not Tailwind, Bootstrap, CSS-in-JS, a React component library, or a JavaScript runtime. Components are HTML/CSS contracts: any server, HATEOAS flow, htmx swap, Alpine state, Vue component, React component, or plain HTML template should emit the same semantic DOM.

Base docs URL: ${baseUrl}

## Mental model

Porchlight has three composition layers:

${bullets(coreRules)}

## Agent decision flow

1. Pick the closest recipe: ${recipeIndex.map(([name]) => name).join(", ")}.
2. Preserve semantic HTML first, then add Porchlight classes.
3. Use preview pages as visual truth and component pages as class-contract truth.
4. Add app CSS only when a local product layout cannot be expressed with existing layout primitives or tokens.
5. Verify mobile, 200% zoom, keyboard focus, reduced motion, forced colors, and RTL when changing shared components.

## Avoid

${bullets(avoidRules)}

## Recipe index

${recipeIndex.map(([name, desc]) => `- ${name}: ${desc}`).join("\n")}

## App shell skeleton

${fenced(snippets.appShell)}

## Dashboard skeleton

${fenced(snippets.dashboard)}

## Data table region skeleton

${fenced(snippets.dataRegion)}

## Settings page skeleton

${fenced(snippets.settings)}

## Dense admin skeleton

${fenced(snippets.denseAdmin)}

## Validation form skeleton

${fenced(snippets.validationForm)}

## Component contracts

### Forms and fields

- Use real form, label, input, select, textarea, fieldset, and legend elements.
- Use .pl-c-form for section rhythm, .pl-c-form__grid for responsive fields, .pl-c-form__row for filter rows, and .pl-c-form__actions for submit/cancel actions.
- Use .pl-c-field for one labeled native control.
- Use .pl-c-field__required only as a visual marker; native required is the semantic source of truth.
- Use aria-describedby to connect hints and errors to controls.
- Use aria-invalid="true" for server/framework validation errors and remove it or set "false" for valid server state.
- Use .pl-c-field__hint[data-tone="warning|danger|success"] for message tone.
- Use .pl-c-field__messages when helper, warning, and error messages stack.
- Use .pl-c-input-group for prefix/suffix/action chrome around a native .pl-c-field__control.
- Use .pl-c-choice-group and .pl-c-choice-group__hint for checkbox/radio groups.

### Tables

- Always wrap .pl-c-table in .pl-c-table-wrap.
- Keep real table semantics: thead, tbody, tr, th, td.
- Use data-align="end" for numeric columns.
- Use data-sort="asc|desc" plus .pl-c-table__sort-icon for sortable headers.
- Use aria-selected="true" on selected rows.
- Use .pl-c-table__check for checkbox columns.
- Use .pl-c-table__sticky-col for sticky first columns.
- For row actions, keep row navigation and detail disclosure as separate real links/buttons.

### Toolbars and page headers

- Use .pl-c-page-header for title/action rows inside padded page content.
- Use .pl-c-toolbar on the edge of data regions, cards, and table headers/footers.
- Group controls with .pl-c-toolbar__group. Use .pl-c-toolbar__divider sparingly.

### Cards and surfaces

- Use pl-c-card for repeated items, panels, and framed data regions.
- Use data-surface="app" for operational app surfaces where the preview examples use it.
- Do not nest cards inside cards for layout.

### Navigation

- Use nav with aria-label.
- Use .pl-c-nav__item for links and aria-current="page" for the current item.
- Keep collapsed/icon variants accessible with labels.

### Status and feedback

- Use .pl-c-badge[data-tone] for compact status labels.
- Use .pl-c-alert[data-tone] for inline feedback blocks.
- Use .pl-c-toast[data-tone] for transient feedback.
- Valid tones are success, warning, and danger for most feedback components; accent/default is component-specific.

## Accessibility defaults

- Every interactive control needs an accessible name.
- Hidden labels should use .pl-u-sr-only, not placeholder-only naming.
- Keep focus indicators visible; do not remove outlines/rings in app CSS.
- Use aria-expanded with expandable controls and keep it synchronized with visibility.
- Use aria-controls when a control owns a specific panel/detail region.
- Use role="alert" only for dynamic error/status messages that should be announced.
- Keep disabled controls disabled with the native disabled attribute when they should be skipped and omitted from submission.
- Use readonly instead of disabled when a value should remain selectable or copyable.

## Framework compatibility

Porchlight selectors are framework-agnostic. Do not rely on hx-*, x-*, v-*, data-reactroot, framework-generated classes, or component wrapper names for styling. Render the stable HTML contract:

- Plain HTML: write the native DOM directly.
- Server/HATEOAS: return replacement fragments with the same classes and ARIA.
- htmx: swap standard HTML attributes and fragments; Porchlight only sees the final DOM.
- Alpine: bind standard attributes such as aria-invalid and disabled.
- Vue/React/Svelte/etc: components should emit the same final DOM and classes.

## Installation and cascade

\`\`\`css
@layer porchlight, app;
@import "@cawalch/porchlight";
\`\`\`

Use the prebuilt stylesheet where possible. If a bundler cannot parse modern CSS features, copy the prebuilt dist CSS to public assets and load it with a link tag.

## Browser and feature model

- Target modern evergreen browsers.
- Core CSS uses @layer, @scope, custom properties, OKLCH, light-dark(), color-mix(), :has(), logical properties, and container queries.
- Experimental or newer features are guarded where needed; base component behavior must remain usable without progressive enhancements.
- Prefer native CSS and semantic HTML before adding JavaScript.

## Primary docs

${links(primaryLinks)}

## Component reference

Generated from docs/src/content/components so this list tracks the documented component set.

${componentReference(componentLinks)}

## Best first examples

${links(bestExamples)}

## Preview reference

Generated from docs/src/pages/preview so this list tracks rendered examples.

${routeLinks(previewLinks, "/preview")}

## Absolute URLs

${absoluteLinks(primaryLinks)}
`;
}

async function updateFile(path, content, check) {
  let existing = "";
  try {
    existing = await readFile(path, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (existing === content) return false;

  if (check) {
    throw new Error(
      `${path.pathname} is out of date. Run pnpm --filter ./docs llms:generate.`,
    );
  }

  await writeFile(path, content);
  return true;
}

async function main() {
  const check = process.argv.includes("--check");
  const reference = await loadReference();
  const shortChanged = await updateFile(paths.short, renderShort(), check);
  const fullChanged = await updateFile(
    paths.full,
    renderFull(reference),
    check,
  );

  if (!check) {
    const changed = [
      shortChanged && "llms.txt",
      fullChanged && "llms-full.txt",
    ].filter(Boolean);
    console.log(
      changed.length > 0
        ? `Updated ${changed.join(", ")}`
        : "LLM files already up to date",
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
