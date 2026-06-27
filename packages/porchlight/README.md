# @cawalch/porchlight

The Porchlight CSS framework package. See the root [README](../../README.md) and the [docs site](https://cawalch.github.io/porchlight) for full documentation.

## Install

```sh
pnpm add @cawalch/porchlight
# or
npm install @cawalch/porchlight
```

## Quick start

The main export is the **prebuilt** stylesheet (single file, no `@import` to resolve):

```css
/* app.css */
@import "@cawalch/porchlight";
```

## Layer ordering

Porchlight wraps every rule in `@layer porchlight.*`. Declare your layer order
**before** the import so your app styles win:

```css
@layer porchlight, app;

@import "@cawalch/porchlight";
```

Do **not** pass `layer(...)` to the `@import` — Porchlight already self-layers.

## Bundler notes

### Vite (recommended)

Works out of the box. Vite uses esbuild + Lightning CSS under the hood and
handles modern CSS syntax (`@property`, `@scope`, `@container scroll-state()`)
natively.

```css
@layer porchlight, app;
@import "@cawalch/porchlight";
```

### esbuild / Bun

esbuild and Bun's built-in CSS parsers **do not understand** `@property`,
`@scope`, or `@container scroll-state()`. They throw a hard parse error on these
features even though the CSS is already prebuilt.

**Workaround — bypass the bundler's CSS pipeline:**

Copy the prebuilt file directly into your project's static/public assets folder
and load it via a `<link>` tag instead of a CSS `@import`:

```sh
cp node_modules/@cawalch/porchlight/dist/porchlight.css ./static/porchlight.css
```

```html
<!-- index.html -->
<link rel="stylesheet" href="/porchlight.css" />
```

Then declare your layer order in your app's own CSS:

```css
/* app.css — loaded after porchlight.css */
@layer porchlight, app;
```

### @layer + @import ordering caveat

Some bundlers **hoist** `@import` statements to the top of the file during
processing, which can move them above your `@layer` declaration and reverse the
intended order. If you encounter this:

1. Import Porchlight from your **entry JS/TS** file, not from CSS:

```ts
// app.ts
import "@cawalch/porchlight";
import "./app.css";
```

2. Declare `@layer` only in your app's CSS (no `@import` there to hoist):

```css
/* app.css */
@layer porchlight, app;

/* your styles */
```

This guarantees the JS loader injects Porchlight first, then your CSS — and
your `@layer` declaration is never reordered.

## Exports

| Import path                  | What you get                                           |
| ---------------------------- | ------------------------------------------------------ |
| `@cawalch/porchlight`        | Prebuilt single-file CSS (recommended)                 |
| `@cawalch/porchlight/min`    | Minified prebuilt CSS                                  |
| `@cawalch/porchlight/source` | Raw source with `@import` (needs Lightning CSS / Vite) |
| `@cawalch/porchlight/src/*`  | Individual source layer files                          |

## Browser support

Targets Chrome/Edge 149+, Safari 18+, Firefox 135+. Uses `@layer`, `@scope`,
`@property`, OKLCH, `light-dark()`, `color-mix()`, `:has()`, container queries,
Popover API, and anchor positioning. See the
[Browser Support guide](https://cawalch.github.io/porchlight/guides/browser-support)
for the full feature matrix mapped to the [CSS Snapshot 2026](https://www.w3.org/TR/css-2026/).
