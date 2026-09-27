# Porchlight

Native CSS for app interfaces: tokens, themes, layout primitives, components,
utilities, and progressive enhancements. No JavaScript runtime is required.

[![status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)](#status)
[![license: MIT](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

Docs and previews: <https://cawalch.github.io/porchlight>

## Install

```sh
npm install @cawalch/porchlight
# or
pnpm add @cawalch/porchlight
# or
bun add @cawalch/porchlight
```

Import the full built stylesheet from your app's bundler-resolved CSS entry:

```css
@layer porchlight, app;
@import "@cawalch/porchlight";

@layer app {
  .billing-panel {
    --pl-c-card-padding: var(--pl-space-6);
  }
}
```

Or import only the parts you use:

```css
@layer porchlight, app;

@import "@cawalch/porchlight/core.css";
@import "@cawalch/porchlight/layout.css";
@import "@cawalch/porchlight/components/button.css";
@import "@cawalch/porchlight/components/card.css";
@import "@cawalch/porchlight/components/field.css";
@import "@cawalch/porchlight/utilities.css";
```

`core.css` includes layer order, reset, tokens, themes, and base styles.
Component files expect it to load first. Bun's CSS bundler needs `compat.css`
or selected imports; the full bundle requires the static-copy path. See the
[installation and Bun guide](https://cawalch.github.io/porchlight/guides/getting-started).
Bun can install the package independently of which CSS bundler you use.

## Use It

Porchlight components are HTML/CSS contracts. Bring your own rendering layer:
server templates, Astro, React, Vue, htmx, plain HTML, or something else.

```html
<section class="pl-c-card billing-panel" data-surface="app">
  <header class="pl-c-card__header">
    <h2 class="pl-c-card__title">Billing contact</h2>
    <button class="pl-c-button" data-variant="ghost" type="button">Edit</button>
  </header>
  <div class="pl-c-card__body">
    <label class="pl-c-field">
      <span class="pl-c-field__label">Email</span>
      <input
        class="pl-c-field__control"
        type="email"
        value="finance@example.com"
      />
      <span class="pl-c-field__hint">Invoices and receipts are sent here.</span>
    </label>
  </div>
  <footer class="pl-c-card__footer">
    <button class="pl-c-button" data-variant="secondary" type="button">
      Cancel
    </button>
    <button class="pl-c-button" data-variant="primary" type="submit">
      Save changes
    </button>
  </footer>
</section>
```

Layout primitives use the same pattern:

```html
<div class="pl-l-sidebar account-layout">
  <nav class="pl-c-nav" aria-label="Account sections">...</nav>
  <main class="pl-l-stack">...</main>
</div>
```

```css
@layer app {
  .account-layout {
    --pl-l-sidebar-size: 18rem;
    --pl-l-sidebar-gap: var(--pl-space-5);
  }
}
```

## What Ships

| Import path                            | Contents                            |
| -------------------------------------- | ----------------------------------- |
| `@cawalch/porchlight`                  | Full prebuilt CSS bundle            |
| `@cawalch/porchlight/compat.css`       | Core, layout, components, utilities |
| `@cawalch/porchlight/core.css`         | Layers, reset, tokens, themes, base |
| `@cawalch/porchlight/layout.css`       | `.pl-l-*` layout primitives         |
| `@cawalch/porchlight/components.css`   | All `.pl-c-*` component CSS         |
| `@cawalch/porchlight/components/*.css` | One component CSS file              |
| `@cawalch/porchlight/utilities.css`    | `.pl-u-*` helpers                   |
| `@cawalch/porchlight/tokens`           | Typed token metadata                |
| `@cawalch/porchlight/tokens.json`      | Token metadata JSON                 |
| `@cawalch/porchlight/manifest.json`    | Static-copy manifest                |

For static-file pipelines:

```sh
npx --no-install porchlight copy --out public/porchlight --compat
# Or choose a smaller slice:
npx --no-install porchlight copy --out public/porchlight --components button,field --layout --utilities
```

After the selected-component command, load all the copied CSS files:

```html
<link rel="stylesheet" href="/porchlight/core.css" />
<link rel="stylesheet" href="/porchlight/layout.css" />
<link rel="stylesheet" href="/porchlight/components/button.css" />
<link rel="stylesheet" href="/porchlight/components/field.css" />
<link rel="stylesheet" href="/porchlight/utilities.css" />
<link rel="stylesheet" href="/app.css" />
```

For `--compat`, load `/porchlight/compat.css` instead. These URLs assume
`public/` is served at `/`; adjust them for your deployment base path.
The commands use the locally installed package's `porchlight` executable.

## Source Layout

```text
packages/porchlight/src/
  00-layer-order.css
  01-reset.css
  02-tokens.css
  03-themes.css
  04-base.css
  05-layout.css
  06-components/*.css
  07-utilities.css
  08-enhancements.css

docs/src/content/components/*.mdx
docs/src/pages/preview/*.astro
```

## Browser Support

Chromium is the primary test target; Firefox and WebKit have limited smoke
coverage. Component styles require `@scope` (Firefox 146+, not 135).
`compat.css` omits the enhancement layer to help CSS parsers; it is not an
old-browser polyfill. See the [support guide](https://cawalch.github.io/porchlight/guides/browser-support).

## Status

Porchlight is pre-1.0. Token names, component class contracts, and bundle
structure can still change before `v1.0.0`.

## Development

Use Node.js 22.12+ and the pinned pnpm 10 toolchain; see contributor setup below.

```sh
pnpm install
pnpm dev          # docs site
pnpm build        # package + docs build
pnpm test         # docs Playwright suite
pnpm lint         # stylelint
pnpm lint:js      # biome
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, PR, and preview-deployment
workflow details.

## License

[MIT](LICENSE) © cawalch
