# Contributing

Quartz is a headless Angular library: behavior, accessibility and positioning live in the packages; styling and the docs site live in the demo app.

## Before you start

1. Read `docs/ai/CONTEXT.md`, `docs/ai/STATE.md` and `docs/ai/BEST_PRACTICES.md` (the same files agents use).
2. Open an issue (or comment on one) for anything larger than a fix. Features follow the spec-driven flow in `docs/ai/WORKFLOW.md`.
3. Work on a branch (`feat/…`, `fix/…`, `chore/…`) and open a PR against `main`. Never push to `main` or publish from a workstation — releases only go through the guarded
   workflow in `docs/releases/RELEASE_RUNBOOK.md`.

## Environment

Node ≥ 20 (CI uses 22), pnpm 10 (`corepack enable`), `pnpm install --frozen-lockfile`, then `pnpm exec playwright install` for browser tests.

## What a PR must show

| Change                                | Evidence expected                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library behavior                      | Unit tests beside the source (`*.spec.ts`) that fail without the fix                                                                                          |
| Anything DOM/focus/keyboard dependent | Browser test: `e2e/` for the demo, `consumer/e2e/` when it must hold in an installed, AOT-compiled, SSR-hydrated app (jsdom hides real focus/blur order)      |
| Public API change                     | `pnpm build:lib && node scripts/api-guard.js --update`, review the snapshot diff, `pnpm api:inventory`, CHANGELOG, and a migration note if consumers must act |
| New primitive                         | Checklist in `docs/ai/WORKFLOW.md`, including `cli/registry.js`                                                                                               |
| Docs                                  | `pnpm docs:api`, `pnpm docs:content`, then the `:check` variants and `pnpm docs:doctor` (generated pages are not edited by hand)                              |

Run before pushing: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test`. Coverage thresholds are not lowered to make a PR pass. The pre-commit hook runs lint-staged, typecheck and tests.

## Reporting

- Bugs: use the _Bug report_ template. A minimal reproduction (StackBlitz or a repository with `ng new` + the failing template) is required; say which Angular version, package version, browser and OS.
- Accessibility regressions: use the _Accessibility regression_ template (assistive technology, browser, expected vs actual announcement).
- Vulnerabilities: see `SECURITY.md`. Do not file them as public issues.
