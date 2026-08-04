# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
