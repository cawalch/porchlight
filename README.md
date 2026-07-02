# Porchlight

Native CSS for app interfaces: tokens, themes, layout primitives, components,
utilities, and progressive enhancements. No JavaScript runtime is required.

[![status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)](#status)
[![license: MIT](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

Docs and previews: <https://cawalch.github.io/porchlight>

## Install

```sh
pnpm add @cawalch/porchlight
```

Import the full built stylesheet:

```css
@layer porchlight, app;
@import "@cawalch/porchlight";

@layer app {
  .billing-panel {
    --c-card-padding: var(--pl-space-6);
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
Component files expect it to load first.

## Use It

Porchlight components are HTML/CSS contracts. Bring your own rendering layer:
server templates, Astro, React, Vue, htmx, plain HTML, or something else.

```html
<section class="c-card billing-panel" data-surface="app">
  <header class="c-card__header">
    <h2 class="c-card__title">Billing contact</h2>
    <button class="c-button" data-variant="ghost" type="button">Edit</button>
  </header>
  <div class="c-card__body">
    <label class="c-field">
      <span class="c-field__label">Email</span>
      <input
        class="c-field__control"
        type="email"
        value="finance@example.com"
      />
      <span class="c-field__hint">Invoices and receipts are sent here.</span>
    </label>
  </div>
  <footer class="c-card__footer">
    <button class="c-button" data-variant="secondary" type="button">
      Cancel
    </button>
    <button class="c-button" data-variant="primary" type="submit">
      Save changes
    </button>
  </footer>
</section>
```

Layout primitives use the same pattern:

```html
<div class="l-sidebar account-layout">
  <nav class="c-nav" aria-label="Account sections">...</nav>
  <main class="l-stack">...</main>
</div>
```

```css
@layer app {
  .account-layout {
    --l-sidebar-size: 18rem;
    --l-sidebar-gap: var(--pl-space-5);
  }
}
```

## What Ships

| Import path                            | Contents                            |
| -------------------------------------- | ----------------------------------- |
| `@cawalch/porchlight`                  | Full prebuilt CSS bundle            |
| `@cawalch/porchlight/compat.css`       | Core, layout, components, utilities |
| `@cawalch/porchlight/core.css`         | Layers, reset, tokens, themes, base |
| `@cawalch/porchlight/layout.css`       | `.l-*` layout primitives            |
| `@cawalch/porchlight/components.css`   | All `.c-*` component CSS            |
| `@cawalch/porchlight/components/*.css` | One component CSS file              |
| `@cawalch/porchlight/utilities.css`    | `.u-*` helpers                      |
| `@cawalch/porchlight/tokens`           | Typed token metadata                |
| `@cawalch/porchlight/tokens.json`      | Token metadata JSON                 |
| `@cawalch/porchlight/manifest.json`    | Static-copy manifest                |

For static-file pipelines:

```sh
npx porchlight copy --out public/porchlight --compat
npx porchlight copy --out public/porchlight --components button,field --layout --utilities
```

Then load the copied files:

```html
<link rel="stylesheet" href="/porchlight/core.css" />
<link rel="stylesheet" href="/porchlight/components/button.css" />
<link rel="stylesheet" href="/porchlight/components/field.css" />
<link rel="stylesheet" href="/app.css" />
```

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

The package targets modern CSS engines: Chrome/Edge 149+, Safari 18+, and
Firefox 135+. `compat.css` avoids the enhancement layer for tools that cannot
parse newer syntax such as scroll-state container queries.

## Status

Porchlight is pre-1.0. Token names, component class contracts, and bundle
structure can still change before `v1.0.0`.

## Development

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
