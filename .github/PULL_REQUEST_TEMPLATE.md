## Summary

<!-- What does this PR add or change? Note the roadmap phase if relevant. -->

## Type

<!-- check one -->

- [ ] `feat`
- [ ] `fix`
- [ ] `docs`
- [ ] `chore`
- [ ] `test`
- [ ] `refactor`

## Definition of done

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

## Preview

<!-- The preview bot will post the /pr/<n>/ URL. Call out anything reviewers should check specifically (density, RTL, a particular state). -->

## Notes

<!-- Screenshots, edge cases, follow-ups. -->
