# Porchlight agent skill

Use this skill when generating or reviewing HTML and CSS that uses Porchlight.

## What Porchlight is

Porchlight is a native-CSS design system for dense, keyboard-first product UI.
It ships CSS contracts, not JavaScript behavior. The application owns state,
data, focus management, keyboard controllers, persistence, and timers.

## Non-negotiables

1. Use only public classes from the contract: `pl-l-*`, `pl-c-*`, `pl-u-*`.
   Never invent a class, utility, or token.
2. Use real HTML semantics: `table`, `form`, `fieldset`, `label`, `input`,
   `button`, `nav`, `main`, `section`, `dialog`, `details`. Never replace them
   with divs.
3. Use `--pl-*` tokens for spacing, color, radius, motion, and control sizing.
   Do not introduce a parallel spacing or color scale.
4. Keep app CSS small and local. Override component tokens in `@layer app`
   instead of rewriting component internals.
5. Do not claim a behavior is built in unless the contract says so. Link to the
   component docs for the responsibilities the application keeps.

## Workflow

1. Read `contracts/components.json` and choose the component by `selector`,
   `title`, and `description`.
2. Open the component's `docs` route for the required HTML, states, and
   accessibility notes.
3. Open the `preview` route when you need a complete composition.
4. Emit semantic HTML with the documented classes and tokens.
5. Add only the application-owned state the component expects, using native
   attributes such as `aria-selected`, `aria-current`, `aria-expanded`,
   `aria-invalid`, `disabled`, `required`, and `data-tone`.

## Never do this

- Do not write Tailwind-style utility soup or arbitrary inline styles.
- Do not make div-based tables, fake buttons, or clickable divs.
- Do not use a modal for a filter, sort, or row action; use the native Popover
  API or a menu.
- Do not nest cards inside cards for layout.
- Do not omit `.pl-c-table-wrap` around `.pl-c-table`.
- Do not use color alone for status. Pair it with text, an icon, or a badge.
- Do not use `!important`. The framework reserves it for a small accessibility
  allow-list.

## Contracts and references

- `contracts/components.json`: selector, import, docs, preview, status, and
  since for every component.
- `contracts/components.schema.json`: JSON Schema for the contract.
- `docs/public/components.json`: the same contracts served by the docs site.
- `docs/public/llms.txt`: compact rules, examples, and links.
- `docs/public/llms-full.txt`: the full model pack.

If a task needs a behavior the contract does not provide, say so and write the
application-owned controller separately. Do not hide it in CSS.
