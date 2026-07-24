# REVIEW PLAN — Quartz Headless Audit & Remediation

> Generated from code review session on 2026-07-06.
> Pass this file + `REVIEW_CONTEXT.md` to a new agent to continue without re-auditing.

> **Progress (2026-07-24):** DONE — P0.1, P0.2, P0.3, P1.1, P1.2, P1.3, P1.4, P2.1, P2.2,
> P2.5, P2.6, P3.1, P3.2. NOT YET DONE — P1.5 (TreeService coverage target), P3.3 (route-cache
> investigation), P3.4 (ReplaySubject vs Subject). P2.4 addressed via a CLI safety net that
> auto-resolves cross-component imports (an end-to-end compile test is still a nice-to-have).
> Verify with `pnpm test && pnpm lint && pnpm typecheck && pnpm build:lib` (82 tests passing).

## How to use this plan

Each item has:

- **Priority**: P0 (fix now), P1 (next), P2 (polish), P3 (nice-to-have)
- **Scope**: which package/app is affected
- **Problem**: what is wrong
- **Files**: exact paths to change
- **Action**: concrete steps
- **Acceptance**: how to verify

Run verification commands after batches:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build:lib
pnpm exec vitest run --coverage
```

---

## P0 — Critical fixes (do first)

### P0.1 Fix subscription leak in `OverlayTriggerDirective`

- **Scope**: `packages/quartz`
- **Problem**: Every `open()` call subscribes to `closed$` again without unsubscribing. Leaks memory and can emit duplicate `closed` events.
- **Files**: `packages/quartz/src/lib/overlay/overlay-trigger.directive.ts`
- **Action**:
  1. Add a private subscription field: `private closedSub: Subscription | null = null`.
  2. In `open()`, unsubscribe from any previous subscription before creating a new one.
  3. In `close()` or `ngOnDestroy()`, unsubscribe.
  4. Consider reusing the same `OverlayRef` when config changes instead of destroying/recreating on every open.
- **Acceptance**:
  - Add a test that opens/closes the overlay 3 times and asserts `closed` emits exactly 3 times.
  - No memory leak in DevTools heap snapshot after 50 open/close cycles.

### P0.2 Remove or fully implement `listbox`

- **Scope**: `packages/quartz`, `src/app/pages/(docs)`
- **Problem**: `listbox` is advertised in docs, CLI registry, and sidebar but has zero implementation. Damages trust.
- **Files**:
  - `packages/quartz/src/lib/listbox/` (empty)
  - `src/app/pages/(docs)/listbox.page.ts`
  - `cli/registry.js`
  - `src/app/components/sidebar/sidebar.component.ts` (or wherever listbox link lives)
- **Action** (choose one):
  - **Option A — Remove**: delete placeholder page, remove from registry, remove from sidebar.
  - **Option B — Implement**: write `listbox.service.ts`, `listbox.types.ts`, `listbox.directive.ts`, `index.ts`, tests, demo page, and update registry.
- **Acceptance**:
  - `pnpm quartz list` no longer shows a non-existent component.
  - No 404 link to `/listbox` from sidebar.

### P0.3 Fix focus trap and a11y in `DialogService`

- **Scope**: `packages/quartz`
- **Problem**: Focus trap selector misses `contenteditable`, `audio[controls]`, `video[controls]`, `summary`, `details`, and shadow DOM focusables. No `aria-labelledby`/`aria-describedby` auto-generation.
- **Files**: `packages/quartz/src/lib/dialog/dialog.service.ts`
- **Action**:
  1. Expand `#focusFirstFocusable` and `#trapFocus` selectors to match all focusable elements.
  2. Add optional `ariaLabelledBy` / `ariaDescribedBy` to `DialogConfig` and apply them.
  3. Generate fallback IDs if not provided.
- **Acceptance**:
  - Dialog with a `contenteditable` traps focus correctly.
  - axe-core reports no critical a11y violations on a dialog demo.

---

## P1 — High priority improvements

### P1.1 Add comprehensive a11y to `TreeComponent`

- **Scope**: `packages/quartz`
- **Problem**: Toggle is a `<span>` (not a button), no arrow-key navigation, missing `aria-level`/`aria-setsize`/`aria-posinset`. Does not meet WAI-ARIA Tree pattern.
- **Files**:
  - `packages/quartz/src/lib/tree/tree-node.component.ts`
  - `packages/quartz/src/lib/tree/tree.component.ts`
  - `packages/quartz/src/lib/tree/tree.service.ts`
- **Action**:
  1. Make toggle a real `<button type="button">` or add `role="button"`, `tabindex="0"`, and Enter/Space handlers.
  2. Implement roving tabindex and arrow-key navigation (Up/Down/Left/Right/Home/End).
  3. Add `aria-level`, `aria-setsize`, `aria-posinset`, `aria-expanded`, `aria-selected`.
  4. Add type-ahead search.
- **Acceptance**:
  - Screen reader (VoiceOver/NVDA) announces tree structure correctly.
  - All keyboard interactions from WAI-ARIA Tree pattern work.
  - New tests cover keyboard navigation and ARIA attributes.

### P1.2 Remove double `init()` in `TreeComponent`

- **Scope**: `packages/quartz`
- **Problem**: `ngOnInit()` + `effect()` both call `treeService.init()`.
- **Files**: `packages/quartz/src/lib/tree/tree.component.ts`
- **Action**:
  1. Remove `ngOnInit()` or make the `effect` the single source of truth.
  2. Ensure initial render still works.
- **Acceptance**:
  - `treeService.init()` is called exactly once on mount with initial inputs.
  - Existing tests pass.

### P1.3 Remove `markForCheck()` from `TooltipDirective`

- **Scope**: `packages/quartz`
- **Problem**: Zoneless apps ignore `markForCheck()`. If host bindings already use signals, it is dead code; if they don't, it's masking a reactive bug.
- **Files**: `packages/quartz/src/lib/tooltip/tooltip.directive.ts`
- **Action**:
  1. Remove `ChangeDetectorRef` injection and `markForCheck()` calls.
  2. Verify `[attr.aria-describedby]="tooltipId()"` updates correctly without it.
  3. If it breaks, fix the reactivity instead of restoring `markForCheck()`.
- **Acceptance**:
  - Tooltip shows/hides and `aria-describedby` updates in zoneless test.

### P1.4 Add missing directive tests

- **Scope**: `packages/quartz`
- **Problem**: Critical directives have almost no test coverage.
- **Files**:
  - `packages/quartz/src/lib/overlay/overlay-trigger.directive.spec.ts` (new)
  - `packages/quartz/src/lib/splitter/splitter-container.directive.spec.ts` (new)
  - `packages/quartz/src/lib/splitter/splitter-handle.directive.spec.ts` (new)
  - `packages/quartz/src/lib/splitter/splitter-panel.directive.spec.ts` (new)
  - `packages/quartz/src/lib/drag-drop/drop-zone.directive.spec.ts` (new)
- **Action**:
  1. Create spec files using `@testing-library/angular` + `TestBed` (follow existing patterns).
  2. Cover happy paths and edge cases.
- **Acceptance**:
  - Each new spec runs with `pnpm exec vitest run <path>`.
  - Overall branch coverage rises above 60%.

### P1.5 Improve `TreeService` test coverage

- **Scope**: `packages/quartz`
- **Problem**: `tree.service.ts` is at 44.3% coverage. Missing tests for `expandAll`, `collapseAll`, `toggleSelection`, `multiSelect`, `clearSelection`.
- **Files**: `packages/quartz/src/lib/tree/tree.service.spec.ts` (new or extend)
- **Action**:
  1. Add tests for all public methods.
  2. Test edge cases: empty nodes, circular refs, multi-select mode.
- **Acceptance**:
  - `tree.service.ts` coverage ≥ 90%.

---

## P2 — Medium priority polish

### P2.1 Implement or remove `VirtualScrollConfig.itemSizeFn`

- **Scope**: `packages/quartz`
- **Problem**: Type declares `itemSizeFn` but implementation ignores it.
- **Files**: `packages/quartz/src/lib/virtual-scroll/virtual-scroll.types.ts`, `virtual-scroll.directive.ts`
- **Action**:
  - **Option A**: Implement variable-size virtual scrolling using `itemSizeFn`.
  - **Option B**: Remove `itemSizeFn` from types until ready.
- **Acceptance**:
  - No unused public API surface.

### P2.2 Rename `toast.model.ts` to `toast.types.ts`

- **Scope**: `packages/quartz`
- **Problem**: Naming inconsistency with every other primitive.
- **Files**:
  - `packages/quartz/src/lib/toast/toast.model.ts` → `toast.types.ts`
  - Update imports in `toast.service.ts`, `toast.component.ts`, `toast-container.component.ts`, `index.ts`.
- **Acceptance**:
  - Build, tests, lint, typecheck pass.

### P2.4 Fix CLI relative imports

- **Scope**: `cli`
- **Problem**: `quartz add` copies files but leaves relative imports like `../overlay` intact, which breaks depending on output path.
- **Files**: `cli/commands/add.js`
- **Action** (choose one):
  - **Option A**: Rewrite relative imports inside copied files to point to sibling copied folders.
  - **Option B**: Copy all deps into a single flat folder and rewrite imports accordingly.
  - **Option C**: Document the limitation clearly and stop claiming the CLI is production-ready.
- **Acceptance**:
  - Running `pnpm quartz add dialog -o /tmp/test-project/src/lib/components` produces compilable code.

### P2.5 Add ARIA attributes to splitter handle

- **Scope**: `packages/quartz`
- **Problem**: Splitter handle lacks `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation`.
- **Files**: `packages/quartz/src/lib/splitter/splitter-handle.directive.ts`
- **Action**:
  1. Add host bindings for ARIA attributes.
  2. Add keyboard support (Arrow keys, Home/End) if not present.
- **Acceptance**:
  - Screen reader announces splitter as a slider.
  - axe-core no violations.

### P2.6 Add keyboard activation to `OverlayTriggerDirective`

- **Scope**: `packages/quartz`
- **Problem**: Only click works; no Enter/Space handling.
- **Files**: `packages/quartz/src/lib/overlay/overlay-trigger.directive.ts`
- **Action**:
  1. Add `keydown` host listener for Enter/Space.
  2. Prevent default scrolling for Space.
- **Acceptance**:
  - Overlay opens/closes via keyboard when host is focusable.

---

## P3 — Low priority cleanup

### P3.1 Remove unused code

- **Scope**: `packages/quartz`
- **Problem**: Dead exports/interfaces.
- **Files**:
  - `packages/quartz/src/lib/overlay/overlay.types.ts` — `OverlayFlipAxis` if unused.
  - `packages/quartz/src/lib/tooltip/tooltip.service.ts` — `TooltipInstance` if unused.
  - `packages/quartz/src/lib/drag-drop/drag-drop.types.ts` — `DragDropOrientation` if unused.
  - `packages/quartz/src/lib/drag-drop/drag-drop.types.ts` — `animationDuration` if unused.
- **Action**:
  1. Delete or deprecate unused public API.
  2. If exported in `public-api.ts`, remove from there too.
- **Acceptance**:
  - Lint reports no unused exports.

### P3.2 Fix `dialog.snippets.ts` demo example

- **Scope**: `src/app`
- **Problem**: Example uses `constructor(private dialog: DialogService)` contradicting project rules.
- **Files**: `src/app/pages/(docs)/dialog/dialog.snippets.ts`
- **Action**:
  1. Rewrite example to use `inject(DialogService)`.
- **Acceptance**:
  - Example compiles and matches project style.

### P3.3 Investigate AnalogJS route cache workaround

- **Scope**: `src/app`
- **Problem**: `app.config.ts` has manual `extraRoutes` for tree/virtual-scroll/viewport due to "Vite cache issue".
- **Files**: `src/app/app.config.ts`
- **Action**:
  1. Try removing entries one by one after clearing `.angular` and Vite cache.
  2. Update `STATE.md` with findings.
- **Acceptance**:
  - Either remove workaround or document why each entry is needed.

### P3.4 Standardize `ReplaySubject` vs `Subject` for refs

- **Scope**: `packages/quartz`
- **Problem**: `DialogRef` uses `ReplaySubject`, `OverlayRef` uses plain `Subject`. Decide a consistent pattern.
- **Files**:
  - `packages/quartz/src/lib/dialog/dialog-ref.ts`
  - `packages/quartz/src/lib/overlay/overlay-ref.ts`
- **Action**:
  1. Decide if late subscribers should receive the closed event.
  2. Apply same pattern to both.
- **Acceptance**:
  - Behavior documented in code comments and tests.

---

## Testing roadmap

| Milestone                         | Target                           | Verification                           |
| --------------------------------- | -------------------------------- | -------------------------------------- |
| 1. P0 fixes + new directive specs | 75% statements, 55% branches     | `pnpm test --coverage`                 |
| 2. Tree a11y + tests              | 80% statements, 65% branches     | Screen reader test + coverage          |
| 3. Dialog a11y + splitter a11y    | 82% statements, 70% branches     | axe-core scan                          |
| 4. CLI usable                     | N/A                              | Manual end-to-end test in temp project |
| 5. Pre-1.0                        | ≥ 85% statements, ≥ 75% branches | Full test suite + E2E                  |

---

## Definition of Done (global)

Before considering this plan complete:

- [ ] All P0 items merged.
- [ ] `pnpm test` passes.
- [ ] `pnpm lint` passes.
- [ ] `pnpm typecheck` passes.
- [ ] `pnpm build:lib` passes.
- [ ] Coverage: statements ≥ 80%, branches ≥ 70%.
- [ ] `docs/ai/STATE.md` updated with new status and commit ref.
- [ ] `CHANGELOG.md` updated for any breaking or user-visible changes.
