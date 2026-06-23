# Porchlight

> A no-dependency, native-CSS framework.

[![status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)](#)
[![target: Chrome 149+](https://img.shields.io/badge/chrome-%E2%89%A5149-4285F4)](#)
[![license: MIT](https://img.shields.io/badge/license-MIT-22c55e)](LICENSE)

Porchlight is a token-driven, component-first CSS framework with **zero runtime dependencies**: no Tailwind, no Sass, no Bootstrap, no normalize.css, no CSS-in-JS, no icon font, no external fonts. Every visual decision flows through CSS custom properties; every component owns its responsive behavior through container queries.

## Principles

- **Native CSS only.** `@layer`, `@scope`, native nesting, `@property`, container queries.
- **Token-driven.** OKLCH + `light-dark()` + `color-mix()` color system built on semantic foreground/background pairs.
- **Component-first.** Components adapt to their own space via container queries, not just viewport breakpoints.
- **Enterprise-ready.** Light/dark, density modes, RTL/LTR, keyboard navigation, forced colors, reduced motion, print, and 200% zoom are first-class — not bolt-ons.
- **Predictable cascade.** All framework CSS lives inside `@layer porchlight { … }` so host apps can place it: `@layer porchlight, app;`.

## Browser support

Production target: **Chrome 149 stable** (June 2026). Tier B features (gap decorations, scroll-state container queries, `text-box`, advanced `attr()`, anchor positioning) are gated behind `@supports` — the framework is fully usable without them. Chrome 150 beta features are not in the critical path.

## Status

🚧 **In active development — not yet 1.0.** Token names, class contracts, and the layer structure may change before `v1.0.0`.

## Install

```sh
pnpm add @cawalch/porchlight
```

```css
/* Place the framework in the cascade before importing it, so your app wins. */
@layer porchlight, app;
@import "@cawalch/porchlight/porchlight.css";
```

The package is pre-1.0; the npm release follows `v1.0.0`.

## Development

Porchlight is a pnpm workspace: `packages/porchlight` (the framework) and `docs/` (the Astro showcase & reference site).

```sh
pnpm install
pnpm dev       # run the docs site (Astro)
pnpm test      # Playwright visual + axe accessibility tests
pnpm lint      # stylelint
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup, branching, the per-PR definition of done, and the preview-deployment workflow.

## License

[MIT](LICENSE) © cawalch
