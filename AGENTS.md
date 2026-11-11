# Porchlight Agent Instructions (`AGENTS.md`)

This file provides system instructions for AI coding assistants (including lighter/weaker models such as Gemini Flash-Lite, GPT-4o-mini, and Claude Haiku) generating or modifying UI components, pages, and layouts in this codebase.

---

## 1. Core Architecture & Philosophy

Porchlight is a **pure native-CSS, semantic HTML framework** with zero runtime JavaScript dependencies.

- **Cascade layers**: Styles live in `@layer porchlight.core`, `.layout`, `.components`, `.utilities`, `.enhancements`. Application overrides belong in `@layer app`.
- **CSS classes**:
  - `.pl-l-*`: Layout primitives (`.pl-l-app-shell`, `.pl-l-container`, `.pl-l-stack`, `.pl-l-cluster`, `.pl-l-grid`, `.pl-l-sidebar`).
  - `.pl-c-*`: Component chrome (`.pl-c-button`, `.pl-c-field`, `.pl-c-toolbar`, `.pl-c-table`, `.pl-c-card`, `.pl-c-chip`, etc.).
  - `.pl-u-*`: Utility adjustments (`.pl-u-muted`, `.pl-u-muted-sm`, `.pl-u-truncate`, `.pl-u-tabular-nums`, `.pl-u-sr-only`).
- **Semantic HTML first**: Always output real HTML elements: `<header>`, `<aside>`, `<main>`, `<nav>`, `<table>`, `<form>`, `<dl>`, `<button>`, `<input>`, `<dialog>`.

---

## 2. Anti-Hallucination & Styling Guardrails (STRICT)

1. **NO Tailwind or Utility Frameworks**:
   - ❌ Never write: `flex items-center justify-between p-4 bg-gray-100 rounded-md shadow text-sm`.
   - ❌ Never invent classes like: `pl-flex`, `pl-mt-4`, `pl-p-2`, `pl-text-gray`.
   - ✅ Always use Porchlight layout and component classes.
2. **NO Arbitrary Inline Styles**:
   - ❌ Never write: `style="padding: 12px; background: #1e1e2f; border: 1px solid #333;"`.
   - ✅ Only consume Porchlight design tokens for instances: `style="--pl-l-stack-gap: var(--pl-space-3); max-inline-size: 24rem;"`.
3. **NO Div-Based Tables**:
   - ❌ Never create `<div class="table">` or `<div class="row">`.
   - ✅ Always wrap a real table: `<div class="pl-c-table-wrap"><table class="pl-c-table">...</table></div>`.
4. **NO JavaScript Modals for Simple Options**:
   - ❌ Never use full `<dialog>` modals for sort, filter, or row menus.
   - ✅ Use the native Popover API (`<div popover class="pl-c-dropdown__menu">` or `.pl-c-popover-menu`) with `popovertarget`.

---

## 3. Component Selection Cheat Sheet

| Need                         | Use Porchlight Primitive                                                                  | Never Use                          |
| :--------------------------- | :---------------------------------------------------------------------------------------- | :--------------------------------- |
| **SaaS App Shell**           | `<div class="pl-l-app-shell">` with `topbar`, `sidebar`, `main`                           | Unstructured flex divs             |
| **Filter & Search Bar**      | `<div class="pl-c-toolbar">` with `.pl-c-toolbar__group`                                  | Sibling input rows without toolbar |
| **Search Box with Shortcut** | `.pl-c-field.pl-c-field--inline` + `.pl-c-input-group` + `<kbd class="pl-c-kbd">⌘K</kbd>` | Bare `<input>`                     |
| **Filter Dropdowns**         | `.pl-c-dropdown` with `<button popovertarget="...">` or native `<select>`                 | Unstyled floating div              |
| **Active Filters**           | `<span class="pl-c-chip">` with remove button `✕`                                         | Static badge or plain text         |
| **Status / Severity**        | `<span class="pl-c-badge" data-tone="danger\|warning\|accent\|success">`                  | Inline colored badges              |
| **View Switcher**            | `<div class="pl-c-segmented" role="radiogroup">`                                          | Sibling buttons                    |
| **Detail Inspector**         | `<aside class="pl-c-drawer" popover="auto">` or `.pl-c-entity-inspector`                  | Full-screen modal dialog           |
| **Data Table**               | `<div class="pl-c-table-wrap"><table class="pl-c-table">`                                 | Nested grid/div tables             |
| **Numbers / Currency**       | Right-align `data-align="end"` + class `.pl-u-tabular-nums`                               | Unaligned left text                |

---

## 4. The Canonical Search + Multi-Filter Toolbar Pattern

Whenever generating a search bar with filters, output this complete, unbreakable structure:

```html
<div class="pl-c-card" data-surface="app" style="overflow: visible;">
  <div class="pl-c-toolbar">
    <!-- Search & Filters -->
    <div class="pl-c-toolbar__group">
      <!-- Search Input with ⌘K -->
      <div class="pl-c-field pl-c-field--search">
        <span class="pl-u-sr-only">Search</span>
        <div class="pl-c-input-group pl-c-input-group--search">
          <span class="pl-c-input-group__addon">🔍</span>
          <input
            type="search"
            class="pl-c-field__control"
            placeholder="Search records (is:open)..."
          />
          <span class="pl-c-input-group__addon"
            ><kbd class="pl-c-kbd">⌘K</kbd></span
          >
        </div>
      </div>

      <!-- Quick Filter Dropdown -->
      <div class="pl-c-dropdown">
        <button
          type="button"
          class="pl-c-dropdown__trigger"
          popovertarget="filter-status"
        >
          <span>Status: <strong>All</strong></span>
          <svg
            class="pl-c-dropdown__chevron"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div popover class="pl-c-dropdown__menu" id="filter-status">
          <button
            class="pl-c-dropdown__option"
            role="menuitemradio"
            aria-checked="true"
          >
            All
          </button>
          <button
            class="pl-c-dropdown__option"
            role="menuitemradio"
            aria-checked="false"
          >
            Active
          </button>
          <button
            class="pl-c-dropdown__option"
            role="menuitemradio"
            aria-checked="false"
          >
            Pending
          </button>
        </div>
      </div>
    </div>

    <!-- View Switcher & Action -->
    <div class="pl-c-toolbar__group">
      <div class="pl-c-segmented" role="radiogroup" aria-label="View format">
        <label class="pl-c-segmented__item"
          ><input type="radio" name="view" value="list" checked /><span
            >List</span
          ></label
        >
        <label class="pl-c-segmented__item"
          ><input type="radio" name="view" value="board" /><span
            >Board</span
          ></label
        >
      </div>
      <button type="button" class="pl-c-button" data-variant="primary">
        + Create
      </button>
    </div>
  </div>

  <!-- Active Filter Chips -->
  <div class="pl-c-toolbar__chips">
    <span class="pl-u-muted-sm">Active:</span>
    <span class="pl-c-chip" data-tone="accent">
      <span>Status: <strong>Active</strong></span>
      <button
        type="button"
        class="pl-c-chip__remove"
        aria-label="Remove filter"
      >
        ✕
      </button>
    </span>
    <button
      type="button"
      class="pl-c-button"
      data-variant="ghost"
      style="font-size: var(--pl-text-xs); padding-inline: var(--pl-space-2);"
    >
      Clear all
    </button>
    <span class="pl-u-muted-sm" style="margin-inline-start: auto;"
      >Showing 24 results</span
    >
  </div>
</div>
```

---

## 5. Token Reference

Use only these CSS variables:

- **Spacing**: `var(--pl-space-1)` (4px), `var(--pl-space-2)` (8px), `var(--pl-space-3)` (12px), `var(--pl-space-4)` (16px), `var(--pl-space-6)` (24px).
- **Colors**: `var(--pl-color-bg)`, `var(--pl-color-surface)`, `var(--pl-color-surface-2)`, `var(--pl-color-border)`, `var(--pl-color-text)`, `var(--pl-color-text-muted)`.
- **States**: `var(--pl-color-accent)`, `var(--pl-color-danger)`, `var(--pl-color-warning)`, `var(--pl-color-success)`.
- **Radius**: `var(--pl-radius-sm)` (6px), `var(--pl-radius-md)` (8px), `var(--pl-radius-lg)` (12px), `var(--pl-radius-pill)`.
