# STATE — Current Project Status

> **Last updated: 2026-08-18** (Listbox minor release preparation, v0.1.0)
>
> ⚠️ **Agents: update this file at the end of any session that changes what's true here**
> (new primitive, status change, publish, new known issue). Update the date and commit ref.

## Review-plan remediation status (see `REVIEW_PLAN.md`)

All P0 items are done. Previous session completed **P1.1–P1.4**, **P2.1–P2.2**, **P2.4–P2.6**
and **P3.1–P3.2**. This hardening round additionally completed:

- **P1.5** `TreeService` coverage substantially improved (→ 44 new tests, now near 95%+).
- **P2.4** end-to-end CLI smoke test added (`cli/cli.smoke.spec.js`) and wired into
  `pnpm test` via a new Vitest workspace project.
- **P3.3** route-cache workaround: new `(docs)/tooltip.page.ts` required a manual `extraRoutes`
  entry in `src/app/app.config.ts`, confirming the workaround is still needed.
- Added **package build smoke test** (`scripts/verify-build.js`) verifying `dist/quartz/`
  contents and public API exports.
- Added **tooltip docs/demo page** (`/tooltip`) with sidebar entry and snippets.
- Expanded **E2E behavior coverage** for dialog (Escape/backdrop/focus trap), tooltip
  (hover/focus/placement), tree (keyboard nav/selection), and splitter (keyboard resize).
- CI aligned with `packageManager` (`pnpm@10.30.1`) and now runs `build:lib` +
  `verify:build` before unit tests.
- Library version bumped to **v0.0.5** (v0.0.4 was already published to npm) and CI now
  includes an npm publish job after `unit-tests` + `e2e-tests` pass on `main`.

**P3.4 is now done**: the `ReplaySubject` (DialogRef, one-shot) vs `Subject` (OverlayRef,
reusable) split is deliberate, documented in both files and covered by tests. No review-plan
items remain open.

## Version & publish status

- Library `quartz-headless` **v0.1.0** is prepared for publish. Root monorepo package stays
  private; npm publication is an explicit GitHub Actions dispatch with `publish: true`.
- Docs site live at <https://quartz-headless.pages.dev> (Cloudflare Pages).
- Pre-1.0: breaking API changes are acceptable but should be deliberate and documented in
  the README/demo pages.

## Primitive status matrix

| Primitive      | Lib code | Unit tests | Demo page | CLI registry      | Notes                                                                                                        |
| -------------- | -------- | ---------- | --------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| overlay        | ✅       | ✅         | ✅        | ✅                | Foundation for dialog + tooltip                                                                              |
| dialog         | ✅       | ✅ (+SSR)  | ✅        | ✅ deps:[overlay] | Includes drawer positioning                                                                                  |
| splitter       | ✅       | ✅         | ✅        | ✅                | Container-scoped service pattern                                                                             |
| toast          | ✅       | ✅         | ✅        | ✅                | Types now in `toast.types.ts` (naming deviation resolved)                                                    |
| drag-drop      | ✅       | ✅         | ✅        | ✅                |                                                                                                              |
| tooltip        | ✅       | ✅         | ✅        | ✅ deps:[overlay] | Docs page now live at `/tooltip`                                                                             |
| tree           | ✅       | ✅         | ✅        | ✅                | WAI-ARIA keyboard nav + roving tabindex (default template). Lazy per-level `loadChildren`. Manual extraRoute |
| listbox        | ✅       | ✅         | ✅        | ✅                | Single/multi selection, active-descendant, typeahead and disabled options                                    |
| virtual-scroll | ✅       | ✅         | ✅        | ✅                | Has ResizeObserver support                                                                                   |
| viewport       | ✅       | ✅         | ✅        | ✅                |                                                                                                              |

## Tree lazy loading (2026-08-18)

`qz-tree` gained an optional `loadChildren` input (`docs/ai/specs/tree-lazy-loading.md`).
Nothing about the existing API changed — without the input the behaviour is byte-for-byte
what it was. Worth knowing:

- `TreeNode.hasChildren?: boolean` lets a node declare children before they are known;
  when absent, expandability is still inferred from `children`.
- Load state lives in `TreeService` (`loadState` / `isLoading` / `loadError` / `retry`) and
  reaches consumer templates as **signals** on `TreeNodeContext`
  (`loadState`, `loading`, `error`, `retry`).
- A failed load leaves the node in `error` **and collapsed**; expanding it again (or
  `retry()`) re-issues the request. A successful load never repeats.
- **`expandAll()` never triggers loads** — it only expands already-loaded levels. Same for
  `config.expandAll`. A node with `expanded: true` in the data _does_ load, because that is
  a per-node request.
- Gotcha discovered here: `TreeService.init()` now reads service-internal signals, so the
  `TreeComponent` effects wrap their service calls in `untracked()`. Without it the init
  effect subscribes to `expandedIds` and re-initializes (wiping expansion + loaded
  children) on every expand. Keep imperative service calls out of effect tracking.

## Library review fixes (2026-08-18, v0.0.6)

A review pass over every primitive; details in `CHANGELOG.md` under 0.0.6. The ones that
change behaviour or that are easy to regress:

- **`TreeConfig.toggleOnClick` was dead config** — declared, defaulted to `true`, read
  nowhere. Now implemented: clicking a parent row expands/collapses it _and_ selects it.
  This changed one E2E test that had (accidentally) relied on click-not-expanding.
- **Toast containers swallowed clicks.** The six aria-live regions are always rendered so
  announcements work; they are now `pointer-events: none` with the toasts themselves
  `auto`. jsdom does not apply `pointer-events` from a component stylesheet, so this is
  guarded by an E2E test (`elementFromPoint` at each page corner) — verified to fail
  against the old CSS.
- **Tooltip had no Escape dismissal** (WAI-ARIA APG requires it). Added for both the text
  and template paths, wired to the same document listener lifecycle as the scroll close.
- **Dialog focus/ARIA**: the panel is `tabindex="-1"` and takes focus when it holds nothing
  focusable; generated `aria-labelledby`/`aria-describedby` ids are only applied when an
  element actually uses them (explicitly configured ids are always applied).
- `<qz-tree>` now also accepts a **content-projected `<ng-template>`**. Note this activated
  the docs page's custom-template example, which had been silently dead and read
  `toggle`/`select` off the node instead of the context — fixed in the same pass.

## In progress / next up

- **Next composition primitives**: Menu (Overlay) and Combobox (Overlay + Listbox).

## Known issues / gotchas (live)

- **AnalogJS route cache**: new `(docs)/*.page.ts` files still need a manual entry in
  `extraRoutes` (`src/app/app.config.ts`). Currently listed there: tree, virtual-scroll,
  viewport, **tooltip**. Do not remove entries without re-verifying the route in a fresh
  `.angular`/Vite cache.
- CLAUDE.md may lag reality on small details. When CLAUDE.md and the code disagree,
  **the code wins**; then fix CLAUDE.md.
- `package.json` has a machine-specific script `update-editor` pointing at a local Vertex
  path — ignore it, don't "fix" it, it's the author's local tooling.

## Recent history (context for "why is it like this")

- Tree lazy loading (2026-08-18) — `loadChildren` per-level fetching, `hasChildren` flag,
  signal-based load state on `TreeNodeContext`, demo section on `/tree`.
- Hardening round (2026-08-04) — tooltip docs, TreeService coverage, CLI/package smoke tests,
  E2E behavior coverage, CI alignment.
- PR #15 `feature/lib-updates` — dialog + tooltip implementation, signal return types,
  ResizeObserver in virtual scroll, tooltip types.
- PR #12 `feature/tailiwnd` — Tailwind 4 in the demo app.
- PR #11 `feature/add-volt-ui` — demo app chrome migrated to `@voltui/components`.
