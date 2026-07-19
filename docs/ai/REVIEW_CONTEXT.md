# REVIEW CONTEXT — Quartz Headless Codebase Audit

> Captured during review session on 2026-07-06 (HEAD: `a3cb84f feat: add sdd`).
> Use this file together with `REVIEW_PLAN.md` to continue work without re-auditing.

## TL;DR

Quartz is a modern Angular 21 headless UI primitives monorepo. Tests, lint, typecheck, and library build all pass, but the codebase has real technical debt: subscription leaks, missing/incomplete accessibility, low branch test coverage, a placeholder `listbox`, and a CLI that copies files without fixing imports.

---

## Project structure

```
/Users/andriipap/Andersseen/Web/Projects/quartz
├── packages/quartz/          # Angular library (published as quartz-headless)
│   └── src/lib/
│       ├── overlay/          # Foundation: portal + positioning
│       ├── dialog/           # Built on overlay
│       ├── splitter/         # Scoped service + 3 directives
│       ├── toast/            # Signals + polling timer
│       ├── drag-drop/        # HTML5 drag API + directives
│       ├── tooltip/          # Uses overlay for templates, DOM for strings
│       ├── tree/             # Recursive components, scoped service
│       ├── virtual-scroll/   # Fixed-size windowing
│       ├── viewport/         # Breakpoint service + directive
│       └── listbox/          # EMPTY — placeholder only
├── src/app/                  # AnalogJS demo/docs app
│   └── pages/(docs)/         # One page per primitive
├── cli/                      # Copy-source CLI
│   ├── bin/quartz.js
│   ├── commands/add.js
│   └── registry.js
├── docs/ai/                  # Agent context docs
│   ├── CONTEXT.md            # Project purpose & non-goals
│   ├── STATE.md              # Live status matrix
│   ├── REVIEW_CONTEXT.md     # This file
│   └── REVIEW_PLAN.md        # Action items
└── dist/quartz/              # ng-packagr output
```

---

## Current health check

| Check                 | Command              | Result                    |
| --------------------- | -------------------- | ------------------------- |
| Unit tests            | `pnpm test`          | ✅ 88/88 passed           |
| Lint                  | `pnpm lint`          | ✅ no errors              |
| Type check            | `pnpm typecheck`     | ✅ no errors              |
| Library build         | `pnpm build:lib`     | ✅ produces `dist/quartz` |
| Coverage (statements) | `pnpm test:coverage` | ⚠️ 68.03%                 |
| Coverage (branches)   | `pnpm test:coverage` | ❌ 50.14%                 |
| Coverage (functions)  | `pnpm test:coverage` | ⚠️ 71.17%                 |
| Coverage (lines)      | `pnpm test:coverage` | ⚠️ 68.98%                 |

---

## Architecture patterns used

- **Zoneless Angular**: `provideZonelessChangeDetection()` in app config.
- **Signals-first**: most services/directives use `signal()` / `computed()`.
- **Standalone-only**: enforced by ESLint (`@angular-eslint/prefer-standalone: error`).
- **OnPush everywhere**: enforced by ESLint.
- **`inject()` function**: used instead of constructor injection.
- **Scoped services**: `SplitterService` and `TreeService` are provided at directive/component level.
- **Root singleton services**: `OverlayService`, `DialogService`, `ToastService`, `DragDropService`, `TooltipService`, `ViewportService`.
- **SSR guards**: checks for `document.defaultView` before DOM manipulation.
- **Portal pattern**: overlay/dialog create fixed-position containers appended to `document.body`.
- **Template context**: `DialogRef` passed as `$implicit` so templates can call `close()`.

---

## Known critical issues

### 1. Subscription leak in `OverlayTriggerDirective`

- **File**: `packages/quartz/src/lib/overlay/overlay-trigger.directive.ts:88`
- **Issue**: `this.overlayRef.closed$.subscribe(...)` is called on every `open()` without unsubscribing previous subscriptions.
- **Impact**: Memory leak + duplicate `closed` emissions.

### 2. `listbox` is a ghost primitive

- **Files**:
  - `packages/quartz/src/lib/listbox/` — empty folder
  - `src/app/pages/(docs)/listbox.page.ts` — "Coming Soon" placeholder
  - `cli/registry.js` — `soon: true`
  - Sidebar links to `/listbox`
- **Impact**: Promises functionality that does not exist.

### 3. Dialog focus trap is incomplete

- **File**: `packages/quartz/src/lib/dialog/dialog.service.ts:183,189`
- **Issue**: Selector `'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'` misses `contenteditable`, `audio[controls]`, `video[controls]`, `summary`, and shadow-DOM focusables.
- **Impact**: Focus can escape modal dialogs.

---

## Known high-priority issues

### 5. Tree a11y is inadequate

- **File**: `packages/quartz/src/lib/tree/tree-node.component.ts`
- **Issues**:
  - Toggle is a `<span>`, not a button.
  - No keyboard navigation (arrow keys, Home/End, type-ahead).
  - Missing `aria-level`, `aria-setsize`, `aria-posinset`.
- **Impact**: Not usable with screen reader or keyboard.

### 6. Double initialization in `TreeComponent`

- **File**: `packages/quartz/src/lib/tree/tree.component.ts:59-71`
- **Issue**: Both `effect()` in constructor and `ngOnInit()` call `treeService.init()`.
- **Impact**: Wasted work; potential subtle state bugs.

### 7. `markForCheck()` in zoneless app

- **File**: `packages/quartz/src/lib/tooltip/tooltip.directive.ts:153,195`
- **Issue**: `this.cdr.markForCheck()` is called in a zoneless app.
- **Impact**: Dead code that masks potential reactivity issues.

### 8. Missing directive tests

- **Files without specs**:
  - `packages/quartz/src/lib/overlay/overlay-trigger.directive.ts` (5.71% coverage)
  - `packages/quartz/src/lib/splitter/splitter-*.directive.ts` (only service tested)
  - `packages/quartz/src/lib/drag-drop/drop-zone.directive.ts` (no Angular spec)
- **Impact**: Lowest coverage areas are the most user-facing code.

---

## Known medium-priority issues

### 9. CLI copies files but breaks imports

- **File**: `cli/commands/add.js`
- **Issue**: Copied files keep relative imports like `../overlay/overlay.service`, which break depending on the consumer's output directory.
- **Impact**: CLI output often does not compile.

### 10. `VirtualScrollConfig.itemSizeFn` is not implemented

- **Files**: `packages/quartz/src/lib/virtual-scroll/virtual-scroll.types.ts`, `virtual-scroll.directive.ts`
- **Issue**: Public API type promises variable-size scrolling that does not exist.

### 11. Naming inconsistency

- **File**: `packages/quartz/src/lib/toast/toast.model.ts`
- **Issue**: Should be `toast.types.ts` to match every other primitive.

### 13. Splitter handle lacks ARIA

- **File**: `packages/quartz/src/lib/splitter/splitter-handle.directive.ts`
- **Issue**: No `aria-label`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-orientation`.

### 14. `OverlayTriggerDirective` only handles click

- **File**: `packages/quartz/src/lib/overlay/overlay-trigger.directive.ts`
- **Issue**: No Enter/Space keyboard support.

---

## Coverage hotspots

| File/Area                      | Coverage             | Why it matters                        |
| ------------------------------ | -------------------- | ------------------------------------- |
| `overlay-trigger.directive.ts` | 5.71%                | Main public API for overlay; untested |
| `splitter` directives          | 0% (no specs)        | Core user-facing interaction          |
| `drop-zone.directive.ts`       | 0% (no Angular spec) | Critical drag-drop primitive          |
| `tree.service.ts`              | 44.3%                | Complex selection/expansion logic     |
| `viewport.service.ts`          | 63.15%               | Media-query logic mostly untested     |

---

## Dead code / unused API

- `TooltipInstance` interface in `tooltip.service.ts` — never used.
- `OverlayFlipAxis` / `flipAxis` in overlay — declared but calculation ignores it.
- `DragDropOrientation` in `drag-drop.types.ts` — exported but unused.
- `animationDuration` in `DragDropConfig` — declared but unused.
- `VirtualScrollConfig.itemSizeFn` — declared but unused.

---

## Commands that work

```bash
# Dev server (AnalogJS/Vite on localhost:5173)
pnpm start

# Build Angular library
pnpm build:lib

# Build demo app
pnpm build:demo

# Tests
pnpm test
pnpm test:watch
pnpm test:coverage

# Single test file
pnpm exec vitest run packages/quartz/src/lib/overlay/overlay.service.spec.ts

# E2E
pnpm e2e

# Lint & format
pnpm lint
pnpm format

# Type check
pnpm typecheck

# CLI
pnpm quartz add <component>
pnpm quartz list
```

---

## Key files for a new agent

| Purpose                | Path                                     |
| ---------------------- | ---------------------------------------- |
| Public API             | `packages/quartz/src/public-api.ts`      |
| Library package        | `packages/quartz/package.json`           |
| Root package & scripts | `package.json`                           |
| TypeScript paths       | `tsconfig.json`                          |
| ESLint config          | `eslint.config.js`                       |
| Vitest workspaces      | `vitest.config.ts`                       |
| CLI registry           | `cli/registry.js`                        |
| CLI add command        | `cli/commands/add.js`                    |
| App routing workaround | `src/app/app.config.ts`                  |
| Agent context          | `docs/ai/CONTEXT.md`, `docs/ai/STATE.md` |

---

## Good practices to preserve

- Keep primitives unstyled; no CSS/Tailwind in `packages/quartz/`.
- Use `signal()`/`computed()` for state.
- Use `inject()` over constructor injection.
- Keep components/directives standalone.
- Use `ChangeDetectionStrategy.OnPush`.
- Guard DOM access with `document.defaultView` for SSR safety.
- Co-locate tests with source files (`*.spec.ts`).
- Use `providedIn: 'root'` for global services, scoped providers for local state.

---

## Bad practices to avoid / fix

- Subscribing to observables without cleanup in directives.
- Adding global/element listeners without removing them.
- Calling `markForCheck()` in zoneless apps.
- Exposing public API types that are not implemented.
- Advertising primitives that do not exist.
- Shipping a CLI that produces broken imports.
- Incomplete focus traps and ARIA roles.

---

## Ecosystem notes

- `@voltui/components` is the author's styled layer, used only in the demo app.
- `lumen-icons` is the author's icon set, used only in the demo app.
- `update-editor` script in root `package.json` points to a local Vertex path — ignore it; it is the author's local tooling.

---

## Decision log (inherited)

- Library published as `quartz-headless` v0.0.3.
- Root monorepo package stays private.
- Tailwind 4 is used only in the demo app.
- Pre-commit hook runs `lint-staged` + `typecheck` + `pnpm test`.

---

## Next recommended actions

See `REVIEW_PLAN.md` for the prioritized task list. Start with P0 items, then move to P1. Update `docs/ai/STATE.md` after each meaningful change.
