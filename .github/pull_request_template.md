## What and why

## Evidence

- [ ] Unit tests added/updated (fail without the fix)
- [ ] Browser/consumer test added when behavior depends on a real DOM, focus or SSR
- [ ] `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test` pass
- [ ] Public API changed? `node scripts/api-guard.js --update` reviewed, `pnpm api:inventory`, CHANGELOG, migration note
- [ ] Docs regenerated (`pnpm docs:api`, `pnpm docs:content`) — generated pages not edited by hand
- [ ] No release/publish steps in this PR (releases: `docs/releases/RELEASE_RUNBOOK.md`)
