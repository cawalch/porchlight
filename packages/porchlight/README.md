# @cawalch/porchlight

The Porchlight CSS framework package. See the root [README](../../README.md) and the [docs site](https://cawalch.github.io/porchlight) for full documentation.

## Install

```sh
pnpm add @cawalch/porchlight
```

## Use

Declare the framework in your app's layer order **before** importing it, so your
application styles win over the framework:

```css
/* app.css */
@layer porchlight, app;

@import "@cawalch/porchlight/porchlight.css";

@layer app {
  /* your overrides here */
}
```

Do not pass `layer(...)` to the `@import` — Porchlight already wraps every rule
in `@layer porchlight.*` internally.
