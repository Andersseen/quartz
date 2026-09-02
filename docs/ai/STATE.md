# STATE — Current Project Status

> **Last updated: 2026-09-02** (Stability Audit — Core + all 0.4.0 Primitives)
>
> ⚠️ **Agents: update this file at the end of any session that changes what's true here**
> (new primitive, status change, publish, new known issue). Update the date and commit ref.

## Stability Audit — Core + all Primitives (2026-09-02)

Full audit of `@quartz-headless/core@0.4.0` + `@quartz-headless/primitives@0.4.0` against the
architectural rules in `ARCHITECTURE.md`/`BEST_PRACTICES.md` — consolidation, not horizontal
growth. No new primitives, no new Core foundations. Full findings matrix (P0–P3, evidence,
resolutions) in `docs/ai/STABILITY_AUDIT.md`. All confirmed P0/P1 findings were fixed and
verified (`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:coverage
&& pnpm build:lib && pnpm verify:build && pnpm verify:consumer && pnpm build:demo && pnpm e2e`
all green). Some fixes are **deliberate, pre-1.0 breaking changes** — see the tally below.

- **Focus**: `getFocusableElements()` now excludes elements with an explicit `tabindex="-1"`
  on every selector branch (previously only the generic `[tabindex]` branch did); the trap's
  forward-Tab branch now reclaims focus when it's already outside the container (previously
  only Shift+Tab did); `isFocusable()` now treats an `aria-hidden="true"` ancestor the same
  as `hidden`/`inert`; the zero-focusable fallback now makes the container script-focusable
  itself before falling back to it, instead of requiring every consumer to replicate
  Dialog's manual `tabindex="-1"` workaround.
- **Dismiss**: the open-layer stack is now keyed per `Document`
  (`WeakMap<Document, ...>`, mirroring `scroll-lock`) instead of module-global, so Escape
  /outside-pointer routing in one Document can't be starved by a layer registered in an
  unrelated one (iframe, second Angular app root). Outside-pointer dismissal now registers a
  single `pointerdown` listener instead of `pointerdown`+`mousedown`+`click` together, which
  could fire the dismiss callback more than once per physical interaction.
- **Collection**: `activeId()` is now derived from `activeItem()` (a computed), not a
  separately-tracked signal — previously, if the active item's `disabled` flipped `true` in
  place (no explicit navigation call), `activeId()` kept returning the stale id while
  `activeItem()` correctly went `null`, and `activeTabIndex()` kept pinning `tabindex=0` on
  the now-disabled item. This affected every Collection-based primitive (Tabs, Accordion,
  Stepper, ToggleGroup, RadioGroup, Select, Menu, Listbox, Combobox).
- **Overlay**: `OverlayRef.open()` now re-appends the shared portal container to `document
.body` on every open, guaranteeing correct DOM stacking order against Dialog's own backdrop
  /wrapper (same z-index) regardless of which opened first — previously a Menu/Select/Popover
  opened _inside_ an already-open Dialog could render behind it. `getScrollParents` is now
  exported from Core (used internally and by Tooltip, see below).
- **Viewport**: documented the `0×0` SSR default and the mitigation (seed a known default via
  the already-public `setSize()` before first render) directly on `ViewportService`; added
  `viewport.service.ssr.spec.ts`. No new API.
- **DragDrop** (Core): removed the `cursor`/drag-image `opacity`/`rotate` visual opinions and
  the deprecated `aria-grabbed` attribute (native HTML5 DnD isn't keyboard-operable — this
  wrapper's scope is now documented as such, not falsely implied via ARIA); added an optional
  `orientation` input to `DropZoneConfig` (the `width>height` heuristic remains the default
  when unset); added `data-qz-dragging`/`data-qz-disabled`/`data-qz-drag-over`/`data-qz-can-drop`
  alongside the existing legacy classes (kept, not removed).
- **Splitter**: migrated from separate mouse/touch listeners to unified Pointer Events
  (mirroring Slider's existing pattern), fixing a real multi-instance/multi-touch coordinate
  bug and a destroy-mid-drag leak where the container-scoped service's `isDragging` could get
  stuck `true` forever. Keyboard behavior (including the deliberately physical, unmirrored
  Left/Right model) is unchanged.
- **Toast**: `aria-live` politeness no longer depends on container position — each toast now
  sets its own `role` (`alert` for `type: 'error'`, `status` otherwise), and the container's
  `aria-live` is a fixed `"off"`. The countdown interval now starts/stops based on whether any
  toast actually has active countdown work (`duration > 0 && !isPaused`), not array emptiness
  — a persistent (`duration: 0`) toast no longer keeps a 100ms interval running forever, and
  ticks that change nothing no longer force a signal write. Added `data-qz-type` alongside
  the existing `qz-toast--{type}` class.
- **Tooltip**: removed `tooltipInteractive`/`TooltipConfig.interactive` — it kept
  `role="tooltip"` while making content genuinely focusable/hoverable, a real WAI-ARIA
  violation; migrate to Popover for interactive content (demo page updated with the
  migration). De-duplicated scroll-dismiss: Tooltip's own single dismiss controller now
  handles scroll (`closeOnScroll: false` passed to Overlay instead of doubling up).
- **Tree** (the biggest change this round): `TreeNodeComponent`'s host — not a
  template-internal wrapper — now owns `role="treeitem"`, roving `tabindex`, every `aria-*`
  attribute, and click/keydown/focus handling, for _both_ the default markup and a custom
  `nodeTemplate`. Previously, supplying a custom template silently dropped all of the above,
  including real DOM focus (the roving-focus effect targeted a `viewChild` that only existed
  in the default-template branch). **Breaking**: existing custom templates must remove
  `role`/`tabindex`/`aria-*`/row-level click/keydown handlers from their own template root
  (Quartz's host now owns them) — demo (`tree.page.html`, `tree.snippets.ts`) updated to the
  new contract. `role="tree"` moved from an inner `<div>` to the component host, so
  `aria-label`/`aria-labelledby` passthrough on `<qz-tree>` now actually works (was silently
  inert before). Stripped the full visual stylesheet (colors, hover/selected backgrounds,
  border-radius, transitions, font-size) from `TreeNodeComponent`, keeping only structural
  layout + indentation. Also found and fixed, during e2e verification of the above (not in
  the original audit pass): the roving-focus side effect used a plain `effect()`, which can
  run before a render cycle's DOM update is committed, letting a real browser silently drop
  the `.focus()` call — reproduced directly in Chromium (Home/End focus landing late or not
  at all in ~2 of 5 runs). Fixed by switching to `afterRenderEffect()` (the pattern already
  used elsewhere, e.g. `navbar.directive.ts`), verified stable across repeated real-browser
  e2e runs.
- **Navbar**: `stuck` is now `computed(() => sticky() && scrolled())` instead of a
  separately-thresholded signal — previously `stuck` could be `true` while `scrolled` was
  `false` (different, inconsistent thresholds), a real contradictory-attribute-pair bug. Real
  CSS-pinned-state detection (IntersectionObserver sentinel) would need new DOM authoring
  this directive doesn't do and has no prior art for — documented as deferred, not built.
- **Dialog**: added `viewRef.onDestroy(() => ref.close())` — if the host `ViewContainerRef`
  is destroyed while the dialog is open (e.g. a route navigation away from its host),
  Angular previously tore down the view directly, bypassing `DialogRef#close()` and leaking
  the backdrop/wrapper, the scroll lock, and the document keydown listener permanently.
- **Popover / Combobox**: `ngOnDestroy` now routes through the existing guarded
  `close()`/`closePopup()` instead of calling the internal `finishClose()` directly — a
  trigger/combobox destroyed while never opened (or already closed) no longer emits a
  spurious `closed` event for a transition that never happened. Confirmed as the identical
  bug independently in both primitives.
- **Controls — breaking cleanup**: `[qzCheckbox]`, `[qzSwitch]`, `[qzToggle]`,
  `[qzToggleItem]` selectors tightened to `button[qzX]` (they already relied on native
  button tabindex/disabled/Enter-Space-activation and had zero real non-button usage in this
  repo — Toggle didn't even bind its own keydown handler, so a non-button host had no
  keyboard support at all). `RadioGroup`/`RadioDirective` deliberately kept generic
  (`[qzRadio]`, no tag restriction) — it already drives selection itself (Space handling,
  `role="radio"`, click delegation) rather than relying on native button semantics; this is
  now covered by a regression test rendering `<span qzRadio>`. Switch's `toggled` output
  renamed to `checkedChangeCommitted`, matching the `<model>ChangeCommitted` convention
  already used by Checkbox/Toggle. All three commit outputs confirmed to carry genuinely
  distinct information from their models (they don't fire on a programmatic model write,
  only on real user interaction) — kept, not removed.
- **ID generation / SSR**: audited, found **no confirmed defect** — no `Math.random()`/
  `Date.now()` anywhere, every id+its paired `aria-*` reference is generated together off
  the same counter read (can't diverge within one render), and this demo app runs SPA-only
  (`ssr: false`) so there's no live SSR exposure today regardless. 26 files hand-roll an
  identical id-counter pattern — real duplication, but deferred (P2, DX-only; no suitable
  official Angular primitive exists to replace it with, and it doesn't warrant a Core
  `IdManagerService`).
- **Real package consumer smoke test**: `scripts/verify-build.js` only ever inspected the
  built `dist/` folders directly — it could never catch a broken `exports` map, an
  unsatisfiable peerDependency range, or a file ng-packagr silently failed to ship. Added
  `pnpm verify:consumer` (`scripts/consumer-smoke.js` + `scripts/consumer-smoke/fixture/`):
  packs both built packages into real npm tarballs, installs them into a throwaway fixture
  outside the pnpm workspace, and `tsc --noEmit`s a file that imports only the bare
  `@quartz-headless/core`/`@quartz-headless/primitives` specifiers (`CollectionStore`,
  `DialogService`, `CheckboxDirective`, `SliderDirective`, `ToastContainerComponent`). Wired
  into CI right after `verify:build`; not part of pre-commit (real network install).
- **Deferred** (documented in `STABILITY_AUDIT.md`, not built this round — see that file for
  the full P2/P3 list): Collection's unregister/move recovery target (first-enabled, not
  nearest-neighbor); Sidebar's `desktopOpen` seeding edge case when starting mobile with
  `[open]="false"`; Overlay reposition-on-resize; `OverlayTriggerDirective` never firing
  `closed` on destroy; Navbar/Sidebar not resetting their `open` model on destroy-while-open;
  the 26-file id-counter DX dedup; Toast's `gap`/`padding` as hardcoded pixels; a real
  keyboard-operable drag-and-drop model (separate design project, explicitly out of scope).

**Versioning recommendation**: this round mixes compatible bug fixes with **deliberate
pre-1.0 breaking changes** — Tree's custom-template contract, Tooltip's `tooltipInteractive`
removal, Controls' `button[...]` selector tightening, and Switch's `toggled` rename. None of
these affect this repo's own demo/tests (verified per-area in `STABILITY_AUDIT.md`), but they
are real breaks for any external 0.4.0 consumer. Recommend **`0.5.0`, not `0.4.1`** when this
ships — version was deliberately **not** bumped as part of this audit itself, per the audit's
own scope (documented recommendation only).

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
- `@quartz-headless/core` and `@quartz-headless/primitives` are at **v0.4.0** in their
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

## Quartz 0.3.0 Controls & Interaction (2026-09-01)

This release adds Checkbox, RadioGroup, Toggle, ToggleGroup and Slider as primitives, while
leaving Core without a new control/form/range foundation. The controls consume the existing
Core pieces where useful: RadioGroup and ToggleGroup use `CollectionStore` plus
Directionality for roving focus, disabled skipping, DOM-order navigation and RTL horizontal
keys; Slider uses Directionality for consistent horizontal RTL pointer and keyboard mapping.

Dialog received a headless cleanup: its backdrop no longer gets a default visual
`background`, retaining only structural styles required for positioning and backdrop
interaction. `docs/architecture/foundations.md` now records the structural CSS policy:
behavioral layout/geometry is allowed, visual color/shadow/border/typography/animation is
consumer-owned. Slider's `--qz-slider-percent` is explicitly a geometry hook, not a visual
token.

Forms decision for 0.3.0: no CVA or Signal Forms adapter yet. The control APIs stay based on
`model()`/`input()` so consumers can integrate them from the outside; a reusable forms
adapter can be revisited if future controls reveal meaningful duplication.

Checkbox decision for 0.3.0: `qzCheckbox` is button-first only. Native
`<input type="checkbox">` support was not added because browser input state, `indeterminate`
DOM properties and the button ARIA pattern would create two subtly different surfaces. Revisit
only if real consumers need native form submission semantics.

## Quartz 0.4.0 Navigation & Layout (2026-09-01)

This release adds Sidebar, Navbar and Stepper as primitives and leaves Core without a new
navigation/layout foundation. The audit found the existing foundations sufficient:
Viewport covers breakpoint state, Dismiss covers layered Escape/outside pointer dismissal,
ScrollLock covers document body locking, Focus covers optional initial focus/trapping, Directionality
covers logical inline sides/RTL and Collection covers Stepper roving focus.

- **Sidebar** (`qzSidebar`, `qzSidebarPanel`, `qzSidebarContent`, `qzSidebarTrigger`) models app
  navigation sidebar behavior: `open` vs `collapsed`, `push` vs `overlay`, desktop/mobile mode
  selection via Viewport breakpoints, logical `inline-start`/`inline-end` sides, structural size
  hooks (`--qz-sidebar-size`, `--qz-sidebar-collapsed-size`) and overlay dismissal.
- **Navbar** (`qzNavbar`, `qzNavbarTrigger`, `qzNavbarMenu`) owns sticky/static behavior,
  thresholded `scrolled`/`stuck`, scroll direction, reveal state and a dismissible responsive menu.
  It intentionally exposes state only; blur, background, borders and animation stay in the consumer.
- **Stepper** (`qzStepper`, `qzStep`, `qzStepTrigger`, `qzStepPanel`, `qzStepperNext`,
  `qzStepperPrevious`) uses value-based controlled state, supports linear/non-linear navigation,
  consumer-supplied completion, disabled steps, horizontal/vertical orientation, RTL-aware keyboard
  navigation and active-step recovery when dynamic steps are removed.
- No shared public `NavItem` was extracted. Sidebar/Navbar docs need links, but the reusable
  behavior is currently only active/ARIA reflection and would be premature as a public primitive.
  Quartz remains router-agnostic and imports no Angular Router from the package implementation.

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
| sidebar               | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Push/overlay app sidebar with open/collapsed, responsive mode, logical sides and dismissal                   |
| navbar                | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Sticky/scrolled/stuck/reveal state and dismissible responsive menu                                           |
| stepper               | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Value-based sequential flow with linear completion contract, keyboard and dynamic step recovery              |
| switch                | ✅       | ✅         | ✅        | ✅                                  | Button-first ARIA switch with controlled checked state                                                       |
| checkbox              | ✅       | ✅         | ✅        | ✅                                  | Button-first ARIA checkbox with checked/unchecked/indeterminate state                                        |
| radio-group           | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Standalone radio group using Collection + Directionality                                                     |
| toggle                | ✅       | ✅         | ✅        | ✅                                  | Button-first pressed/unpressed toggle with aria-pressed                                                      |
| toggle-group          | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Single/multiple toggle group with roving focus                                                               |
| slider                | ✅       | ✅         | ✅        | ✅ peerDeps:[@quartz-headless/core] | Single-thumb ARIA slider with keyboard, pointer and RTL support                                              |
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

- **Next composition primitive**: TBD after 0.4.0 ships and real navigation/layout usage
  reveals the next missing pattern.

## Known issues / gotchas (live)

- **AnalogJS route cache**: new `(docs)/*.page.ts` files still need a manual entry in
  `extraRoutes` (`src/app/app.config.ts`). Currently listed there: tree, virtual-scroll,
  viewport, tooltip, listbox, directionality, combobox, scroll-lock, select, tabs,
  accordion, switch, checkbox, radio-group, toggle, toggle-group and slider. Do not remove entries without
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
