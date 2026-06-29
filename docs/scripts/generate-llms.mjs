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
  "Use layout primitives for structure: l-app-shell, l-container, l-stack, l-grid, l-cluster, l-sidebar.",
  "Use components for semantics and chrome: c-card, c-toolbar, c-page-header, c-form, c-field, c-table-wrap, c-table, c-pagination, c-nav, c-stat, c-tabs, c-badge.",
  "Use utilities only for small adjustments: u-muted, u-muted-sm, u-truncate, u-sr-only, u-min-0.",
  "Use real HTML semantics: table, thead, tbody, th, td, form, fieldset, legend, label, input, select, textarea, button, a, nav, main, section, h1-h3.",
  "Prefer Porchlight tokens such as --pl-space-* and --pl-color-* over new app-local spacing and color scales.",
  "Keep app CSS small and local. Add app CSS for page-specific widths, one-off splits, or product-specific alignment only.",
];

const avoidRules = [
  "Do not make div-based tables. Use table/thead/tbody/tr/th/td inside c-table-wrap.",
  "Do not put page headers inside c-toolbar. Use c-page-header inside padded content; use c-toolbar on data-region edges.",
  "Do not nest cards inside cards for layout. Use l-grid, l-sidebar, l-stack, or sibling c-card elements.",
  "Do not omit c-table-wrap around c-table.",
  "Do not invent new spacing scales. Use l-stack, l-grid, l-cluster, and --pl-space-* tokens.",
  "Do not use placeholders as the only labels. Use visible labels or u-sr-only labels.",
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
  ["Dashboard", "Use c-page-header, l-grid KPI cards, and app-surface cards."],
  [
    "Data region",
    "Use c-card, c-toolbar, c-table-wrap, c-table, and pagination.",
  ],
  [
    "Settings page",
    "Use l-sidebar for local nav and c-form/c-field for real controls.",
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
  appShell: `<div class="l-app-shell">
  <header class="l-app-shell__topbar">
    <div class="l-cluster" style="--l-cluster-justify: space-between;">
      <strong>Acme</strong>
      <button class="c-button" data-variant="ghost">Search</button>
    </div>
  </header>
  <aside class="l-app-shell__sidebar">
    <nav class="c-nav" aria-label="Main navigation">
      <a class="c-nav__item" href="/dashboard" aria-current="page">
        <span class="c-nav__label">Dashboard</span>
      </a>
    </nav>
  </aside>
  <main class="l-app-shell__main">
    <div class="l-container l-stack" style="--l-stack-gap: var(--pl-space-6);">
      <!-- page sections -->
    </div>
  </main>
</div>`,
  dashboard: `<div class="c-page-header">
  <div class="c-page-header__heading">
    <h1 class="c-page-header__title">Dashboard</h1>
    <span class="c-page-header__subtitle">Overview of workspace health</span>
  </div>
  <div class="c-page-header__actions">
    <button class="c-button" data-variant="secondary">Export</button>
    <button class="c-button" data-variant="primary">New report</button>
  </div>
</div>

<div class="l-grid" style="--l-grid-min: 14rem;">
  <section class="c-card" data-surface="app">
    <div class="c-card__body">
      <div class="c-stat">
        <span class="c-stat__label">Monthly revenue</span>
        <div class="c-stat__value">$48,200<span class="c-stat__unit">/mo</span></div>
        <span class="c-stat__trend" data-direction="up">12.4%</span>
      </div>
    </div>
  </section>
</div>`,
  dataRegion: `<section class="c-card" data-surface="app">
  <div class="c-toolbar">
    <div class="c-toolbar__group">
      <label class="c-field">
        <span class="u-sr-only">Search accounts</span>
        <input class="c-field__control" type="search" placeholder="Search accounts..." />
      </label>
      <button class="c-button" data-variant="ghost">Filter</button>
    </div>
    <div class="c-toolbar__group">
      <button class="c-button" data-variant="primary">New account</button>
    </div>
  </div>
  <div class="c-table-wrap" style="border-inline: 0; border-radius: 0;">
    <table class="c-table" style="--c-table-min: 42rem;">
      <thead>
        <tr>
          <th class="c-table__check"><input type="checkbox" aria-label="Select all" /></th>
          <th class="c-table__sticky-col" data-sort="asc">Account <span class="c-table__sort-icon"></span></th>
          <th>Status</th>
          <th data-align="end">MRR</th>
        </tr>
      </thead>
      <tbody>
        <tr aria-selected="true">
          <td class="c-table__check"><input type="checkbox" checked aria-label="Select Acme" /></td>
          <td class="c-table__sticky-col">Acme Ops</td>
          <td><span class="c-badge" data-tone="success">Active</span></td>
          <td data-align="end">$2,400</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="c-toolbar" style="border-block-end: 0; border-block-start: 1px solid var(--pl-color-border);">
    <div class="c-toolbar__group"><span class="u-muted-sm">Showing 1-10 of 247</span></div>
    <div class="c-toolbar__group">
      <nav class="c-pagination" aria-label="Accounts pagination">
        <button class="c-pagination__nav" disabled>Prev</button>
        <button class="c-pagination__page" aria-current="page">1</button>
        <button class="c-pagination__nav">Next</button>
      </nav>
    </div>
  </div>
</section>`,
  settings: `<div class="l-sidebar" style="--l-sidebar-size: 14rem;">
  <nav class="c-nav" aria-label="Settings sections">
    <a class="c-nav__item" href="#profile" aria-current="page">
      <span class="c-nav__label">Profile</span>
    </a>
  </nav>
  <section class="c-card">
    <div class="c-card__body">
      <form class="c-form">
        <div class="c-form__grid">
          <label class="c-field">
            <span class="c-field__label">Workspace name</span>
            <input class="c-field__control" value="Acme Ops" />
          </label>
          <div class="c-field">
            <label class="c-field__label" for="workspace-slug">Workspace URL</label>
            <div class="c-input-group">
              <input id="workspace-slug" class="c-field__control" value="acme-ops" />
              <span class="c-input-group__addon">.porchlight.app</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  </section>
</div>`,
  denseAdmin: `<main class="l-app-shell__main" data-density="dense">
  <div class="l-container l-stack" style="--l-stack-gap: var(--pl-space-4);">
    <div class="c-page-header">
      <div class="c-page-header__heading">
        <h1 class="c-page-header__title">Event queue</h1>
        <span class="c-page-header__subtitle">1,248 events, 36 critical</span>
      </div>
    </div>
    <section class="c-card" data-surface="app">
      <div class="c-toolbar">
        <div class="c-toolbar__group"><span class="u-muted-sm">Filtered to production</span></div>
      </div>
      <div class="c-table-wrap" data-density="dense" style="border-inline: 0; border-radius: 0;">
        <table class="c-table" style="--c-table-min: 54rem;">
          <thead>
            <tr><th>Time</th><th>Host</th><th>Message</th><th data-align="end">Score</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><time>10:42:18</time></td>
              <td><code>api-04</code></td>
              <td class="u-truncate" style="max-inline-size: 22rem;">Unexpected auth spike from edge region</td>
              <td data-align="end">98</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</main>`,
  validationForm: `<form class="c-form">
  <div class="c-form__grid">
    <label class="c-field">
      <span class="c-field__label">
        Workspace name
        <span class="c-field__required" aria-hidden="true">*</span>
      </span>
      <input class="c-field__control" required aria-describedby="workspace-name-help" />
      <span class="c-field__hint" id="workspace-name-help">Use a name your team recognizes.</span>
    </label>

    <div class="c-field">
      <label class="c-field__label" for="workspace-url">Workspace URL</label>
      <div class="c-input-group">
        <input
          id="workspace-url"
          class="c-field__control"
          value="acme ops"
          aria-invalid="true"
          aria-describedby="workspace-url-help workspace-url-error"
        />
        <span class="c-input-group__addon">.porchlight.app</span>
      </div>
      <span class="c-field__messages">
        <span class="c-field__hint" id="workspace-url-help">Use lowercase letters, numbers, and hyphens.</span>
        <span class="c-field__hint" id="workspace-url-error" data-tone="danger" role="alert">Spaces are not allowed.</span>
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
- Use .c-form for section rhythm, .c-form__grid for responsive fields, .c-form__row for filter rows, and .c-form__actions for submit/cancel actions.
- Use .c-field for one labeled native control.
- Use .c-field__required only as a visual marker; native required is the semantic source of truth.
- Use aria-describedby to connect hints and errors to controls.
- Use aria-invalid="true" for server/framework validation errors and remove it or set "false" for valid server state.
- Use .c-field__hint[data-tone="warning|danger|success"] for message tone.
- Use .c-field__messages when helper, warning, and error messages stack.
- Use .c-input-group for prefix/suffix/action chrome around a native .c-field__control.
- Use .c-choice-group and .c-choice-group__hint for checkbox/radio groups.

### Tables

- Always wrap .c-table in .c-table-wrap.
- Keep real table semantics: thead, tbody, tr, th, td.
- Use data-align="end" for numeric columns.
- Use data-sort="asc|desc" plus .c-table__sort-icon for sortable headers.
- Use aria-selected="true" on selected rows.
- Use .c-table__check for checkbox columns.
- Use .c-table__sticky-col for sticky first columns.
- For row actions, keep row navigation and detail disclosure as separate real links/buttons.

### Toolbars and page headers

- Use .c-page-header for title/action rows inside padded page content.
- Use .c-toolbar on the edge of data regions, cards, and table headers/footers.
- Group controls with .c-toolbar__group. Use .c-toolbar__divider sparingly.

### Cards and surfaces

- Use c-card for repeated items, panels, and framed data regions.
- Use data-surface="app" for operational app surfaces where the preview examples use it.
- Do not nest cards inside cards for layout.

### Navigation

- Use nav with aria-label.
- Use .c-nav__item for links and aria-current="page" for the current item.
- Keep collapsed/icon variants accessible with labels.

### Status and feedback

- Use .c-badge[data-tone] for compact status labels.
- Use .c-alert[data-tone] for inline feedback blocks.
- Use .c-toast[data-tone] for transient feedback.
- Valid tones are success, warning, and danger for most feedback components; accent/default is component-specific.

## Accessibility defaults

- Every interactive control needs an accessible name.
- Hidden labels should use .u-sr-only, not placeholder-only naming.
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
