# Contributing to Porchlight

Thanks for helping build Porchlight. This guide covers setup, branching, pull-request expectations, and how previews work.

## Prerequisites

- [Node.js](https://nodejs.org) 22+ (see `.nvmrc`) — run `nvm use` if you use nvm.
- [pnpm](https://pnpm.io), managed via [corepack](https://nodejs.org/api/corepack.html) using the `packageManager` field in `package.json`: `corepack enable`.
- Chrome stable for previewing (the production target).

## Setup

```sh
git clone https://github.com/cawalch/porchlight.git
cd porchlight
pnpm install
pnpm dev      # Astro docs site at http://localhost:4321
```

Workspace layout:

```
packages/porchlight   # the CSS framework (the product)
docs/                 # Astro showcase + reference site (imports the real CSS)
```

The docs site imports `@cawalch/porchlight` directly from the workspace, so the showcase **never drifts** from source — the documentation *is* the preview.

## Branching & pull requests

- Branch from `main`. `main` is protected: it requires a green CI run and at least one review.
- Branch naming: `<type>/<phase>-<slug>` — e.g. `feat/03-button`, `docs/theming`, `fix/card-rtl`.
- `type` follows [Conventional Commits](https://www.conventionalcommits.org): `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- **Keep PRs around ~400 lines** of changed CSS + docs + tests combined. If a PR crosses ~500 lines it is probably doing two things — split it.
- Squash-merge on merge; the squash title should be a Conventional Commits summary.

## Per-PR definition of done

Every PR description starts from `.github/PULL_REQUEST_TEMPLATE.md`. A PR is not mergeable until **all** of these pass:

- [ ] All CSS inside the correct `@layer` (no unlayered framework rules).
- [ ] `pnpm lint` clean; no new `!important` outside the allow-list (a11y utilities, print hide).
- [ ] No hard-coded colors in components — everything flows through tokens.
- [ ] Logical properties only (`inline` / `block` / `start` / `end`).
- [ ] Docs page added/updated (component `.mdx` or regenerated token table).
- [ ] Preview page added/updated and linked from `/preview`.
- [ ] `pnpm test` (Playwright snapshots + axe) passes.
- [ ] Verified in light, dark, compact/comfortable/touch density, RTL, 200% zoom, forced-colors, reduced-motion.
- [ ] `CHANGELOG.md` entry added under `Unreleased`.
- [ ] Diff ≤ ~400 LoC (split if larger).

## Preview deployments

- **Production** (`main`): the docs site builds and deploys to the GitHub Pages root on every merge to `main`.
- **Per-PR previews**: every PR builds the docs site and deploys it to `https://cawalch.github.io/porchlight/pr/<number>/`. A bot posts the URL as a PR comment.
- Review the preview in **Chrome stable**. Use DevTools to emulate forced-colors, reduced-motion, and 200% zoom before approving.

## Committing

- Run `pnpm format` (Prettier) before committing.
- Keep `CHANGELOG.md` updated under an `Unreleased` heading.
- Never commit `PLAN.md`, `ROADMAP.md`, or other planning/LLM scratch docs — they are gitignored on purpose and stay local.

## Code of conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Please be excellent to each other.
