# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Combobox.** New editable, unstyled WAI-ARIA combobox primitive with input-owned focus,
  active-descendant suggestion navigation, Overlay positioning, filtering, disabled options,
  object values with `displayWith`/`compareWith`, controlled `value`/`inputValue`/`open`
  models and IME-safe input handling.

### Changed

- **Breaking (packaging):** Quartz now ships as two separate npm packages instead of one —
  `@quartz-headless/core` (v0.0.3, low-level infrastructure: overlay, dismiss, focus,
  collection, viewport, drag-drop, virtual-scroll, splitter) and
  `@quartz-headless/primitives` (v0.0.3, accessible UI patterns: dialog, tooltip, toast,
  tree, listbox; depends on `@quartz-headless/core` as a peer dependency). The previous
  unscoped `quartz-headless` package is **frozen** at v0.2.1 — no further releases. See
  `docs/ai/ARCHITECTURE.md` for the full rationale and dependency rules.
- `pnpm quartz add <primitive>` no longer copies Core source alongside a primitive; it now
  prints an `npm install @quartz-headless/core` instruction instead. `pnpm quartz add
<core-piece>` is unaffected (still copy-source, zero dependencies).

### Fixed

- Cloudflare Pages now deploys the static `dist/client` site rather than the failing SSR worker.
  Client-side routes use a Pages SPA fallback.

## [0.2.0] — 2026-08-18

### Added

- Documentation code samples now use the bundled Vertex Lite editor: syntax-highlighted,
  copyable and explicitly read-only.
- A sticky desktop sidebar regression test covers component documentation routes while the page
  scrolls.

### Changed

- Refreshed the docs installation experience with working pnpm/npm/yarn commands and the
  published `quartz-headless` package name.
- Updated the demo design system to Volt UI 1.0 and uses Angular Movement for page animation.
- Merging a version bump into `main` now publishes npm and creates the GitHub Release
  automatically; existing npm versions are safely skipped.

### Fixed

- The component navigation sidebar remains sticky on desktop instead of scrolling away with the
  documentation content.
- Component navigation now uses one responsive drawer implementation, restoring the mobile
  sidebar after the Volt UI 1.0 upgrade.
- E2E checks now assert the redesigned home copy and CTA labels instead of stale pre-redesign
  content.

## [0.1.0] — 2026-08-18

### Added

- **Listbox.** New directive-based, unstyled WAI-ARIA listbox with single/multiple selection,
  active-descendant focus, disabled options, vertical/horizontal keyboard navigation,
  Home/End, Enter/Space and type-ahead. It exposes a two-way `value` model and `compareWith`
  for object values, and is registered in the source-copy CLI and docs site.

### Fixed

- Drag-drop object configuration now consistently honors `disabled` for draggables/drop zones
  and `sortable` for drop zones, matching the public `DragDropConfig` / `DropZoneConfig` API.
- The package smoke test now correctly rejects missing `sideEffects: false` metadata.

### Changed

- npm publication is now an explicit `workflow_dispatch` action with `publish: true`; ordinary
  pushes to `main` still deploy docs but cannot fail by publishing an already-published version.
- Documentation now accurately describes Quartz as having no visual theme rather than no CSS at
  all: portal and layout primitives retain only the structural styles their behaviour requires.
- Drag & drop is described accurately as native pointer-based HTML DnD; keyboard DnD remains a
  separately scoped future primitive.

## [0.0.6] — 2026-08-18

### Added

- **Tree lazy loading.** `qz-tree` accepts an optional `loadChildren: (node) => Promise<TreeNode[]>`
  input. A node marked `hasChildren: true` fetches its children the first time it is expanded,
  exactly once — collapsing and re-expanding renders from memory. Per-node state
  (`idle | loading | loaded | error`) is exposed as signals on `TreeNodeContext`
  (`loadState`, `loading`, `error`, `retry`) and on `TreeService`
  (`loadState()`, `isLoading()`, `loadError()`, `retry()`, `hasChildren()`, `findNode()`).
  A failed load leaves the node in `error` **and collapsed**; `expandAll()` never triggers
  loads. New types: `TreeNodeLoadState`, `TreeLoadChildrenFn`; new field `TreeNode.hasChildren`.
- `TreeService.config` — the resolved configuration is now readable.
- `<qz-tree>` renders an `<ng-template>` projected as content, as an alternative to the
  `[nodeTemplate]` input (the input still wins when both are present).
- Escape dismisses an open tooltip (WAI-ARIA APG), for both text and template tooltips.
- Demo: lazy-loading section on `/tree` backed by a fake object-storage listing, including
  a branch that always fails so the error/retry path is visible.

### Changed

- **`TreeConfig.toggleOnClick` now does what it documents.** The option was read nowhere, so
  clicking a row only selected it. With the documented default (`true`) a click on a parent
  row now expands/collapses it as well as selecting it. Pass
  `[config]="{ toggleOnClick: false }"` for the previous behaviour.
- `DialogRef.closed$` (`ReplaySubject`) vs `OverlayRef.closed$` (`Subject`): the difference is
  now deliberate, documented in both files and covered by tests — a dialog is one-shot so late
  subscribers still get the close, an overlay is reusable so it must not replay. Closes P3.4.

### Fixed

- Toast position containers no longer swallow clicks. All six aria-live regions stay in the
  DOM so announcements work, but an empty one is click-through — previously each page corner
  had a ~32px dead zone that blocked the host application's own UI.
- Toast ids are now monotonic instead of random, so two live toasts can never collide and
  break `@for`'s `track toast.id`.
- Dialogs with no focusable content take focus themselves (`tabindex="-1"` on the panel)
  instead of leaving focus behind the modal.
- The dialog no longer points `aria-labelledby` / `aria-describedby` at generated ids that
  no element uses; explicitly configured ids are still applied as-is.
- Tooltip: repeated hovers no longer stack show timers; disabling a visible tooltip hides it;
  a text tooltip no longer flashes at the viewport origin before it is positioned.
- Docs: the "Custom Node Template" example on `/tree` was never rendering (the projected
  template was ignored and it read `toggle`/`select` off the node instead of the context).

## [0.0.5] — 2026-08-04

### Fixed

- Bump package version to `0.0.5` because `0.0.4` was already published to npm.
- Add `--commit-dirty=true` to `wrangler pages deploy` to avoid the "uncommitted changes"
  warning during the CI build.
- Run `pnpm test:coverage` in CI so the coverage artifact is actually populated.

## [0.0.4] — 2026-08-04

### Added

- Tooltip documentation/demo page (`/tooltip`) with interactive examples for text, placement,
  rich templates, interactive mode, and delay configuration.
- Comprehensive `TreeService` unit tests covering expansion, selection, keyboard navigation,
  type-ahead, and disabled-node handling.
- CLI smoke test (`cli/cli.smoke.spec.js`) that runs `quartz add` in a temp directory and
  verifies transitive dependency copying and resolvable cross-component imports.
- Package build smoke test (`scripts/verify-build.js`) validating `dist/quartz/` artifacts,
  metadata, and public API exports.
- E2E behavior tests for dialog (open, Escape, backdrop click, focus trap), tooltip (hover,
  focus, placement), tree (keyboard navigation, selection), and splitter (keyboard resize).
- SSR safety guards across all Angular primitives: `OverlayService`, `DialogService`, `TooltipService`, `ToastService`, `ViewportService`, `VirtualScrollDirective`, and `DraggableDirective` now avoid touching the DOM when `document.defaultView` is not available.
- Lazy toast timer: `ToastService` only starts its internal interval while there are active toasts, reducing runtime overhead.
- Comprehensive unit tests for `DialogService`, including browser behavior and an SSR-specific spec.
- This changelog.

### Changed

- CI now uses the `packageManager` pnpm version (`pnpm@10.30.1`) and runs `build:lib` +
  `verify:build` before unit tests.
- `DialogRef.closed$` now uses a `ReplaySubject(1)` so late subscribers still receive the close event, including for SSR no-op refs.

### Fixed

- Tooltip docs/demo page was referenced by the CLI registry but did not exist; it is now live.
- `VirtualScrollDirective` no longer references the global `window` object directly; it uses `DOCUMENT.defaultView` for SSR compatibility.
- Removed development warnings from the library build (`DemoPageComponent` unused import and `VoltButton` slot projection in `CodeBlockComponent`).
