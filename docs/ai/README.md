# AI Working Docs — Read Me First

This folder exists so that **any coding agent or LLM** (including smaller/less capable models)
can work on Quartz correctly without re-discovering the project every session.

## How to use these docs in a session

Load files in this order, depending on the task:

| You are about to…                | Read first                                        |
| -------------------------------- | ------------------------------------------------- |
| Start any session (always)       | `CONTEXT.md` + `STATE.md`                         |
| Write or modify library code     | `BEST_PRACTICES.md` + `ARCHITECTURE.md`           |
| Add a new primitive / feature    | `WORKFLOW.md` + `specs/_TEMPLATE.md`              |
| Touch the demo/docs app (`src/`) | `ARCHITECTURE.md` §Demo app + `BEST_PRACTICES.md` |
| Release / publish                | `WORKFLOW.md` §Release checklist                  |

## The files

- **`CONTEXT.md`** — Why this project exists, what it wants to achieve, non-goals, audience.
  Rarely changes.
- **`ARCHITECTURE.md`** — How the codebase is organized and how the pieces fit together.
  Changes when structure changes.
- **`BEST_PRACTICES.md`** — Hard rules for writing code here (Angular patterns, testing,
  SSR safety, naming). Violating these fails lint/review.
- **`STATE.md`** — Snapshot of current status: what is done, in progress, and known issues.
  **Must be updated at the end of any session that changes the project's status.**
- **`WORKFLOW.md`** — Spec-driven development (SDD) process + step-by-step checklists for
  common tasks (new primitive, demo page, release).
- **`specs/`** — One spec file per feature, written _before_ implementation.
  `_TEMPLATE.md` is the template; copy it, never edit it.

## Golden rules (if you read nothing else)

1. **Zoneless + signals.** No `NgZone`, no `markForCheck()`. Use `signal()` / `computed()`.
2. **The library (`packages/quartz/`) must stay unstyled and dependency-free** (only
   `@angular/*`, `rxjs`, `tslib`). Never import demo-app code or CSS frameworks into it.
3. **Every lib change needs three things**: the code, a `*.spec.ts` test, and a CLI
   `cli/registry.js` update if files were added/removed/renamed.
4. **Run `pnpm typecheck && pnpm test` before claiming done.** The pre-commit hook runs
   lint-staged + typecheck + tests; if you didn't run them, the commit will fail anyway.
5. **Write the spec first** for anything bigger than a bug fix. See `WORKFLOW.md`.
