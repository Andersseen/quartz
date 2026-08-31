# STATE — Current Project Status

> **Last updated: 2026-08-31** (0.2.0 navigation, selection and controls on feature/0.2.0-navigation-selection-controls)
>
> ⚠️ **Agents: update this file at the end of any session that changes what's true here**
> (new primitive, status change, publish, new known issue). Update the date and commit ref.

## Directionality Core foundation (2026-08-28)

Added `packages/core/src/directionality/` — `DirectionalityService` (signal-based, resolves
`document.documentElement`'s effective `dir` once at construction) plus pure helpers
(`resolveDirection`, `inlineToPhysical`/`physicalToInline`, `inlineStartKey`/`inlineEndKey`/
`resolveInlineArrowKey`). Full audit, API, and decisions are in
`docs/ai/specs/directionality.md`. Key points for future sessions:

- `CollectionConfig` gained `direction: Direction` (default `'ltr'`) — `handleKeydown`'s
  horizontal-axis Arrow mapping is now direction-aware; default behavior is byte-for-byte
  unchanged. Vertical Up/Down are never affected.
- `OverlayPlacement`'s `top-start`/`top-end`/`bottom-start`/`bottom-end` now resolve against
  the anchor's own `dir` (via `resolveDirection` in `OverlayRef`); `left`/`right` placements
  stay purely physical. `calculatePosition()` gained a trailing optional `direction` param.
- **Deliberately unchanged**: Splitter's ArrowLeft/Right stay physical (position is measured
  from the container's physical left edge; mirroring only the keyboard would desync it from
  pointer dragging). Listbox and Tree keep their own physical key handling — neither calls
  `CollectionStore.handleKeydown` today, so fixing Collection didn't reach them; revisit when
  a Menu/Tabs primitive needs the same mirroring.
- No `MutationObserver`: direction is resolved once, with `refresh()`/`set()` as explicit,
  cheap escape hatches for apps that toggle direction dynamically.
- New demo page at `/directionality` (Core, sidebar + `extraRoutes` entry like tree/viewport/
  tooltip/listbox).

## Quartz 0.1.0 foundation release prep (2026-08-30)

Quartz is now prepared for the first real minor release:
`@quartz-headless/core@0.1.0` and `@quartz-headless/primitives@0.1.0`.

- Core hardening: `CollectionStore` repeated-character typeahead now cycles matching items
  instead of searching the repeated string literally; focus helpers avoid restoring focus
  to removed, disabled, hidden or otherwise unfocusable targets.
- New Primitive: `Menu` (`qzMenuTrigger`, `qzMenu`, `qzMenuItem`, `qzMenuSeparator`,
  `qzMenuCheckboxItem`, `qzMenuRadioGroup`, `qzMenuRadioItem`) built from Collection,
  Overlay, Dismiss, Focus and Directionality. Supports roving tabindex, typeahead, disabled
  items, nested submenus, RTL inline-start/end keyboard behavior, outside/tree dismissal,
  checkbox items and radio groups.
- New Primitive: `Popover` (`qzPopoverTrigger`, `qzPopover`) built on Overlay. It is
  non-modal by default, supports controlled/uncontrolled `open`, placement/offset/flip,
  outside/Escape dismissal, ARIA trigger relationships, and optional initial focus for
  interactive content.
- CLI registry now includes `menu` and `popover` as Primitives with
  `peerDeps: ['@quartz-headless/core']`; `verify-build` now checks their built public API
  exports.
- Demo/docs now include `/menu` and `/popover`, sidebar entries, route-cache `extraRoutes`,
  updated README install/package language, and removal of stale unscoped package examples
  from user-facing docs.

## Split into @quartz-headless/core + @quartz-headless/primitives (2026-08-27)

The single-package Core/Primitives split from 2026-08-26 (see git history) has been
superseded: Quartz now ships as **two separate, independently-versioned npm packages**
under the `@quartz-headless` npm org — `@quartz-headless/core`
(`packages/core/`) and `@quartz-headless/primitives` (`packages/primitives/`, depends on
core via a real `peerDependency`). `packages/quartz/` no longer exists. Full details —
dependency graph, why cross-package resolution must go through `node_modules` and not a
source-pointing tsconfig path, why the Vitest source-alias shortcut doesn't work — live in
`ARCHITECTURE.md`. Read that before touching either package's build/test config; the
constraints there aren't obvious and are easy to accidentally undo.

- **The old unscoped `quartz-headless` package is frozen** at its last published version
  (v0.2.1) per an explicit decision — CI no longer builds or publishes it. Don't resurrect
  `packages/quartz/` or its publish job.
- This repo is now a **real pnpm workspace** (`pnpm-workspace.yaml: packages/*`) for the
  first time — it wasn't one before, despite the `packages/` folder naming.
- Root `package.json`: added `"private": true` (wasn't actually set before, despite
  CLAUDE.md claiming it was — the code/config always wins over stale docs).
- `pnpm typecheck` and `pnpm build:lib` both build `@quartz-headless/core` first, then
  build/typecheck primitives against it — this ordering is required, not incidental.
  Running `ng build quartz-primitives` (or its Vitest project) standalone without core
  built first will fail to resolve `@quartz-headless/core` — that's expected.
- CLI (`cli/registry.js`, `cli/commands/add.js`) redesigned again: Core stays flat
  copy-source with zero deps; Primitives entries switched from `deps` (copied Core
  siblings) to `peerDeps: ['@quartz-headless/core']` — `quartz add dialog` now tells the
  consumer to `npm install @quartz-headless/core` instead of copying `focus`/`dismiss`
  source. Output is flat again (`<output>/<name>/`), no more layer-nested folders.
- Demo app (`src/`) now imports from `@quartz-headless/core` /
  `@quartz-headless/primitives` (aliased to each package's source for fast local dev — see
  `ARCHITECTURE.md` "Path aliases"). Sidebar shows two groups ("Core"/"Primitives");
  per-page badges say "Core" or "Primitive" matching the real classification (previously
  ad-hoc category words like "Layout"/"Interaction"/"Selection").
- CI (`.github/workflows/deploy.yml`) publish job now publishes core then primitives
  independently, each with its own "already published?" version check.

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

- `quartz-headless` (legacy, unscoped) is **frozen** at its last published version
  (v0.2.1) — no longer built or published from CI.
- `@quartz-headless/core` and `@quartz-headless/primitives` are at **v0.2.0** in their
  `package.json`. CI's `publish` job (`.github/workflows/deploy.yml`) auto-publishes on
  `main` whenever a package's `package.json` version isn't already live on npm.
- Root monorepo package stays `"private": true`; npm publication happens per-package from
  CI on push to `main` (see "Publish" row in ARCHITECTURE.md's build/test topology table).
- Docs site live at <https://quartz-headless.pages.dev> (Cloudflare Pages).
- Pre-1.0: breaking API changes are acceptable but should be deliberate and documented in
  the README/demo pages.

## Combobox primitive implemented (2026-08-31)

`docs/ai/specs/combobox.md` captures the post-0.1.0 Combobox architecture decision, and
`packages/primitives/src/combobox/` now implements the first editable Combobox primitive.

Key decision: Combobox should reuse Core `CollectionStore`, `Overlay`, `Dismiss`, `Focus`
and `Directionality`, and it should reuse Listbox behaviour conceptually, but it should not
directly compose the current `ListboxDirective`/`ListboxOptionDirective` as-is. The current
Listbox container owns focus/key handling and `aria-activedescendant`; editable Combobox
must keep DOM focus on the input and put the active descendant relationship there. If build
work reveals real duplication, prefer a small primitives-private shared option controller
over a new Core abstraction.

Implemented API: `qzCombobox`, `qzComboboxInput`, `qzComboboxContent`,
`qzComboboxListbox`, `qzComboboxOption` and optional `qzComboboxTrigger`. The primitive has
controlled `value`, `inputValue` and `open` models, input-owned ARIA, Overlay-backed popup
rendering, default/custom/no filtering, disabled options, object values with `displayWith`
and `compareWith`, outside/focus/scroll dismissal and IME-safe keyboard handling.

## Quartz 0.2.0 navigation, selection and controls (2026-08-31)

`docs/ai/specs/0.2.0-navigation-selection-controls.md` captures the release audit and
implementation decisions. The scoped packages are prepared as
`@quartz-headless/core@0.2.0` and `@quartz-headless/primitives@0.2.0`.

- Core added `scroll-lock` with `createScrollLock(document)`. It coordinates nested and
  independent consumers per `Document`, preserves the original body overflow style, exposes
  `lock()`, `unlock()`, `destroy()` and is a no-op under SSR. Dialog now uses this Core
  utility instead of keeping a private body overflow counter.
- Primitives added Select, Tabs, Accordion and Switch. Select composes Overlay, Dismiss,
  Focus, Collection and Directionality; Tabs uses Collection + Directionality for roving
  focus and RTL horizontal keys; Accordion uses Collection for header navigation only;
  Switch stays intentionally standalone.
- Listbox, Combobox and Select were reviewed together. No shared public selection
  abstraction was added because the three widgets have different focus ownership models.
  Keep using Core `CollectionStore` directly unless a fourth primitive proves a smaller
  primitives-private extraction is worth it.
- Docs, sidebar, route-cache `extraRoutes`, CLI registry, CLI smoke coverage and package
  build verification now include `scroll-lock`, `select`, `tabs`, `accordion` and `switch`.
  `@quartz-headless/primitives` peers on `@quartz-headless/core@^0.2.0`.
  Presence/exit animations remain explicitly out of scope for this minor.

## Primitive status matrix

| Primitive             | Lib code | Unit tests | Demo page | CLI registry                        | Notes                                                                                                        |
| --------------------- | -------- | ---------- | --------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| overlay (Core)        | ✅       | ✅         | ✅        | ✅ deps:[dismiss]                   | Foundation for dialog + tooltip                                                                              |
| dialog                | ✅       | ✅ (+SSR)  | ✅        | ✅ peerDeps:[@quartz-headless/core] | Includes drawer positioning                                                                                  |
| splitter (Core)       | ✅       | ✅         | ✅        | ✅                                  | Container-scoped service pattern                                                                             |
| toast                 | ✅       | ✅         | ✅        | ✅                                  | Types now in `toast.types.ts` (naming deviation resolved)                                                    |
| drag-drop (Core)      | ✅       | ✅         | ✅        | ✅                                  |                                                                                                              |
| tooltip               | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Docs page now live at `/tooltip`                                                                             |
| tree                  | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | WAI-ARIA keyboard nav + roving tabindex (default template). Lazy per-level `loadChildren`. Manual extraRoute |
| listbox               | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Single/multi selection, active-descendant, typeahead and disabled options                                    |
| menu                  | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Dropdown menu with submenus, checkboxes, radio groups, typeahead and RTL inline keys                         |
| popover               | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Non-modal interactive floating surface with controlled state and optional autofocus                          |
| combobox              | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Editable input + listbox suggestions with active-descendant focus, filtering and Overlay positioning         |
| select                | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Single selection popup listbox with roving focus, object values, typeahead, dismissal and Overlay placement  |
| tabs                  | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Roving-focus tabs with automatic/manual activation, orientation and RTL horizontal navigation                |
| accordion             | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Single, collapsible and multiple disclosure sections with trigger/panel ARIA                                 |
| switch                | ✅       | ✅         | ✅        | ✅                                  | Button-first ARIA switch with controlled checked state                                                       |
| virtual-scroll        | ✅       | ✅         | ✅        | ✅                                  | Has ResizeObserver support                                                                                   |
| viewport              | ✅       | ✅         | ✅        | ✅                                  |                                                                                                              |
| directionality (Core) | ✅       | ✅ (+SSR)  | ✅        | ✅                                  | No `MutationObserver`; `refresh()`/`set()` for dynamic dir. See `docs/ai/specs/directionality.md`            |
| scroll-lock (Core)    | ✅       | ✅         | ✅        | ✅                                  | Per-Document scroll coordination; Dialog consumes it                                                         |

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

- **Next composition primitive**: TBD after the 0.2.0 release lands and npm publishes.

## Known issues / gotchas (live)

- **AnalogJS route cache**: new `(docs)/*.page.ts` files still need a manual entry in
  `extraRoutes` (`src/app/app.config.ts`). Currently listed there: tree, virtual-scroll,
  viewport, tooltip, listbox, directionality, combobox, scroll-lock, select, tabs,
  accordion and switch. Do not remove entries without
  re-verifying the route in a fresh `.angular`/Vite cache.
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
