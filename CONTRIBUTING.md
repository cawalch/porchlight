# Contributing to Porchlight

Thanks for helping build Porchlight. This guide covers setup, branching, pull-request expectations, and how previews work.

## Prerequisites

- [Node.js](https://nodejs.org) 22.12+ (Astro/Vite minimum). `.nvmrc` selects the Node 22 line; run `nvm install` then `nvm use` with nvm.
- [pnpm](https://pnpm.io) 10.0.0, pinned by `packageManager`. With Corepack available, run `corepack enable`; otherwise install the pinned CLI with `npm install --global pnpm@10.0.0`. Corepack is not bundled with every Node distribution.
- Chrome stable for previewing (the production target).

## Setup

```sh
git clone https://github.com/cawalch/porchlight.git
cd porchlight
pnpm install --frozen-lockfile
pnpm dev      # Astro docs site at http://localhost:4321/porchlight/
```

The supported contributor workflow uses Node and pnpm with `pnpm-lock.yaml`,
matching CI. Bun consumption of the published CSS package is covered in
[Getting Started](https://cawalch.github.io/porchlight/guides/getting-started);
it does not mean `bun install` / `bun test` replace this repository's commands.

```sh
pnpm build                         # package artifacts + production docs
pnpm --filter ./docs exec playwright install chromium firefox webkit chrome
pnpm test                          # Playwright; builds/serves docs if needed
pnpm lint:all
pnpm format:check
pnpm --filter ./docs astro:check
pnpm --filter ./docs llms:check
```

On Linux, use Playwright's `install --with-deps` when system libraries are
missing. Tests reuse an existing server on port 4321; stop a stale server or
set `PLAYWRIGHT_BASE_URL` to the build you intend to test. The focused native-feature suites use installed Chrome stable (154+) to verify native CSS navigation and scoped transitions; Firefox/WebKit exercise the readable fallback. Generated LLM docs
are maintained with `pnpm --filter ./docs llms:generate` when their inputs change.

Workspace layout:

```
packages/porchlight   # the CSS framework (the product)
docs/                 # Astro showcase + reference site (imports the real CSS)
```

The docs site imports the tracked workspace CSS source. Build and test the
packaged artifacts separately with `pnpm --filter @cawalch/porchlight test:package`;
a working source preview alone does not verify published exports.

## Branching & pull requests

- Branch from `main`. Follow the repository's current branch protections and wait for required checks before merging.
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
- **Per-PR previews**: the PR workflow writes `pr-preview/pr-<number>/` to `gh-pages` and posts `https://cawalch.github.io/porchlight/pr-preview/pr-<number>/`. The link becomes live only after **Publish Pages** runs. Preview updates do not trigger that workflow automatically; a maintainer can dispatch `gh workflow run publish-pages.yml --ref main`.
- Review the preview in **Chrome stable**. Use DevTools to emulate forced-colors, reduced-motion, and 200% zoom before approving.

## Committing

- Run `pnpm format` (Prettier) before committing.
- Keep `CHANGELOG.md` updated under an `Unreleased` heading.
- Never commit `PLAN.md`, `ROADMAP.md`, or other planning/LLM scratch docs — they are gitignored on purpose and stay local.

## Code of conduct

Participation in this project is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Please be excellent to each other.
