# Porchlight Components Reference

Offline reference for all 51 CSS-only and semantic HTML components included in `@cawalch/porchlight`.

## Architecture & Modular Usage

Porchlight components are authored in `@layer porchlight.components` and can be imported individually or as complete bundles. When importing individual components, always import the core module first to establish cascade layer ordering, design tokens, themes, and base resets:

```css
@import "@cawalch/porchlight/core.css";
/* Import specific components as needed: */
@import "@cawalch/porchlight/components/button.css";
@import "@cawalch/porchlight/components/card.css";
```

## Component Index

| Component                             | Primary Selector         | Dependencies | Description                                                                                                                                                                                                                                                                                                                |
| :------------------------------------ | :----------------------- | :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [accordion](#accordion)               | `.pl-c-accordion`        | None         | A collapsible disclosure built on native <details>/<summary>. Animates open/close to/from height: auto using interpolate-size: allow-keywords (scoped to the panel). As a universal fallback, uses the grid-template-rows: 0fr -> 1fr technique which works without it.                                                    |
| [alert](#alert)                       | `.pl-c-alert`            | None         | An inline notification - contextual feedback within the page flow (not an overlay like toast). Four tones via [data-tone]: info (default), success, warning, danger. Each consumes the semantic -bg/-text pairs for WCAG-AA.                                                                                               |
| [avatar](#avatar)                     | `.pl-c-avatar`           | None         | A user identity chip - initials in a colored circle, or an image. Used in headers, lists, comments, and mentions. Three sizes via [data-size]: "sm" (1.5rem), default (2.5rem), "lg" (3rem).                                                                                                                               |
| [badge](#badge)                       | `.pl-c-badge`            | None         | A compact label for statuses, counts, and tags. Inline-flex pill; tones via [data-tone]. Tones consume the semantic -bg/-text pairs (success/warning/ danger) that were already made WCAG-AA, plus an accent and a neutral default.                                                                                        |
| [breadcrumb](#breadcrumb)             | `.pl-c-breadcrumb`       | None         | A trail of navigation links showing the user's location in the site/app hierarchy. The last item has aria-current="page" and is not a link.                                                                                                                                                                                |
| [button](#button)                     | `.pl-c-button`           | None         | The canonical action control. Native <button> (or <a> when it is genuinely navigation). Token-driven via component-local --pl-c-button-* aliases that default to framework semantic tokens, so an app can theme one button or all of them without leaving the component.                                                   |
| [calendar](#calendar)                 | `.pl-c-calendar`         | None         | Date, date-range, and time picker surfaces for SaaS/BPM apps. CSS-only: app code owns date math, locale, roving tabindex, keyboard commands, validation timing, and popover open state. Porchlight styles the semantic HTML contract emitted by SSR, hypermedia fragments, or component frameworks.                        |
| [card](#card)                         | `.pl-c-card`             | None         | A raised surface grouping related content - the workhorse of SaaS dashboards (KPI tiles, list items, settings sections, detail panels). Header + body slots; the header adapts to the card's OWN width via a container query (not the viewport), so a card in a narrow split pane stacks its header even on a wide screen. |
| [chart](#chart)                       | `.pl-c-chart`            | None         | An accessible frame for app-owned charts. Porchlight provides metric headers, legends, plotting slots, loading/empty/error states, and a table fallback container. It does not draw charts or prescribe a charting engine.                                                                                                 |
| [chip](#chip)                         | `.pl-c-chip`             | None         | A compact tag/pill with an optional remove button. Uses relative color syntax (oklch(from ...)) to derive tinted backgrounds from the accent token.                                                                                                                                                                        |
| [combobox](#combobox)                 | `.pl-c-combobox`         | None         | A framework-neutral combobox/autocomplete contract for entity lookup, async search, select-only triggers, and optional multi-select chips.                                                                                                                                                                                 |
| [command-palette](#command-palette)   | `.pl-c-command`          | None         | A Cmd+K quick-action search overlay. Search input at top, grouped action list below, keyboard navigation (JS responsibility). Uses the Popover API for top-layer rendering + @starting-style for enter animation.                                                                                                          |
| [data-table](#data-table)             | `.pl-c-table-wrap`       | None         | An enterprise data table: sticky headers, horizontal scroll with a stable scrollbar gutter, container-query padding, hover/selection affordances, sortable columns, row selection (checkbox column), expandable detail rows, sticky first column, and density modes.                                                       |
| [description-list](#description-list) | `.pl-c-description`      | None         | A label + value grid for detail panels, metadata displays, and summary cards. Wraps the native <dl> element so semantics and accessibility come for free. The #1 most-rebuilt pattern in SaaS apps after page headers.                                                                                                     |
| [dialog](#dialog)                     | `.pl-c-dialog`           | None         | A modal dialog for confirmations, forms, and detail views. Uses the native <dialog> element with showModal() (top-layer, modal focus trap, Esc to close). The ::backdrop pseudo-element provides the scrim.                                                                                                                |
| [drawer](#drawer)                     | `.pl-c-drawer`           | None         | An off-canvas panel that slides in from a viewport edge. Uses the native Popover API for top-layer rendering + light-dismiss, combined with @starting-style for a smooth enter/exit animation (mirrors the dialog and popover-menu pattern).                                                                               |
| [dropdown](#dropdown)                 | `.pl-c-dropdown`         | None         | A button-triggered option menu using the Popover API + anchor positioning. Use it for sort/filter/action choices that need richer rendering than a native select. For form submission, keep a native select or sync a hidden input in app JavaScript.                                                                      |
| [empty-state](#empty-state)           | `.pl-c-empty`            | None         | The "no data yet" placeholder - what users see in a table, list, or chart before there is anything to show. A centered illustration or icon, a title, a description, and an optional call-to-action. The psychological anchor that turns a blank screen into an invitation.                                                |
| [entity-inspector](#entity-inspector) | `.pl-c-entity-inspector` | None         | A native non-modal record popover. popovertarget provides the implicit anchor; repeated instances need unique HTML ids, never per-instance CSS anchor names.                                                                                                                                                               |
| [field](#field)                       | `.pl-c-field`            | None         | A labeled form control: label, native input, and hint/messages. Wraps native <input>/<select>/<textarea> so we inherit all their behavior (constraint validation, autofill, IME, spellcheck). No JS, no custom widgets.                                                                                                    |
| [file-upload](#file-upload)           | `.pl-c-file-upload`      | None         | A drag-and-drop file upload zone. The native <input type="file"> is visually hidden; the zone is the click target. Uses :has() for the drag-over state (set [data-dragging] via JS) and disabled state.                                                                                                                    |
| [filter-builder](#filter-builder)     | `.pl-c-filter-builder`   | None         | CSS-only UI contracts for query builders, query chips, and saved views. Apps own query grammar, validation, persistence, and execution.                                                                                                                                                                                    |
| [form](#form)                         | `.pl-c-form`             | None         | SaaS form composition helpers built on native controls. These classes do not replace semantic HTML: use real <form>, <fieldset>, <legend>, <label>, <input>, <select>, and <textarea>; Porchlight only handles layout and chrome.                                                                                          |
| [inline-loading](#inline-loading)     | `.pl-c-inline-loading`   | None         | Local, indeterminate progress for actions and compact application regions.                                                                                                                                                                                                                                                 |
| [miller-columns](#miller-columns)     | `.pl-c-miller-columns`   | None         | A CSS-only cascading column explorer for nested hierarchies (IAM roles, folder structures, taxonomies). Columns scroll inline with support for scroll snapping and fluid width control.                                                                                                                                    |
| [nav](#nav)                           | `.pl-c-nav`              | None         | A vertical navigation list for sidebars. Icon + label items with active state via aria-current="page". Collapsible sub-sections via native <details> for zero-JS expand/collapse. Designed to compose with .pl-l-app-shell__sidebar.                                                                                       |
| [page-header](#page-header)           | `.pl-c-page-header`      | None         | A title + actions row for the top of a page or panel section inside a container. Unlike .pl-c-toolbar (which is a shell-level bar designed to sit flush against an edge with padding, border, and a surface background), .pl-c-page-header is intentionally bare: no background, no border, no padding.                    |
| [pagination](#pagination)             | `.pl-c-pagination`       | None         | Navigation control for paginated data - the bar below a table or list. Previous / Next buttons flank a row of page number buttons. A compact [data-size="sm"] variant shrinks the controls for embedded use (inside a toolbar or table footer).                                                                            |
| [panel-deck](#panel-deck)             | `.pl-c-panel-deck`       | None         | Native, fixed-content panels. The complete tabs mode is the enhancement gate: older marker implementations must keep the readable stacked fallback.                                                                                                                                                                        |
| [popover-menu](#popover-menu)         | `.pl-c-menu`             | None         | A dropdown menu anchored to its trigger - account menus, action menus, context menus. Uses the native Popover API (top-layer, light-dismiss, focus management) + CSS anchor positioning (tethered to the trigger) + @starting-style for a native enter/exit animation.                                                     |
| [progress](#progress)                 | `.pl-c-progress`         | None         | A linear progress indicator for task completion, uploads, or capacity. Supports both semantic <progress> elements and <div> structures.                                                                                                                                                                                    |
| [reveal](#reveal)                     | `.pl-c-reveal`           | None         | Elements that fade/slide in as they enter the viewport. Uses scroll-driven animations (animation-timeline: view()) - zero JavaScript, no IntersectionObserver.                                                                                                                                                             |
| [scroll-progress](#scroll-progress)   | `.pl-c-scroll-progress`  | None         | A fixed bar at the viewport top that fills as the user scrolls the page. Uses scroll-driven animations (animation-timeline: scroll()) - zero JavaScript for the progress tracking.                                                                                                                                         |
| [scroll-region](#scroll-region)       | `.pl-c-scroll-region`    | None         | Bounded, keyboard-operable scrollport. State indicators live in enhancements so compat.css and this component remain consumable by older CSS parsers.                                                                                                                                                                      |
| [section-nav](#section-nav)           | `.pl-c-section-nav`      | None         | In-page navigation stays ordinary fragment links without scroll-target-group. Applications own sticky positioning and scroll offsets for their headers.                                                                                                                                                                    |
| [segmented](#segmented)               | `.pl-c-segmented`        | None         | A compact inline switcher for binary/ternary toggles (list/grid/table view, day/week/month). Built on native radio inputs - CSS-only, keyboard accessible, no JavaScript.                                                                                                                                                  |
| [skeleton](#skeleton)                 | `.pl-c-skeleton`         | None         | Loading placeholders that mimic the shape of real content. A pulsing shimmer communicates "something is loading" without a spinner (which implies an indeterminate wait). Used in cards, lists, and tables while data fetches.                                                                                             |
| [split-button](#split-button)         | `.pl-c-split`            | `button`     | A composite action control: a primary button (the default action) paired with a dropdown toggle that opens a menu of alternative actions. The canonical "Save ▼" pattern - click the label to do the default, click the chevron to pick a variant.                                                                         |
| [split-pane](#split-pane)             | `.pl-c-split-pane`       | None         | CSS-only split panes for app shells, object explorers, editors, inspectors, and process builders. Apps own pointer/keyboard resize behavior and persist sizes by updating custom properties or data attributes.                                                                                                            |
| [stat](#stat)                         | `.pl-c-stat`             | None         | A KPI / metric tile - the workhorse of SaaS dashboards. Displays a single number with a label, an optional unit, a trend indicator (up/down/flat), and an optional sparkline slot. Designed to sit inside .pl-l-grid (auto-fitting dashboard widgets) or inside .pl-c-card bodies.                                         |
| [stepper](#stepper)                   | `.pl-c-stepper`          | None         | A horizontal (default) or vertical (container-query collapse) multi-step indicator. Each step has a visual marker (circle with number or check) and a label. Connectors between steps are CSS-only (no SVG).                                                                                                               |
| [switch](#switch)                     | `.pl-c-switch`           | None         | A CSS-only toggle switch built on a native checkbox. No JavaScript for the toggle itself: <input type="checkbox" role="switch"> + <label>.                                                                                                                                                                                 |
| [tabs](#tabs)                         | `.pl-c-tabs`             | None         | A tabbed region: a [role="tablist"] of [role="tab"] controls that switch between [role="tabpanel"]s. The canonical master-detail / settings / dashboard-sectioning primitive. Wraps real <button> tabs.                                                                                                                    |
| [tag-input](#tag-input)               | `.pl-c-tag-input`        | None         | A text input that accepts multiple values as removable chips. The CSS handles the layout (wrapping chips + inline input); JS handles tokenization (enter/comma to add, backspace to remove).                                                                                                                               |
| [textarea-auto](#textarea-auto)       | `.pl-c-textarea-auto`    | None         | A textarea that grows to fit its content automatically using field-sizing: content (Chrome 123+). No JavaScript auto-resize needed.                                                                                                                                                                                        |
| [timeline](#timeline)                 | `.pl-c-timeline`         | None         | A vertical activity feed with markers, connector lines, and per-item content. Each item has a dot/marker on a vertical line, with the content to the side.                                                                                                                                                                 |
| [toast](#toast)                       | `.pl-c-toast`            | None         | A transient notification that slides in from a screen edge. Unlike alerts (inline), toasts are overlay-level and auto-dismiss (via JS timer; the CSS handles the visual entrance/exit).                                                                                                                                    |
| [toolbar](#toolbar)                   | `.pl-c-toolbar`          | None         | A horizontal bar grouping actions above a data region - the SaaS "action bar" on top of tables, lists, and canvases. Pairs a leading cluster (search, filters, bulk actions) with a trailing cluster (primary actions, overflow menu). On narrow containers the two halves wrap independently.                             |
| [tooltip](#tooltip)                   | `.pl-c-tooltip`          | None         | A hover/focus tooltip anchored to its trigger using CSS Anchor Positioning. Zero JavaScript for positioning. Auto-flips when near viewport edges via position-try-fallbacks.                                                                                                                                               |
| [tree](#tree)                         | `.pl-c-tree`             | None         | A CSS-only tree view for app navigation, object explorers, process folders, rule libraries, and other nested SaaS/BPM structures.                                                                                                                                                                                          |
| [workflow-board](#workflow-board)     | `.pl-c-workflow-board`   | None         | A CSS-only board shell for BPM/SaaS work queues: lanes, cards, swimlanes, WIP/count metadata, and visual state hooks for app-owned drag/drop.                                                                                                                                                                              |

## Component Details

### accordion

A collapsible disclosure built on native <details>/<summary>. Animates open/close to/from height: auto using interpolate-size: allow-keywords (scoped to the panel). As a universal fallback, uses the grid-template-rows: 0fr -> 1fr technique which works without it.

- **Primary Selector**: `.pl-c-accordion`
- **Import**: `@cawalch/porchlight/components/accordion.css`
- **Minified Import**: `@cawalch/porchlight/components/accordion.min.css`
- **Dist File**: `dist/components/accordion.css`
- **Minified Dist File**: `dist/components/accordion.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/accordion.css";
```

### alert

An inline notification - contextual feedback within the page flow (not an overlay like toast). Four tones via [data-tone]: info (default), success, warning, danger. Each consumes the semantic -bg/-text pairs for WCAG-AA.

- **Primary Selector**: `.pl-c-alert`
- **Import**: `@cawalch/porchlight/components/alert.css`
- **Minified Import**: `@cawalch/porchlight/components/alert.min.css`
- **Dist File**: `dist/components/alert.css`
- **Minified Dist File**: `dist/components/alert.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/alert.css";
```

### avatar

A user identity chip - initials in a colored circle, or an image. Used in headers, lists, comments, and mentions. Three sizes via [data-size]: "sm" (1.5rem), default (2.5rem), "lg" (3rem).

- **Primary Selector**: `.pl-c-avatar`
- **Import**: `@cawalch/porchlight/components/avatar.css`
- **Minified Import**: `@cawalch/porchlight/components/avatar.min.css`
- **Dist File**: `dist/components/avatar.css`
- **Minified Dist File**: `dist/components/avatar.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/avatar.css";
```

### badge

A compact label for statuses, counts, and tags. Inline-flex pill; tones via [data-tone]. Tones consume the semantic -bg/-text pairs (success/warning/ danger) that were already made WCAG-AA, plus an accent and a neutral default.

- **Primary Selector**: `.pl-c-badge`
- **Import**: `@cawalch/porchlight/components/badge.css`
- **Minified Import**: `@cawalch/porchlight/components/badge.min.css`
- **Dist File**: `dist/components/badge.css`
- **Minified Dist File**: `dist/components/badge.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/badge.css";
```

### breadcrumb

A trail of navigation links showing the user's location in the site/app hierarchy. The last item has aria-current="page" and is not a link.

- **Primary Selector**: `.pl-c-breadcrumb`
- **Import**: `@cawalch/porchlight/components/breadcrumb.css`
- **Minified Import**: `@cawalch/porchlight/components/breadcrumb.min.css`
- **Dist File**: `dist/components/breadcrumb.css`
- **Minified Dist File**: `dist/components/breadcrumb.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/breadcrumb.css";
```

### button

The canonical action control. Native <button> (or <a> when it is genuinely navigation). Token-driven via component-local --pl-c-button-* aliases that default to framework semantic tokens, so an app can theme one button or all of them without leaving the component.

- **Primary Selector**: `.pl-c-button`
- **Import**: `@cawalch/porchlight/components/button.css`
- **Minified Import**: `@cawalch/porchlight/components/button.min.css`
- **Dist File**: `dist/components/button.css`
- **Minified Dist File**: `dist/components/button.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/button.css";
```

### calendar

Date, date-range, and time picker surfaces for SaaS/BPM apps. CSS-only: app code owns date math, locale, roving tabindex, keyboard commands, validation timing, and popover open state. Porchlight styles the semantic HTML contract emitted by SSR, hypermedia fragments, or component frameworks.

- **Primary Selector**: `.pl-c-calendar`
- **Import**: `@cawalch/porchlight/components/calendar.css`
- **Minified Import**: `@cawalch/porchlight/components/calendar.min.css`
- **Dist File**: `dist/components/calendar.css`
- **Minified Dist File**: `dist/components/calendar.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/calendar.css";
```

### card

A raised surface grouping related content - the workhorse of SaaS dashboards (KPI tiles, list items, settings sections, detail panels). Header + body slots; the header adapts to the card's OWN width via a container query (not the viewport), so a card in a narrow split pane stacks its header even on a wide screen.

- **Primary Selector**: `.pl-c-card`
- **Import**: `@cawalch/porchlight/components/card.css`
- **Minified Import**: `@cawalch/porchlight/components/card.min.css`
- **Dist File**: `dist/components/card.css`
- **Minified Dist File**: `dist/components/card.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/card.css";
```

### chart

An accessible frame for app-owned charts. Porchlight provides metric headers, legends, plotting slots, loading/empty/error states, and a table fallback container. It does not draw charts or prescribe a charting engine.

- **Primary Selector**: `.pl-c-chart`
- **Import**: `@cawalch/porchlight/components/chart.css`
- **Minified Import**: `@cawalch/porchlight/components/chart.min.css`
- **Dist File**: `dist/components/chart.css`
- **Minified Dist File**: `dist/components/chart.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/chart.css";
```

### chip

A compact tag/pill with an optional remove button. Uses relative color syntax (oklch(from ...)) to derive tinted backgrounds from the accent token.

- **Primary Selector**: `.pl-c-chip`
- **Import**: `@cawalch/porchlight/components/chip.css`
- **Minified Import**: `@cawalch/porchlight/components/chip.min.css`
- **Dist File**: `dist/components/chip.css`
- **Minified Dist File**: `dist/components/chip.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/chip.css";
```

### combobox

A framework-neutral combobox/autocomplete contract for entity lookup, async search, select-only triggers, and optional multi-select chips.

- **Primary Selector**: `.pl-c-combobox`
- **Import**: `@cawalch/porchlight/components/combobox.css`
- **Minified Import**: `@cawalch/porchlight/components/combobox.min.css`
- **Dist File**: `dist/components/combobox.css`
- **Minified Dist File**: `dist/components/combobox.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/combobox.css";
```

### command-palette

A Cmd+K quick-action search overlay. Search input at top, grouped action list below, keyboard navigation (JS responsibility). Uses the Popover API for top-layer rendering + @starting-style for enter animation.

- **Primary Selector**: `.pl-c-command`
- **Import**: `@cawalch/porchlight/components/command-palette.css`
- **Minified Import**: `@cawalch/porchlight/components/command-palette.min.css`
- **Dist File**: `dist/components/command-palette.css`
- **Minified Dist File**: `dist/components/command-palette.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/command-palette.css";
```

### data-table

An enterprise data table: sticky headers, horizontal scroll with a stable scrollbar gutter, container-query padding, hover/selection affordances, sortable columns, row selection (checkbox column), expandable detail rows, sticky first column, and density modes.

- **Primary Selector**: `.pl-c-table-wrap`
- **Import**: `@cawalch/porchlight/components/data-table.css`
- **Minified Import**: `@cawalch/porchlight/components/data-table.min.css`
- **Dist File**: `dist/components/data-table.css`
- **Minified Dist File**: `dist/components/data-table.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/data-table.css";
```

### description-list

A label + value grid for detail panels, metadata displays, and summary cards. Wraps the native <dl> element so semantics and accessibility come for free. The #1 most-rebuilt pattern in SaaS apps after page headers.

- **Primary Selector**: `.pl-c-description`
- **Import**: `@cawalch/porchlight/components/description-list.css`
- **Minified Import**: `@cawalch/porchlight/components/description-list.min.css`
- **Dist File**: `dist/components/description-list.css`
- **Minified Dist File**: `dist/components/description-list.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/description-list.css";
```

### dialog

A modal dialog for confirmations, forms, and detail views. Uses the native <dialog> element with showModal() (top-layer, modal focus trap, Esc to close). The ::backdrop pseudo-element provides the scrim.

- **Primary Selector**: `.pl-c-dialog`
- **Import**: `@cawalch/porchlight/components/dialog.css`
- **Minified Import**: `@cawalch/porchlight/components/dialog.min.css`
- **Dist File**: `dist/components/dialog.css`
- **Minified Dist File**: `dist/components/dialog.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/dialog.css";
```

### drawer

An off-canvas panel that slides in from a viewport edge. Uses the native Popover API for top-layer rendering + light-dismiss, combined with @starting-style for a smooth enter/exit animation (mirrors the dialog and popover-menu pattern).

- **Primary Selector**: `.pl-c-drawer`
- **Import**: `@cawalch/porchlight/components/drawer.css`
- **Minified Import**: `@cawalch/porchlight/components/drawer.min.css`
- **Dist File**: `dist/components/drawer.css`
- **Minified Dist File**: `dist/components/drawer.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/drawer.css";
```

### dropdown

A button-triggered option menu using the Popover API + anchor positioning. Use it for sort/filter/action choices that need richer rendering than a native select. For form submission, keep a native select or sync a hidden input in app JavaScript.

- **Primary Selector**: `.pl-c-dropdown`
- **Import**: `@cawalch/porchlight/components/dropdown.css`
- **Minified Import**: `@cawalch/porchlight/components/dropdown.min.css`
- **Dist File**: `dist/components/dropdown.css`
- **Minified Dist File**: `dist/components/dropdown.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/dropdown.css";
```

### empty-state

The "no data yet" placeholder - what users see in a table, list, or chart before there is anything to show. A centered illustration or icon, a title, a description, and an optional call-to-action. The psychological anchor that turns a blank screen into an invitation.

- **Primary Selector**: `.pl-c-empty`
- **Import**: `@cawalch/porchlight/components/empty-state.css`
- **Minified Import**: `@cawalch/porchlight/components/empty-state.min.css`
- **Dist File**: `dist/components/empty-state.css`
- **Minified Dist File**: `dist/components/empty-state.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/empty-state.css";
```

### entity-inspector

A native non-modal record popover. popovertarget provides the implicit anchor; repeated instances need unique HTML ids, never per-instance CSS anchor names.

- **Primary Selector**: `.pl-c-entity-inspector`
- **Import**: `@cawalch/porchlight/components/entity-inspector.css`
- **Minified Import**: `@cawalch/porchlight/components/entity-inspector.min.css`
- **Dist File**: `dist/components/entity-inspector.css`
- **Minified Dist File**: `dist/components/entity-inspector.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/entity-inspector.css";
```

### field

A labeled form control: label, native input, and hint/messages. Wraps native <input>/<select>/<textarea> so we inherit all their behavior (constraint validation, autofill, IME, spellcheck). No JS, no custom widgets.

- **Primary Selector**: `.pl-c-field`
- **Import**: `@cawalch/porchlight/components/field.css`
- **Minified Import**: `@cawalch/porchlight/components/field.min.css`
- **Dist File**: `dist/components/field.css`
- **Minified Dist File**: `dist/components/field.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/field.css";
```

### file-upload

A drag-and-drop file upload zone. The native <input type="file"> is visually hidden; the zone is the click target. Uses :has() for the drag-over state (set [data-dragging] via JS) and disabled state.

- **Primary Selector**: `.pl-c-file-upload`
- **Import**: `@cawalch/porchlight/components/file-upload.css`
- **Minified Import**: `@cawalch/porchlight/components/file-upload.min.css`
- **Dist File**: `dist/components/file-upload.css`
- **Minified Dist File**: `dist/components/file-upload.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/file-upload.css";
```

### filter-builder

CSS-only UI contracts for query builders, query chips, and saved views. Apps own query grammar, validation, persistence, and execution.

- **Primary Selector**: `.pl-c-filter-builder`
- **Import**: `@cawalch/porchlight/components/filter-builder.css`
- **Minified Import**: `@cawalch/porchlight/components/filter-builder.min.css`
- **Dist File**: `dist/components/filter-builder.css`
- **Minified Dist File**: `dist/components/filter-builder.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/filter-builder.css";
```

### form

SaaS form composition helpers built on native controls. These classes do not replace semantic HTML: use real <form>, <fieldset>, <legend>, <label>, <input>, <select>, and <textarea>; Porchlight only handles layout and chrome.

- **Primary Selector**: `.pl-c-form`
- **Import**: `@cawalch/porchlight/components/form.css`
- **Minified Import**: `@cawalch/porchlight/components/form.min.css`
- **Dist File**: `dist/components/form.css`
- **Minified Dist File**: `dist/components/form.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/form.css";
```

### inline-loading

Local, indeterminate progress for actions and compact application regions.

- **Primary Selector**: `.pl-c-inline-loading`
- **Import**: `@cawalch/porchlight/components/inline-loading.css`
- **Minified Import**: `@cawalch/porchlight/components/inline-loading.min.css`
- **Dist File**: `dist/components/inline-loading.css`
- **Minified Dist File**: `dist/components/inline-loading.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/inline-loading.css";
```

### miller-columns

A CSS-only cascading column explorer for nested hierarchies (IAM roles, folder structures, taxonomies). Columns scroll inline with support for scroll snapping and fluid width control.

- **Primary Selector**: `.pl-c-miller-columns`
- **Import**: `@cawalch/porchlight/components/miller-columns.css`
- **Minified Import**: `@cawalch/porchlight/components/miller-columns.min.css`
- **Dist File**: `dist/components/miller-columns.css`
- **Minified Dist File**: `dist/components/miller-columns.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/miller-columns.css";
```

### nav

A vertical navigation list for sidebars. Icon + label items with active state via aria-current="page". Collapsible sub-sections via native <details> for zero-JS expand/collapse. Designed to compose with .pl-l-app-shell__sidebar.

- **Primary Selector**: `.pl-c-nav`
- **Import**: `@cawalch/porchlight/components/nav.css`
- **Minified Import**: `@cawalch/porchlight/components/nav.min.css`
- **Dist File**: `dist/components/nav.css`
- **Minified Dist File**: `dist/components/nav.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/nav.css";
```

### page-header

A title + actions row for the top of a page or panel section inside a container. Unlike .pl-c-toolbar (which is a shell-level bar designed to sit flush against an edge with padding, border, and a surface background), .pl-c-page-header is intentionally bare: no background, no border, no padding.

- **Primary Selector**: `.pl-c-page-header`
- **Import**: `@cawalch/porchlight/components/page-header.css`
- **Minified Import**: `@cawalch/porchlight/components/page-header.min.css`
- **Dist File**: `dist/components/page-header.css`
- **Minified Dist File**: `dist/components/page-header.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/page-header.css";
```

### pagination

Navigation control for paginated data - the bar below a table or list. Previous / Next buttons flank a row of page number buttons. A compact [data-size="sm"] variant shrinks the controls for embedded use (inside a toolbar or table footer).

- **Primary Selector**: `.pl-c-pagination`
- **Import**: `@cawalch/porchlight/components/pagination.css`
- **Minified Import**: `@cawalch/porchlight/components/pagination.min.css`
- **Dist File**: `dist/components/pagination.css`
- **Minified Dist File**: `dist/components/pagination.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/pagination.css";
```

### panel-deck

Native, fixed-content panels. The complete tabs mode is the enhancement gate: older marker implementations must keep the readable stacked fallback.

- **Primary Selector**: `.pl-c-panel-deck`
- **Import**: `@cawalch/porchlight/components/panel-deck.css`
- **Minified Import**: `@cawalch/porchlight/components/panel-deck.min.css`
- **Dist File**: `dist/components/panel-deck.css`
- **Minified Dist File**: `dist/components/panel-deck.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/panel-deck.css";
```

### popover-menu

A dropdown menu anchored to its trigger - account menus, action menus, context menus. Uses the native Popover API (top-layer, light-dismiss, focus management) + CSS anchor positioning (tethered to the trigger) + @starting-style for a native enter/exit animation.

- **Primary Selector**: `.pl-c-menu`
- **Import**: `@cawalch/porchlight/components/popover-menu.css`
- **Minified Import**: `@cawalch/porchlight/components/popover-menu.min.css`
- **Dist File**: `dist/components/popover-menu.css`
- **Minified Dist File**: `dist/components/popover-menu.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/popover-menu.css";
```

### progress

A linear progress indicator for task completion, uploads, or capacity. Supports both semantic <progress> elements and <div> structures.

- **Primary Selector**: `.pl-c-progress`
- **Import**: `@cawalch/porchlight/components/progress.css`
- **Minified Import**: `@cawalch/porchlight/components/progress.min.css`
- **Dist File**: `dist/components/progress.css`
- **Minified Dist File**: `dist/components/progress.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/progress.css";
```

### reveal

Elements that fade/slide in as they enter the viewport. Uses scroll-driven animations (animation-timeline: view()) - zero JavaScript, no IntersectionObserver.

- **Primary Selector**: `.pl-c-reveal`
- **Import**: `@cawalch/porchlight/components/reveal.css`
- **Minified Import**: `@cawalch/porchlight/components/reveal.min.css`
- **Dist File**: `dist/components/reveal.css`
- **Minified Dist File**: `dist/components/reveal.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/reveal.css";
```

### scroll-progress

A fixed bar at the viewport top that fills as the user scrolls the page. Uses scroll-driven animations (animation-timeline: scroll()) - zero JavaScript for the progress tracking.

- **Primary Selector**: `.pl-c-scroll-progress`
- **Import**: `@cawalch/porchlight/components/scroll-progress.css`
- **Minified Import**: `@cawalch/porchlight/components/scroll-progress.min.css`
- **Dist File**: `dist/components/scroll-progress.css`
- **Minified Dist File**: `dist/components/scroll-progress.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/scroll-progress.css";
```

### scroll-region

Bounded, keyboard-operable scrollport. State indicators live in enhancements so compat.css and this component remain consumable by older CSS parsers.

- **Primary Selector**: `.pl-c-scroll-region`
- **Import**: `@cawalch/porchlight/components/scroll-region.css`
- **Minified Import**: `@cawalch/porchlight/components/scroll-region.min.css`
- **Dist File**: `dist/components/scroll-region.css`
- **Minified Dist File**: `dist/components/scroll-region.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/scroll-region.css";
```

### section-nav

In-page navigation stays ordinary fragment links without scroll-target-group. Applications own sticky positioning and scroll offsets for their headers.

- **Primary Selector**: `.pl-c-section-nav`
- **Import**: `@cawalch/porchlight/components/section-nav.css`
- **Minified Import**: `@cawalch/porchlight/components/section-nav.min.css`
- **Dist File**: `dist/components/section-nav.css`
- **Minified Dist File**: `dist/components/section-nav.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/section-nav.css";
```

### segmented

A compact inline switcher for binary/ternary toggles (list/grid/table view, day/week/month). Built on native radio inputs - CSS-only, keyboard accessible, no JavaScript.

- **Primary Selector**: `.pl-c-segmented`
- **Import**: `@cawalch/porchlight/components/segmented.css`
- **Minified Import**: `@cawalch/porchlight/components/segmented.min.css`
- **Dist File**: `dist/components/segmented.css`
- **Minified Dist File**: `dist/components/segmented.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/segmented.css";
```

### skeleton

Loading placeholders that mimic the shape of real content. A pulsing shimmer communicates "something is loading" without a spinner (which implies an indeterminate wait). Used in cards, lists, and tables while data fetches.

- **Primary Selector**: `.pl-c-skeleton`
- **Import**: `@cawalch/porchlight/components/skeleton.css`
- **Minified Import**: `@cawalch/porchlight/components/skeleton.min.css`
- **Dist File**: `dist/components/skeleton.css`
- **Minified Dist File**: `dist/components/skeleton.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/skeleton.css";
```

### split-button

A composite action control: a primary button (the default action) paired with a dropdown toggle that opens a menu of alternative actions. The canonical "Save ▼" pattern - click the label to do the default, click the chevron to pick a variant.

- **Primary Selector**: `.pl-c-split`
- **Import**: `@cawalch/porchlight/components/split-button.css`
- **Minified Import**: `@cawalch/porchlight/components/split-button.min.css`
- **Dist File**: `dist/components/split-button.css`
- **Minified Dist File**: `dist/components/split-button.min.css`
- **Dependencies**: `button`

```css
@import "@cawalch/porchlight/components/split-button.css";
```

### split-pane

CSS-only split panes for app shells, object explorers, editors, inspectors, and process builders. Apps own pointer/keyboard resize behavior and persist sizes by updating custom properties or data attributes.

- **Primary Selector**: `.pl-c-split-pane`
- **Import**: `@cawalch/porchlight/components/split-pane.css`
- **Minified Import**: `@cawalch/porchlight/components/split-pane.min.css`
- **Dist File**: `dist/components/split-pane.css`
- **Minified Dist File**: `dist/components/split-pane.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/split-pane.css";
```

### stat

A KPI / metric tile - the workhorse of SaaS dashboards. Displays a single number with a label, an optional unit, a trend indicator (up/down/flat), and an optional sparkline slot. Designed to sit inside .pl-l-grid (auto-fitting dashboard widgets) or inside .pl-c-card bodies.

- **Primary Selector**: `.pl-c-stat`
- **Import**: `@cawalch/porchlight/components/stat.css`
- **Minified Import**: `@cawalch/porchlight/components/stat.min.css`
- **Dist File**: `dist/components/stat.css`
- **Minified Dist File**: `dist/components/stat.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/stat.css";
```

### stepper

A horizontal (default) or vertical (container-query collapse) multi-step indicator. Each step has a visual marker (circle with number or check) and a label. Connectors between steps are CSS-only (no SVG).

- **Primary Selector**: `.pl-c-stepper`
- **Import**: `@cawalch/porchlight/components/stepper.css`
- **Minified Import**: `@cawalch/porchlight/components/stepper.min.css`
- **Dist File**: `dist/components/stepper.css`
- **Minified Dist File**: `dist/components/stepper.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/stepper.css";
```

### switch

A CSS-only toggle switch built on a native checkbox. No JavaScript for the toggle itself: <input type="checkbox" role="switch"> + <label>.

- **Primary Selector**: `.pl-c-switch`
- **Import**: `@cawalch/porchlight/components/switch.css`
- **Minified Import**: `@cawalch/porchlight/components/switch.min.css`
- **Dist File**: `dist/components/switch.css`
- **Minified Dist File**: `dist/components/switch.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/switch.css";
```

### tabs

A tabbed region: a [role="tablist"] of [role="tab"] controls that switch between [role="tabpanel"]s. The canonical master-detail / settings / dashboard-sectioning primitive. Wraps real <button> tabs.

- **Primary Selector**: `.pl-c-tabs`
- **Import**: `@cawalch/porchlight/components/tabs.css`
- **Minified Import**: `@cawalch/porchlight/components/tabs.min.css`
- **Dist File**: `dist/components/tabs.css`
- **Minified Dist File**: `dist/components/tabs.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/tabs.css";
```

### tag-input

A text input that accepts multiple values as removable chips. The CSS handles the layout (wrapping chips + inline input); JS handles tokenization (enter/comma to add, backspace to remove).

- **Primary Selector**: `.pl-c-tag-input`
- **Import**: `@cawalch/porchlight/components/tag-input.css`
- **Minified Import**: `@cawalch/porchlight/components/tag-input.min.css`
- **Dist File**: `dist/components/tag-input.css`
- **Minified Dist File**: `dist/components/tag-input.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/tag-input.css";
```

### textarea-auto

A textarea that grows to fit its content automatically using field-sizing: content (Chrome 123+). No JavaScript auto-resize needed.

- **Primary Selector**: `.pl-c-textarea-auto`
- **Import**: `@cawalch/porchlight/components/textarea-auto.css`
- **Minified Import**: `@cawalch/porchlight/components/textarea-auto.min.css`
- **Dist File**: `dist/components/textarea-auto.css`
- **Minified Dist File**: `dist/components/textarea-auto.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/textarea-auto.css";
```

### timeline

A vertical activity feed with markers, connector lines, and per-item content. Each item has a dot/marker on a vertical line, with the content to the side.

- **Primary Selector**: `.pl-c-timeline`
- **Import**: `@cawalch/porchlight/components/timeline.css`
- **Minified Import**: `@cawalch/porchlight/components/timeline.min.css`
- **Dist File**: `dist/components/timeline.css`
- **Minified Dist File**: `dist/components/timeline.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/timeline.css";
```

### toast

A transient notification that slides in from a screen edge. Unlike alerts (inline), toasts are overlay-level and auto-dismiss (via JS timer; the CSS handles the visual entrance/exit).

- **Primary Selector**: `.pl-c-toast`
- **Import**: `@cawalch/porchlight/components/toast.css`
- **Minified Import**: `@cawalch/porchlight/components/toast.min.css`
- **Dist File**: `dist/components/toast.css`
- **Minified Dist File**: `dist/components/toast.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/toast.css";
```

### toolbar

A horizontal bar grouping actions above a data region - the SaaS "action bar" on top of tables, lists, and canvases. Pairs a leading cluster (search, filters, bulk actions) with a trailing cluster (primary actions, overflow menu). On narrow containers the two halves wrap independently.

- **Primary Selector**: `.pl-c-toolbar`
- **Import**: `@cawalch/porchlight/components/toolbar.css`
- **Minified Import**: `@cawalch/porchlight/components/toolbar.min.css`
- **Dist File**: `dist/components/toolbar.css`
- **Minified Dist File**: `dist/components/toolbar.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/toolbar.css";
```

### tooltip

A hover/focus tooltip anchored to its trigger using CSS Anchor Positioning. Zero JavaScript for positioning. Auto-flips when near viewport edges via position-try-fallbacks.

- **Primary Selector**: `.pl-c-tooltip`
- **Import**: `@cawalch/porchlight/components/tooltip.css`
- **Minified Import**: `@cawalch/porchlight/components/tooltip.min.css`
- **Dist File**: `dist/components/tooltip.css`
- **Minified Dist File**: `dist/components/tooltip.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/tooltip.css";
```

### tree

A CSS-only tree view for app navigation, object explorers, process folders, rule libraries, and other nested SaaS/BPM structures.

- **Primary Selector**: `.pl-c-tree`
- **Import**: `@cawalch/porchlight/components/tree.css`
- **Minified Import**: `@cawalch/porchlight/components/tree.min.css`
- **Dist File**: `dist/components/tree.css`
- **Minified Dist File**: `dist/components/tree.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/tree.css";
```

### workflow-board

A CSS-only board shell for BPM/SaaS work queues: lanes, cards, swimlanes, WIP/count metadata, and visual state hooks for app-owned drag/drop.

- **Primary Selector**: `.pl-c-workflow-board`
- **Import**: `@cawalch/porchlight/components/workflow-board.css`
- **Minified Import**: `@cawalch/porchlight/components/workflow-board.min.css`
- **Dist File**: `dist/components/workflow-board.css`
- **Minified Dist File**: `dist/components/workflow-board.min.css`
- **Dependencies**: None

```css
@import "@cawalch/porchlight/components/workflow-board.css";
```
