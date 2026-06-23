# Changelog

All notable changes to Porchlight are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Dialog** (`.c-dialog`). A modal dialog using the native `<dialog>` element
  with `showModal()` (top-layer, modal focus trap, Esc to close). The
  `::backdrop` provides a dimmed, blurred scrim. Enter/exit animation via
  `@starting-style` (opacity + scale) with `transition-behavior: allow-discrete`.
  Header + body + footer slots; a `.c-dialog__close` ✕ button; responsive
  sizing (`min(100% - 2rem, --c-dialog-size)` + scrollable max height).
- **Popover menu** (`.c-menu`). First overlay component — a dropdown menu
  anchored to its trigger via the native Popover API (top-layer, light-dismiss,
  focus management — no JS) and CSS anchor positioning (`position-anchor` /
  `position-area`, `@supports`-gated). Enter/exit animation via `@starting-style`
  - `transition-behavior: allow-discrete` on `overlay`/`display`. Menu items are
    real `<a>`/`<button>` (full-width, keyboard-focusable); `[data-tone="danger"]`
    for destructive items; `.c-menu__divider` for groups. Multiple menus need
    unique `--c-menu-anchor` values.
- **Badge** (`.c-badge`). A compact inline label for statuses, counts, and
  tags. Tones via `[data-tone]` (`accent`/`success`/`warning`/`danger`, plus a
  neutral default) consume the WCAG-AA `-bg`/`-text` token pairs, so they're
  legible in both themes by construction. Optional `.c-badge__dot` status pip.
- **Card** (`.c-card`). A raised surface for grouping related content —
  header + body (+ optional footer). Elevation comes from a soft shadow, not a
  bg contrast. The header collapses to a stack via a container query when the
  card is narrow (&lt; 28rem). An interactive variant (`data-interactive` or
  `<a.c-card>`) gets a hover lift + focus ring. First component to exercise
  the `--pl-shadow-*` elevation tokens.
- **Field** (`.c-field`). A labeled form control wrapping native
  `<input>`/`<select>`/`<textarea>` — label, control, and hint. State is driven
  by native pseudos and reflected onto the border/hint via `:has()`: focus
  draws a token-colored border **plus a 2px ring** (a 1px border swap alone is
  below the perceptual affordance threshold); invalid uses `:user-invalid`
  (Baseline 2024); disabled mutes the field. Native checkbox/radio/color inputs
  themed via `accent-color`.
- **Button** (`.c-button`). First component — the canonical action control,
  native `<button>`/`<a>`, in `@layer porchlight.components` via `@scope`.
  Variants `primary` / `secondary` / `ghost`; theme-aware `color-mix()` hover,
  `translateY` active, `aria-pressed`, disabled/`aria-disabled`, an inset
  top-highlight on filled variants, `text-box` optical alignment behind
  `@supports`, and forced-colors fallback. Sizing flows from the control
  tokens, so `[data-density]` just works. Sets the component-authoring pattern
  (component-local `--c-*` tokens, a `.mdx` reference page, a kitchen-sink
  preview) every subsequent component follows.
- **App shell** (`.l-app-shell`). Desktop SaaS grid: sticky topbar,
  persistent sidebar, scrolling main work area. `.l-app-shell__main` is a
  query container, so any `.l-sidebar` nested inside it collapses at narrow
  app widths without a manual wrapper. The sidebar supports an explicit
  `data-sidebar="collapsed"` toggle (icon rail) in addition to the viewport
  fallback (hidden below 60rem). Completes the layout layer.
- **Single-file distributable build**. `pnpm --filter @cawalch/porchlight
build` bundles the source `porchlight.css` (@imports inlined) into
  `dist/porchlight.css` (readable) and `dist/porchlight.min.css` via Lightning
  CSS, targeting Chrome 149+. No consumer bundler required: a no-build app can
  `<link>` the dist file directly. Source stays available for bundler users via
  the `.` export; dist is exposed at `@cawalch/porchlight/dist/porchlight.min.css`.
- **Token WCAG + status pairs** (fix). `--pl-color-accent` is now theme-aware
  (`light-dark(brand-7, brand-4)`) with a paired `--pl-color-accent-text`
  (`white` in light, near-black in dark) so both link-as-text and button-label
  uses clear WCAG 2.2 AA (>=4.5:1) in **both** themes; the prior fixed
  `brand-6` + `white` pairing sat at 4.38:1. `success` and `warning` gain
  `-bg`/`-text` pairs mirroring `danger`, and `warning` is darkened so its
  solid form clears the >=3:1 non-text threshold. `.l-sidebar` no longer
  declares `container-type` on itself (an element can't query its own size);
  the collapse correctly targets an ancestor container.

### Fixed

- **Button hover collapsed to transparent.** The hover rule reassigned
  `--c-button-bg` to `color-mix(... var(--c-button-bg) ...)` — a self-
  referential custom-property cycle that CSS resolves to guaranteed-invalid,
  making every button's fill transparent on hover. Rewritten to set the
  `background-color` longhand instead. Ghost hover (which mixed text into
  transparent → a near-invisible veil) now gets a real accent wash.
- **`--pl-color-surface-2` too close to `--pl-color-bg` in light** (ΔL 0.02) —
  secondary buttons and raised panels disappeared into the page. Widened to
  ΔL 0.04 (light-mode surface-2 96%→94%).
- **Pressed ghost/secondary tint too faint** (12% alpha) — bumped to 20% so the
  selected state reads.

### Added (tooling)

- **Deterministic perceptual color checks.** A reusable `tests/lib/color.ts`
  (parses resolved `oklch`/`oklab`/`rgb`, computes luminance, contrast, ΔL,
  alpha, source-over composite) plus three guards: WCAG text contrast (refactored
  to the lib), adjacent-surface distinguishability (ΔL ≥ 0.03 — catches the
  surface-2 bug), and interactive-state affordance (hover/pressed ΔL + an alpha
  floor that catches faint-veil hovers). These read resolved colors from the
  browser, so a token/component edit that reintroduces an invisible affordance
  fails CI.

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
