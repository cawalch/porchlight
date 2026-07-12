# Changelog

All notable changes to Porchlight are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a new `miller-columns` cascading component and interactive IAM Permission Explorer preview page for multi-level hierarchical drill-down data exploration.
- Added a framework-neutral inline loading spinner and width-stable busy-button
  contract using native `aria-busy` and `disabled` semantics, with reduced-motion
  and forced-colors fallbacks.
- Added framework-neutral bulk-selection toolbar and inline-edit recipes with a
  working data-table preview and focus-management coverage.

### Changed

- Separated CSS component contracts from composed SaaS patterns in docs counts,
  navigation, search, preview grouping, and generated model guidance.
- Clarified that popover menus are non-modal disclosures, while dropdowns that
  opt into ARIA menu roles must provide the full menu-button keyboard and focus
  contract. Command palettes now document their grouped combobox/listbox model.

### Tooling

- Generated accessibility coverage from preview routes, added docs type-checking
  to CI, introduced targeted visual baselines, and added narrow Firefox/WebKit
  smoke coverage for representative application surfaces.

## [0.10.0] - 2026-06-30

### Added

- Added modular package artifacts for smaller CSS installs: `core.css`,
  `compat.css`, `layout.css`, `components.css`, per-component CSS files,
  `utilities.css`, and `enhancements.css`. The npm package also now ships a
  static-copy manifest plus generated token metadata in JSON, ESM, and
  TypeScript declaration forms. (#82)
- Added a zero-dependency `porchlight copy --out <dir>` helper so Bun,
  Go/server-rendered, and static-asset pipelines can copy full, compat, or
  selected component CSS without writing their own `cp node_modules/...`
  scripts. (#82)

### Changed

- Simplified package exports around canonical CSS and token entry points,
  replacing duplicate aliases with readable `.css` subpaths and clearer
  Vite, Bun, and static-asset setup docs. (#82)

## [0.9.0] - 2026-06-30

### Added

- Added six app composition kits for the next wave of product surfaces:
  list/detail workspace, queue triage, process builder/admin shell, settings
  console, reporting dashboard, and command-driven workspace. Each ships with
  component guidance, a preview route, generated model-pack links, and smoke
  coverage.

### Fixed

- Corrected component `since` metadata so docs point to the release that first
  shipped each public component, including the `0.8.0` modern app contracts.
- Updated the README release note to describe current pre-1.0 npm tags.

### Tooling

- Serialized docs and PR-preview deployments that push to `gh-pages`, avoiding
  the non-fast-forward race seen when a PR preview cleanup overlaps a main docs
  deploy.
- Migrated Biome config to the current `preset` field, normalized the package
  repository URL for npm publish, and removed remaining local lint/check hints.

## [0.8.0] - 2026-06-29

### Added

- **Modern app component contracts.** Added CSS-only, framework-agnostic
  contracts for calendar/date picker/time picker, combobox, tree view, split
  pane, filter builder/query chips/saved views, workflow board, and chart shell.
  These are wired into the packaged `porchlight.css` entrypoint with matching
  docs, previews, and Playwright coverage. (#80)
- **Form-field contract hardening.** Fields and forms now support optional
  required markers, toned field hints, stacked field messages, choice-group hint
  tones, and copyable framework-agnostic examples for plain HTML, SSR fragments,
  hypermedia swaps, and component renderers. (#77)
- **Generated LLM guidance assets.** Added `docs/scripts/generate-llms.mjs` as
  the source of truth for `llms.txt` and `llms-full.txt`, including component
  and preview references derived from the docs tree. (#78)

### Changed

- **Dropdown docs now describe a button-triggered option menu.** The component
  guidance no longer overclaims native-select replacement behavior, and the
  preview syncs `aria-expanded` and `aria-checked` state for copied examples.
  (#79)
- **Command palette docs and preview use stronger dialog, combobox, and listbox
  semantics.** The preview now demonstrates keyboard handling for arrow keys,
  Enter, and Escape while keeping the CSS package runtime-agnostic. (#79)
- **Toolbar, field, and form previews expanded around app-like usage.** The docs
  now show denser operational layouts and emitted HTML contracts instead of only
  isolated primitives. (#77, #80)

### Fixed

- **Tag input examples no longer wrap removable chip buttons inside labels.**
  This keeps the copied markup safer for assistive tech and form behavior. (#79)
- **Calendar range and picker overlays stay bounded.** Date-picker popovers now
  remain viewport-bounded with internal scrolling where needed, and range joins
  render smoothly across selected start/end/in-range days. (#80)
- **Modern component accessibility gaps closed.** Added fixes and tests for
  calendar rows, combobox listbox status rows, focusable split panes, workflow
  selected-card state, dropdown checked state, and command-palette interaction
  contracts. (#79, #80)

### Tooling

- **CI now checks generated LLM docs.** GitHub Actions runs the generator in
  check mode so committed model guidance cannot drift from the source of truth.
  (#78)

## [0.7.0] - 2026-06-26

### Added

- **`prefers-contrast` support.** A new `@media (prefers-contrast: more)`
  block in the themes layer responds to the OS "increase contrast" setting by
  deepening `--pl-color-surface-2` and `--pl-color-border`, and thickening the
  focus ring (`--pl-focus-size: 3px`, tighter `--pl-focus-glow-opacity`). It
  strengthens boundaries and focus affordances without changing component
  contracts or forcing a new palette. (#75)

### Changed

- **Focused-invalid fields keep the calmer focus glow.** A focused invalid
  field previously re-showed the danger-colored halo, which reads as a harsh
  red ring around the active typing target. It now keeps the danger border
  and hint text but uses the standard `--pl-focus-color` glow while focused —
  so the error state stays visible without shouting at someone mid-correction.
  Applies to both `.c-field` and `.c-input-group`. (#73)

### Fixed

- **Forced-colors focus rings were invisible on buttons and cards.** The
  primary button's accent-glow focus ring and the interactive card's
  box-shadow lift both relied on `outline: none` + `box-shadow`, which Windows
  High Contrast suppresses entirely. Both now declare a transparent outline
  that renders as a system-color focus indicator in Forced Colors. (#76)
- **Skip-link used `:focus` instead of `:focus-visible`.** Switched so the
  skip-link only reveals on keyboard focus, not on mouse click. (#76)
- **Deprecated CSS modernized.** `word-break: break-word` →
  `overflow-wrap: break-word` (data-table wrap modes, docs prose), and the
  deprecated `clip` property → `clip-path: inset(50%)` (file-upload,
  segmented, switch sr-only helpers). Behavior-preserving. (#76)

### Tooling

- **Stylelint stack upgraded** (16→17, config-standard 36→40) with three
  new plugins: `stylelint-use-logical` (regression guard, 0 violations),
  `declaration-strict-value` (enforces token usage on colors, 0 violations),
  and a curated subset of `stylelint-plugin-defensive-css`
  (`require-forced-colors-focus`, `require-focus-visible` — the rules that
  surfaced the focus fixes above). (#76)
- **Biome 2.5 added** as a JS/TS/JSON linter (CSS stays stylelint's domain).
  Prettier kept as formatter — enforced in CI; it had been drifting 25 files
  unenforced. (#76)

### Docs

- **Preview index auto-generated from docs** (no more hand-maintained list).
  (#72)
- **Model composition recipes** added to the docs. (#74)

## [0.6.0] - 2026-06-25

### Added

- **Screen-reader utilities `.u-sr-only` and `.u-focusable-sr-only`.**
  `.u-sr-only` is always hidden (for native inputs/labels whose focus is
  handled by a styled control); `.u-focusable-sr-only` reappears on
  focus/active for skip links and other keyboard targets. `.u-visually-hidden`
  is retained as a backwards-compatible alias of `.u-focusable-sr-only`, and
  `.c-field--inline` now collapses to one column when it contains any of the
  three. (#71)
- **`.c-badge-group`.** A wrapping flex container for laying out multiple
  compact badges with consistent spacing. (#71)
- **Layout utilities.** `.u-min-0` (let a flex/grid child shrink below its
  content width — pair with `.u-truncate`), `.u-wrap-anywhere` (break long
  tokens like UUIDs, paths, or URLs before they blow out a container),
  `.u-marginless` (zero block margins for dense chrome), `.u-muted-sm` (small
  muted caption text), and `.u-icon-title` (leading-icon + title that keeps
  the icon on the first line while the text truncates or wraps). (#71)
- **Toast-stack corner placement.** `.c-toast-stack[data-placement]` accepts
  `bottom-start`, `top-end`, and `top-start`; the default remains `bottom-end`.
  (#71)

### Changed

- **Menu-row hover is now accent-tinted.** `--pl-menu-row-hover-bg` mixes 10%
  accent into `--pl-color-surface-2`, so `c-menu`, `c-dropdown`, and
  `c-split-button` rows read as interactive rather than a plain surface swap.
  (#69)
- **Split-button segments are fused into a single composite.** Segment
  selectors are now `:scope > .c-button.c-split__primary` / `__toggle`, and the
  toggle gets a negative `margin-inline-start` equal to the border width so the
  two segments share one crisp divider instead of a double border. A
  higher-specificity duplicate of these rules lives outside `@scope` as a
  defensive fallback for consuming apps whose own scoped form/card rules would
  otherwise split the composite. (#69, #71)

### Fixed

- **`.u-truncate` overflowed inside flex/grid.** Added `min-inline-size: 0` so
  truncation actually takes effect when the element is itself a flex or grid
  child. (#71)

## [0.5.0] - 2026-06-25

### Added

- **`c-form` component.** SaaS form layout helpers built on native
  `<form>` / `<fieldset>` / `<legend>` — Porchlight handles layout and chrome
  only, never the semantics. Sections (`.c-form__section`), header + body
  slots, an auto-fitting `.c-form__grid` (tunable via `--c-form-grid-min`),
  wrapping `.c-form__row`, and a right-aligned `.c-form__actions` bar. (#66)
- **`c-choice-group` / `c-choice-list` / `c-choice`.** A fieldset+legend
  pattern for checkbox and radio groups. Supports per-choice descriptions
  (`.c-choice__description`) and a `[data-layout="inline"]` variant; disabled
  choices are muted via `:has()`. (#66)
- **`c-input-group`.** Prefix/suffix addons (`.c-input-group__addon`) and
  trailing action buttons (`__action`) around a `.c-field__control`. Focus,
  invalid, and disabled state are hoisted to the group with `:has()` so the
  ring/border wraps the whole composite control. Includes a forced-colors
  mapping. (#66)
- **`c-field--inline` modifier.** A two-column label/control layout via grid
  (`--c-field-inline-label-size`, default 10rem) that collapses to a stack
  below 40rem, and drops to a single column when the label is
  `.u-visually-hidden`. (#66)
- **Nav footer metadata and compact actions.** Generic `.c-nav__meta*`,
  `.c-nav__actions`, and `.c-nav__action*` selectors for a sidebar footer
  (avatar/icon + truncated label + description, plus compact sign-out-style
  action buttons). All hidden appropriately under the icon-rail variant.
  (#67)
- **Nav groups and menu flyouts.** `.c-nav__group`, `.c-nav__group-label`,
  `.c-nav__divider` for desktop sidebar grouping, and `.c-nav__menu` for
  nesting a `.c-menu` flyout inside a nav row. (#67, #68)
- **Richer menu item anatomy and sidebar placement.** `.c-menu__item*`
  (icon / body / label / description / shortcut), an `[aria-current]` /
  `[aria-selected="true"]` / `[data-selected]` affordance on menu rows, and
  `.c-menu[data-placement="inline-end"]` for flyouts opening from a
  sidebar or icon rail (distinct `position-area` + try-fallbacks). (#68)

### Changed

- **`[aria-invalid="true"]` now matches `:user-invalid`.** `.c-field__control`
  and `.c-input-group` treat an explicit `aria-invalid="true"` identically to
  the native `:user-invalid` pseudo, so server-side / post-submit validation
  state renders without waiting for UA validation. (#66)
- **Shared menu-row and overlay tokens.** New `--pl-menu-row-*` (min-block-
  size, padding-inline, radius, hover-bg, icon-size) and
  `--pl-overlay-popover-bg`; `c-menu`, `c-dropdown`, and `c-split-button` now
  consume them instead of duplicated literals, so the three popover surfaces
  stay in lockstep. (#68)

### Fixed

- **Data-table sticky-column cells leaked row state.** Sticky cells used
  `background: inherit`, so the translucent hover/selection wash let
  horizontally-scrolled cells show through underneath. They now get opaque
  `color-mix()` fills for both hover and `aria-selected`, and selected rows
  map to `Highlight` / `HighlightText` under forced-colors. (#67)

### Note

- The nav footer metadata/action selectors are new since `0.4.0`; no `0.4.0`
  public selector is removed or renamed. The generic `.c-nav__meta*` API
  replaces account-specific names that existed only on the unreleased branch.

## [0.4.0] - 2026-06-25

### Added

- **Data-table cell overflow modes.** `[data-overflow="wrap"]` and
  `[data-overflow="truncate"]` on `.c-table-wrap` (table-wide) or on
  individual `<td>`/`<th>` (per-cell override), plus a `--c-table-col-min`
  token for per-column minimum widths. (#62)
- **Card and page-header truncation.** `[data-truncate]` on `.c-card` /
  `.c-card__title` and `.c-page-header` / `.c-page-header__title` for
  single-line ellipsis in fixed-width slots. (#62)
- **Tab width cap.** New `--c-tabs-tab-max` token caps tab width so long
  labels truncate instead of stretching the scrollable tab list. (#62)

### Changed

- **Container-query responsiveness for wide containers.** Data tables widen
  cell padding past 56rem; cards bump padding to `space-6` past 40rem;
  `.c-page-header` stacks cleanly at narrow widths; and `.c-stat__value`
  font-size now scales by the tile's actual width (shrinks <16rem, enlarges
  > 32rem) instead of viewport units. (#62)
- **Modern `text-wrap` across components.** `text-wrap: stable` on `<th>`
  headers, `balance` on page-header titles, and `pretty` (orphan prevention)
  on card body, description-list details, and dialog body. (#62)
- **Control corner radius joins the radius scale.** The `--pl-radius-control`
  `@property` initial-value changed from `0.5rem` to `8px`, and `:root` now
  sets `--pl-radius-control: var(--pl-radius-md)` so density and theme
  overrides cascade correctly. (#63)
- **New card `[data-surface="app"]` variant** with tighter corners
  (`--pl-radius-lg`) for dense desktop products where the default 24px radius
  reads too soft. Keeps the default elevation and composes with status rings
  or accent variants. (#63)
- **Close/remove glyphs are now CSS-drawn.** `.c-chip__remove`,
  `.c-dialog__close`, and `.c-toast__close` render their ✕ via
  `::before`/`::after` pseudo-elements instead of relying on a literal "✕"
  character supplied by markup, giving consistent geometry across fonts and
  themes. (#64)
- **(Internal) GitHub Actions bumped** off the deprecated Node 20 runtime:
  `actions/checkout` v4→v7, `actions/setup-node` v4→v6, `actions/cache`
  v4→v6, `pnpm/action-setup` v4→v6. Runtime-only; no `with:` input changes.
  (#61)

### Fixed

- **Collapsed data-table detail row leaked a visible strip.** The detail
  cell inherited `min-block-size` (~3rem) from the base cell rule, preventing
  full collapse during the `0fr`→`1fr` grid animation and leaving a sliver of
  the accent bar / surface background visible when collapsed. Added
  `min-block-size: 0` to `.c-table__detail td`. (#62)
- **Forced-colors coverage for overlay components.** Command-palette, dialog,
  and drawer now declare a full `border: 1px solid ButtonBorder` (plus
  `background: Canvas` where it was missing) on `:scope` inside their
  `@scope`, instead of only overriding `border-color` on a loose `:where()`
  selector outside the scope. (#64)

## [0.3.0] - 2026-06-25

### Added

- **`c-split-button` component.** A primary action button with a dropdown
  toggle. Both segments share the same `data-variant` for visual consistency
  across the seam. Uses anchor positioning for popover tethering; each
  instance requires a unique `--c-split-anchor` name. Includes chevron
  rotation on open. (#54)
- **`c-description-list` component.** A key-value grid for detail panels
  (account info, case metadata, user profiles). Responsive columns via
  container queries with a `--c-description-min` token. (#53)
- **`c-page-header` component.** A bare title + actions row for use inside
  padded containers. Unlike `.c-toolbar`, it has no chrome (no padding,
  border, or surface background). Includes optional subtitle and actions
  slots. (#53)
- **Data-dense density tier.** A fourth `[data-density="dense"]` preset
  (1.75rem controls) that also compresses the spacing scale (~30%) and
  small text sizes. Designed for SIEM dashboards, analytics consoles, and
  trading terminals. Includes a full SIEM console preview page. (#58)
- **`.u-line-clamp` utility.** Multi-line text truncation via the standard
  `line-clamp` property with `-webkit-box` fallback. Accepts a
  `--u-line-clamp` variable (default 2 lines). (#57)

### Changed

- **`scrollbar-color` standard property** added to tabs alongside the
  existing `scrollbar-width: none`. (#57)
- **`content-visibility: auto`** on data-table rows for lazy rendering of
  large tables, with `contain-intrinsic-size` to prevent scrollbar jitter.
  (#57)
- **`isolation: isolate`** on the toast stack for a clean stacking context
  without opacity hacks. (#57)
- **Browser-support guide updated** with CSS Snapshot 2026 status column,
  missing `@property` in the feature matrix, and corrected test counts.
  (#56)

### Fixed

- **App-siem a11y violation.** Scrollable `<ol>` in the SIEM console lacked
  `tabindex="0"` and `aria-label`, failing the `scrollable-region-focusable`
  rule. Added both; removed erroneous `role="region"` that broke the
  implicit `list` role. (#55)

## [0.2.0] - 2026-06-25

### Fixed

- **View Transitions default to `navigation: none`.** MPA View Transitions
  (`@view-transition { navigation: auto }`) broke silently in JS-heavy apps:
  the browser's page-capture snapshot phase conflicts with component
  initialisation (Alpine `x-init`, React hydration, Stimulus), causing
  `AbortError: Transition was skipped` on every navigation with no visible
  error. The default is now `navigation: none`; apps that have tested their
  JS compatibility can opt in via `@layer app`. (#51 §1.1)
- **`l-app-shell` definite height.** Changed `min-block-size: 100dvb` to
  `block-size: 100dvb`. `1fr` grid rows require a definite container height;
  `min-block-size` is not definite, so Firefox and Safari treated the main
  row as `auto`, making `.l-app-shell__main { overflow: auto }` behaviour
  inconsistent across browsers. (#51 §1.2)
- **`c-stat__value` now responds to `data-tone`.** Added `success`, `warning`,
  and `danger` tone variants on `.c-stat__value`, consistent with `c-badge`,
  `c-alert`, and `c-toast`. Previously tone colouring required app-layer CSS.
  (#51 §2.2)
- **Table row height derives from `--pl-control-block-size`.** Changed
  `--c-table-row-min-block-size` from a hardcoded `3rem` to
  `calc(var(--pl-control-block-size) + 0.5rem)`, so setting
  `data-density="compact"` on `<body>` now cascades to table rows automatically.
  (#51 §2.3)

### Added

- **`c-page-header` component.** A bare title + actions row for use inside
  `.l-container` and other padded regions. Unlike `.c-toolbar` (which has
  padding, border, and a surface background for shell-level bars),
  `.c-page-header` has no chrome. Includes optional `.c-page-header__subtitle`
  and `.c-page-header__actions` slots. (#51 §3.1)

### Changed

- **Docs: toast `@starting-style` timing requirement.** Documented that
  `data-visible` must be set on the next animation frame/microtask after the
  toast element is inserted into the DOM, or the browser batches the
  insertion and the attribute change, skipping the enter animation entirely.
  Includes vanilla JS and Alpine.js examples. (#51 §1.3)
- **Docs: data-table density cascade, row selection, responsive columns.**
  Added sections on how body-level density now cascades to table rows, the
  `aria-selected="true"` row selection pattern, responsive column hiding via
  container queries, and cell truncation via `.u-truncate`. (#51 §2.4, §2.3)
- **Docs: advanced brand theming recipe.** Added a full brand ramp recipe to
  the Theming guide, covering the 9-step `--pl-brand-*` ramp, the
  `--pl-focus-color` token (separate from the brand ramp), the danger hue
  collision issue (when the brand is red/orange), and `--pl-radius-xl` /
  `--pl-radius-2xl` for corporate vs. consumer feel. (#51 §2.5)
- **Docs: `@scope` + `@layer` override model.** Added a section to the
  Architecture guide explaining that layer order takes precedence over
  `@scope` proximity, so component token overrides work from plain selectors
  in `@layer app` without specificity hacks. (#51 §4.3)

### Already addressed (no changes needed)

- **`c-timeline`** and **`c-skeleton`** components already exist in the
  framework. (#51 §3.2, §3.4)
- **Dark-mode test utility** (`<html data-theme="dark">`) already exists in
  `03-themes.css`. (#51 §4.4)

## [0.1.0] - 2026-06-23

### Added

- **Enhancements** (Tier B, `@supports`-gated). All in
  `@layer porchlight.enhancements`, each degrading cleanly where unsupported:
  `interpolate-size: allow-keywords` on `:root` (enables auto-size
  animation); a scroll-state `.c-sticky-shell` that gains a shadow + blurred
  scrim when stuck (no JS scroll listener); `text-box: trim-both cap
alphabetic` on buttons/badges (optical centering); CSS Gap Decorations on
  `.l-grid[data-dividers="true"]` (purely visual dividers); and a typed
  `attr()` `.c-swatch` that reads color from a `data-color` attribute.
- **Utilities** (`.u-*`). A small, finite set of single-purpose helpers in
  `@layer porchlight.utilities`: `.u-visually-hidden` (the canonical sr-only
  pattern, one of the few `!important` allow-list spots, restored on
  focus/active), `.u-truncate` (one-line ellipsis), `.u-flow` (prose rhythm via
  sibling selector, tunable via `--u-flow-space`), `.u-surface` (ad-hoc panel
  styling), `.u-muted` (secondary text), and `.u-full-bleed` (break out to
  viewport edges inside a constrained container).
- **Data table** (`.c-table-wrap` + `.c-table`). An enterprise data table:
  sticky headers, horizontal scroll with a stable `scrollbar-gutter`, container-
  query padding, row hover (`surface-2` wash), numeric column alignment
  (`[data-align="end"]` + `tabular-nums`), and `aria-selected` row selection.
  Wraps a native `<table>`. Closes Phase 3.
- **Dialog** (`.c-dialog`). A modal dialog using the native `<dialog>` element
  with `showModal()` (top-layer, modal focus trap, Esc to close). The
  `::backdrop` provides a dimmed, blurred scrim. Enter/exit animation via
  `@starting-style` (opacity + scale) with `transition-behavior: allow-discrete`.
  Header + body + footer slots; a `.c-dialog__close` ✕ button; responsive
  sizing (`min(100% - 2rem, --c-dialog-size)` + scrollable max height).
- **Popover menu** (`.c-menu`). First overlay component, a dropdown menu
  anchored to its trigger via the native Popover API (top-layer, light-dismiss,
  focus management, no JS) and CSS anchor positioning (`position-anchor` /
  `position-area`, `@supports`-gated). Enter/exit animation via `@starting-style`
  - `transition-behavior: allow-discrete` on `overlay`/`display`. Menu items are
    real `<a>`/`<button>` (full-width, keyboard-focusable); `[data-tone="danger"]`
    for destructive items; `.c-menu__divider` for groups. Multiple menus need
    unique `--c-menu-anchor` values.
- **Badge** (`.c-badge`). A compact inline label for statuses, counts, and
  tags. Tones via `[data-tone]` (`accent`/`success`/`warning`/`danger`, plus a
  neutral default) consume the WCAG-AA `-bg`/`-text` token pairs, so they're
  legible in both themes by construction. Optional `.c-badge__dot` status pip.
- **Card** (`.c-card`). A raised surface for grouping related content
  (header + body + optional footer). Elevation comes from a soft shadow, not a
  bg contrast. The header collapses to a stack via a container query when the
  card is narrow (&lt; 28rem). An interactive variant (`data-interactive` or
  `<a.c-card>`) gets a hover lift + focus ring. First component to exercise
  the `--pl-shadow-*` elevation tokens.
- **Field** (`.c-field`). A labeled form control wrapping native
  `<input>`/`<select>`/`<textarea>`: label, control, and hint. State is driven
  by native pseudos and reflected onto the border/hint via `:has()`: focus
  draws a token-colored border **plus a 2px ring** (a 1px border swap alone is
  below the perceptual affordance threshold); invalid uses `:user-invalid`
  (Baseline 2024); disabled mutes the field. Native checkbox/radio/color inputs
  themed via `accent-color`.
- **Button** (`.c-button`). First component, the canonical action control,
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

- **A11y contrast fixes (axe-found).** A new axe-core scan caught three
  issues the token-pair contrast tests missed: the ghost-button pressed state
  (accent text on an accent-tint can't clear AA; same hue family. Now uses
  the accent TINT as the selection signal with default high-contrast text),
  the layout KPI deltas (used `--pl-color-success` directly as text; now uses
  the AA `--pl-color-success-text` pair), and the demo scroll region/handle.
- **Button hover collapsed to transparent.** The hover rule reassigned
  `--c-button-bg` to `color-mix(... var(--c-button-bg) ...)`, a self-
  referential custom-property cycle that CSS resolves to guaranteed-invalid,
  making every button's fill transparent on hover. Rewritten to set the
  `background-color` longhand instead. Ghost hover (which mixed text into
  transparent → a near-invisible veil) now gets a real accent wash.
- **`--pl-color-surface-2` too close to `--pl-color-bg` in light** (ΔL 0.02):
  secondary buttons and raised panels disappeared into the page. Widened to
  ΔL 0.04 (light-mode surface-2 96%→94%).
- **Pressed ghost/secondary tint too faint** (12% alpha): bumped to 20% so the
  selected state reads.

### Added (tooling)

- **Deterministic perceptual color checks.** A reusable `tests/lib/color.ts`
  (parses resolved `oklch`/`oklab`/`rgb`, computes luminance, contrast, ΔL,
  alpha, source-over composite) plus three guards: WCAG text contrast (refactored
  to the lib), adjacent-surface distinguishability (ΔL ≥ 0.03, catches the
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
