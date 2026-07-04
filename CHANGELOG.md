# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- SSR safety guards across all Angular primitives: `OverlayService`, `DialogService`, `TooltipService`, `ToastService`, `ViewportService`, `VirtualScrollDirective`, and `DraggableDirective` now avoid touching the DOM when `document.defaultView` is not available.
- Lazy toast timer: `ToastService` only starts its internal interval while there are active toasts, reducing runtime overhead.
- Comprehensive unit tests for `DialogService`, including browser behavior and an SSR-specific spec.
- README for the experimental `@quartz/web` package.
- This changelog.

### Changed

- `DialogRef.closed$` now uses a `ReplaySubject(1)` so late subscribers still receive the close event, including for SSR no-op refs.

### Fixed

- `VirtualScrollDirective` no longer references the global `window` object directly; it uses `DOCUMENT.defaultView` for SSR compatibility.
