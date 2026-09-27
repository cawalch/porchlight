# @cawalch/porchlight

Porchlight is a no-dependency, native-CSS framework for accessible,
themeable web applications. See the root [README](https://github.com/cawalch/porchlight#readme) and
the [docs site](https://cawalch.github.io/porchlight) for full guidance.

## Install

```sh
pnpm add @cawalch/porchlight
# or
bun add @cawalch/porchlight
# or
npm install @cawalch/porchlight
```

## Full Bundle

The main export is a prebuilt stylesheet. Resolve the package import through
your app bundler and load the resulting CSS entry once. Browsers cannot resolve
these bare package names directly; use Static HTML below without a bundler.

```css
@layer porchlight, app;
@import "@cawalch/porchlight";

@layer app {
  /* your product styles */
}
```

## Smaller Bundles

If your app only uses a few components, start with `core.css`, then import
the pieces you need.

```css
@layer porchlight, app;

@import "@cawalch/porchlight/core.css";
@import "@cawalch/porchlight/layout.css";
@import "@cawalch/porchlight/components/button.css";
@import "@cawalch/porchlight/components/field.css";
@import "@cawalch/porchlight/components/card.css";
@import "@cawalch/porchlight/utilities.css";
```

`core.css` includes layer order, reset, tokens, themes, and base styles.
Component files depend on those tokens, so load `core.css` first.

If you want the whole practical framework without experimental enhancement
syntax, use `compat.css`. It includes core, layout, all components, and
utilities, but leaves out `enhancements.css`.

```css
@layer porchlight, app;
@import "@cawalch/porchlight/compat.css";
```

## Public CSS API

Porchlight public hooks use the `pl-` namespace to avoid collisions with
application CSS and other frameworks:

- Components: `.pl-c-button`, `.pl-c-card__title`
- Layout primitives: `.pl-l-stack`, `.pl-l-cluster`
- Utilities: `.pl-u-sr-only`, `.pl-u-flow`
- Component and instance tokens: `--pl-c-card-padding`,
  `--pl-l-stack-gap`
- Framework-wide attributes: `data-pl-theme`, `data-pl-density`

Component-local attributes such as `data-tone`, `data-selected`, and ARIA
states stay unprefixed when scoped under a Porchlight component class.

## Static HTML

For server-rendered apps or pipelines that copy assets directly, use the
included copy helper:

Install the package first, then run its local executable:

```sh
npx --no-install porchlight copy --out public/porchlight --compat
```

```html
<link rel="stylesheet" href="/porchlight/compat.css" />
```

These URLs assume your server exposes `public/` at `/`; adjust them for your
asset mount or deployment base path.

For a smaller static slice, name the components you use:

```sh
npx --no-install porchlight copy --out public/porchlight --components button,field --layout --utilities
```

```html
<link rel="stylesheet" href="/porchlight/core.css" />
<link rel="stylesheet" href="/porchlight/layout.css" />
<link rel="stylesheet" href="/porchlight/components/button.css" />
<link rel="stylesheet" href="/porchlight/components/field.css" />
<link rel="stylesheet" href="/porchlight/utilities.css" />
<link rel="stylesheet" href="/app.css" />
```

In `app.css`, declare your layer order before writing overrides:

```css
@layer porchlight, app;

@layer app {
  /* app overrides */
}
```

The generated `dist/porchlight.manifest.json` lists every packaged CSS file,
component name, and recommended copy order for scripts.

## Vite

Vite resolves package CSS imports. Import one CSS entry from your app or
link it from Vite's HTML entry; bare package imports are not browser URLs.

```css
@layer porchlight, app;
@import "@cawalch/porchlight/core.css";
@import "@cawalch/porchlight/components/button.css";
@import "@cawalch/porchlight/components/data-table.css";
@import "@cawalch/porchlight/utilities.css";
```

You can also import CSS from your JS/TS entry when that is more convenient:

```ts
import "@cawalch/porchlight/core.css";
import "@cawalch/porchlight/components/button.css";
import "./app.css";
```

For production builds, set a CSS target that matches your supported browsers.
The docs build uses `build.cssTarget: "chrome149"` to preserve native color
functions. This is a Chromium target, not a cross-browser support guarantee.
The full bundle was also checked with Vite 8.2.1's default target in a small
light/dark consumer fixture. Recheck your rendered output after changing targets
or minifiers; see [Vite's CSS target option](https://vite.dev/config/build-options#build-csstarget).

## Bun And Other Static Pipelines

Bun can install Porchlight and run its copy helper. Using Bun as a package
manager is separate from sending CSS through `bun build`.

Verified with **Bun 1.4.2 and Porchlight 0.11.1**:

| Path                                                    | Result                                               |
| ------------------------------------------------------- | ---------------------------------------------------- |
| `bun add @cawalch/porchlight`                           | Installs the package and local CLI                   |
| Bundle `compat.css` or `core.css` + selected components | Builds; emits non-fatal `@property` warnings         |
| Bundle the default export or `enhancements.css`         | Fails at `@container scroll-state(...)`              |
| Copy prebuilt CSS and serve it directly                 | Preserves the full CSS without parser transformation |

For Bun's CSS bundler, put this in `app.css`, then run
`bun build ./app.css --outdir ./dist`:

```css
@layer porchlight, app;
@import "@cawalch/porchlight/compat.css";
```

Load the emitted stylesheet in your page; a CSS build alone does not attach it
to the DOM. Basic button/card colors were checked in light and dark themes;
this is not a guarantee for every component or future Bun release.

For the full bundle, run the installed CLI with Bun's runtime explicitly:

```sh
bunx --bun --no-install porchlight copy --out public/porchlight --full
```

```html
<link rel="stylesheet" href="/porchlight/porchlight.css" />
```

Serve that directory as static files. Feeding the copied CSS back into Bun's
HTML/CSS bundler reintroduces the parser limitation. `--bun` avoids the CLI's
Node shebang; `--no-install` uses the locally installed package.
See [Bun's CSS bundler](https://bun.com/docs/bundler/css) and
[bunx runtime selection](https://bun.com/docs/pm/bunx#shebangs).

## Tokens

Porchlight ships generated token metadata for editor autocomplete,
validation, and custom tooling.

```ts
import tokenDoc, { tokenGroups } from "@cawalch/porchlight/tokens";

console.log(tokenDoc.tokens["--pl-color-accent"].value);
console.log(tokenGroups.map((group) => group.name));
```

JSON is available too:

```ts
import tokens from "@cawalch/porchlight/tokens.json" with { type: "json" };
```

## Exports

| Import path                                 | What you get                             |
| ------------------------------------------- | ---------------------------------------- |
| `@cawalch/porchlight`                       | Full prebuilt CSS bundle                 |
| `@cawalch/porchlight/min.css`               | Minified full bundle                     |
| `@cawalch/porchlight/compat.css`            | Bundle without the enhancement layer     |
| `@cawalch/porchlight/core.css`              | Layer order, reset, tokens, themes, base |
| `@cawalch/porchlight/layout.css`            | Layout primitives                        |
| `@cawalch/porchlight/components.css`        | All component CSS                        |
| `@cawalch/porchlight/components/button.css` | One component CSS file                   |
| `@cawalch/porchlight/utilities.css`         | Utility classes                          |
| `@cawalch/porchlight/enhancements.css`      | Progressive enhancement layer            |
| `@cawalch/porchlight/tokens`                | Typed token metadata module              |
| `@cawalch/porchlight/tokens.json`           | Token metadata JSON                      |
| `@cawalch/porchlight/manifest.json`         | Static-copy manifest                     |
| `@cawalch/porchlight/src/*`                 | Raw source escape hatch                  |

## Layer Ordering

Porchlight wraps every rule in `@layer porchlight.*`. Declare your app layer
after Porchlight so product CSS wins without specificity fights.

Do not pass `layer(...)` to these imports. Porchlight already self-layers.

## Browser Support

Chromium is the primary test target; Firefox and WebKit have limited smoke
coverage. `@scope` requires Firefox 146 or later, not Firefox 135. Porchlight uses
modern CSS including `@layer`, `@scope`, `@property`, OKLCH,
`light-dark()`, `color-mix()`, `:has()`, container queries, Popover API,
and anchor positioning. See the
[Browser Support guide](https://cawalch.github.io/porchlight/guides/browser-support)
for the full feature matrix.
