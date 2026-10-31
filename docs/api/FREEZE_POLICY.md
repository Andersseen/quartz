# API freeze policy

Status: **freeze candidate, not frozen.** Formal acceptance belongs to the maintainer. Nothing in this repository marks the API frozen until the
conditions in [Freeze conditions](#freeze-conditions) are all evidenced and the maintainer records the decision (below).

## What the freeze covers

The boundary is wider than TypeScript. A change is **compatibility-breaking** if it can make a valid consumer fail to compile, render or behave:

| Surface                                                                                              | Machine-checked by                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export names and kinds, per entry point                                                              | `scripts/api-guard.js` ↔ `docs/api/snapshots/*.json`                                                                                                           |
| Directive/component selectors and `exportAs`                                                         | same (read from the compiled `ɵdir`/`ɵcmp` declarations)                                                                                                       |
| Inputs, models, outputs (names, aliases, required)                                                   | same                                                                                                                                                           |
| Public method/property/function signatures, interfaces, type aliases                                 | same                                                                                                                                                           |
| Documented `DEFAULT_*` values                                                                        | same (values read from the built ESM)                                                                                                                          |
| Secondary entry point `…/primitives/forms` exports                                                   | same (own snapshot); main entry must not import `@angular/forms` (`verify:build`)                                                                              |
| Peer ranges, `sideEffects`, `exports` map, shipped files                                             | `scripts/release/artifacts.mjs` (run on the packed tarballs)                                                                                                   |
| Keyboard behavior, focus restoration, ARIA contracts, documented DOM structure and `data-qz-*` hooks | unit tests, `e2e/`, `consumer/e2e/` (three browsers, axe) — **not** covered by the snapshot, so a change here needs a freeze review even if the guard is green |

`docs/api/API_INVENTORY.md` is the generated, human-readable projection of the snapshots; there is no second export registry.

## Allowed after the freeze (no review beyond normal PR)

- Compatible bug fixes that keep the documented contracts.
- Documentation.
- Internal refactors with test coverage; performance improvements.
- Accessibility corrections that preserve existing contracts.
- **Additive** API (new export, new optional input/output) during `beta`/`rc` only with the snapshot updated in the same PR and a CHANGELOG entry; the guard
  labels such changes `ADDITIVE`.

## Requires freeze review (maintainer sign-off recorded in the PR)

- Any `BREAKING` entry from the guard: removed export, changed signature/selector/alias/default.
- Changed focus semantics, keyboard behavior, ARIA contract, documented DOM structure or public data attributes.
- Removed exported symbols; changed peer ranges (Angular, Core companion, Forms optionality).
- A change to the packaging contract (`exports`, `sideEffects`, dependencies).

A breaking change is never released as a patch. `node scripts/api-guard.js --update` must be run deliberately and the snapshot diff reviewed; use
`node scripts/api-guard.js --baseline <dir-with-last-release-snapshots>` to compare a branch against the snapshots of the last published release.

## Freeze conditions

1. The previous minor's acceptance gates are closed or explicitly waived in writing by the maintainer (0.17: manual screen-reader review and genuine
   browser Autofill evidence were still open when this was written).
2. The release rehearsal and artifact-integrity suites pass and the guarded workflow has published at least one version from validated artifacts.
3. The full consumer matrix (Angular 21.2 minimum, 21.2 current, 22; Chromium, Firefox, WebKit; SSR; hydration; axe) is green on the candidate commit.
4. Inventory, migration guide and docs are generated/verified from that commit.

## Freeze candidate record

| Field               | Value                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| Candidate commit    | **not yet recorded** — set when the 0.18 PR is merged (record the merge commit SHA) |
| Date                | not yet recorded                                                                    |
| Snapshot hash       | `sha256sum docs/api/snapshots/*.json` at the candidate commit                       |
| Maintainer decision | **PENDING** — no maintainer freeze decision has been supplied                       |

## Deprecation and breaking-change policy (proposed — pending maintainer approval)

- A deprecation is announced in the CHANGELOG and the docs for at least one minor release before removal while the major is `0.x`, and for at least one
  minor release after 1.0 before removal in the next major. Deprecated API keeps working and keeps its tests.
- Breaking changes are made only in `0.x` minors (before 1.0) or majors (after 1.0), each with a migration note under `src/content/docs/migration/`.
- Angular support follows the declared peer range; dropping an Angular major is a breaking change.
