# Changelog

All notable changes to Porchlight are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Layer architecture & reset** (`@cawalch/porchlight`). First framework CSS:
  every rule lives inside one top-level `@layer porchlight { … }` with nine
  deterministic sub-layers; a minimal `:where()`-based reset replaces any
  normalize.css dependency. Consumers override via `@layer porchlight, app;`.
- **Primitive tokens** (`--pl-*`). Registered `@property` tokens
  (motion-scale, radius-control, focus-size) plus raw scales: fonts, fluid
  type, leading, spacing, radius, motion, z-index, a 9-step OKLCH brand ramp,
  control sizing, focus geometry, and shadows. Semantic colors and theme /
  density / forced-colors machinery follow in the next release.
- **Semantic tokens & themes**. Semantic foreground/background color pairs via
  `light-dark()` (bg/surface/text/border/accent/danger/success/warning), plus
  the themes layer: `[data-theme]` drives `color-scheme`; `[data-density]`
  (compact/comfortable/touch) resizes controls; `prefers-reduced-motion` zeroes
  the motion scale; `forced-colors` remaps semantic tokens to Windows system
  colors.
- **Base layer**. On-token element defaults for bare HTML: `html`/`body` font
  and color, link color and underline geometry, `:focus-visible` outline,
  tight-balanced headings, zeroed block margins, monospace code, and an
  accent-tinted `::selection`. All `:where()` (zero specificity).
- **Layout primitives** (`.l-*`). Composable regions for desktop SaaS / web-app
  surfaces: `.l-stack` (vertical flow), `.l-cluster` (wrapping action bar),
  `.l-grid` (auto-fitting dashboard widgets), `.l-sidebar` (panel-driven
  master/detail that collapses under 48rem via a container query), `.l-page`
  (centered readable column), and `.l-scroll-area` (independent scroll pane
  with a stable gutter). Each exposes `--l-*` instance-config tokens.

## [0.0.0] - in development

Project scaffolding. Nothing is published; token names, class contracts, and
the layer structure are not yet stable.
