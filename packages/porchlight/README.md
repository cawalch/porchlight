# @cawalch/porchlight

Porchlight is a no-dependency, native-CSS framework for accessible,
themeable web applications. See the root [README](../../README.md) and
the [docs site](https://cawalch.github.io/porchlight) for full guidance.

## Install

```sh
pnpm add @cawalch/porchlight
# or
npm install @cawalch/porchlight
```

## Full Bundle

The main export is a prebuilt stylesheet: one file, no `@import` statements
for your bundler to resolve.

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

```sh
npx porchlight copy --out public/porchlight --compat
```

For a smaller static slice, name the components you use:

```sh
npx porchlight copy --out public/porchlight --components button,field --layout --utilities
```

```html
<link rel="stylesheet" href="/porchlight/core.css" />
<link rel="stylesheet" href="/porchlight/components/button.css" />
<link rel="stylesheet" href="/porchlight/components/field.css" />
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

Vite handles CSS `@import` and modern CSS syntax well, so either the full
bundle or selected component imports work.

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

## Bun And Other Static Pipelines

Bun 1.3.14 can bundle `compat.css` and selected component imports. It may
print non-fatal warnings for `@property`.

```css
@layer porchlight, app;
@import "@cawalch/porchlight/compat.css";
```

```css
@layer porchlight, app;
@import "@cawalch/porchlight/core.css";
@import "@cawalch/porchlight/components/button.css";
```

The full default bundle and `enhancements.css` include
`@container scroll-state(...)`, which Bun 1.3.14 does not parse. If you need
those enhancement rules, bypass CSS parsing and copy the prebuilt files to
static assets instead:

```sh
bun x porchlight copy --out public/porchlight --full
```

That path is also the best fit for Go, Rails, Django, and other
server-rendered apps that serve CSS through a static file handler.

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
import tokens from "@cawalch/porchlight/tokens.json";
```

## Exports

| Import path                                 | What you get                             |
| ------------------------------------------- | ---------------------------------------- |
| `@cawalch/porchlight`                       | Full prebuilt CSS bundle                 |
| `@cawalch/porchlight/min.css`               | Minified full bundle                     |
| `@cawalch/porchlight/compat.css`            | Bun-friendly bundle without enhancements |
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

Targets Chrome/Edge 149+, Safari 18+, Firefox 135+. Porchlight uses
modern CSS including `@layer`, `@scope`, `@property`, OKLCH,
`light-dark()`, `color-mix()`, `:has()`, container queries, Popover API,
and anchor positioning. See the
[Browser Support guide](https://cawalch.github.io/porchlight/guides/browser-support)
for the full feature matrix.
