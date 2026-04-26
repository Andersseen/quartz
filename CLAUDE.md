# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (localhost:5173 via Vite/AnalogJS — not :4200)
pnpm start

# Build
pnpm build:lib        # ng-packagr → dist/quartz (library only)
pnpm build:demo       # Vite build (demo app)

# Tests
pnpm test             # Run all Vitest tests (lib + app) once
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # Coverage report → coverage/

# Run a single test file
pnpm exec vitest run packages/quartz/src/lib/overlay/overlay.service.spec.ts

# E2E (requires dev server running or uses webServer config)
pnpm e2e              # Playwright headless
pnpm e2e:ui           # Playwright UI mode

# Run a single E2E spec
pnpm exec playwright test e2e/components.spec.ts

# Lint & format
pnpm lint
pnpm format

# Type check (lib + app)
pnpm typecheck

# Deploy
pnpm pages:deploy     # Builds demo + deploys to Cloudflare Pages

# CLI (copy primitives into a consumer project)
pnpm quartz add <component>
pnpm quartz list
```

Pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files), `typecheck`, and `pnpm test` — all three must pass.

# Publish to npm

```bash
# One-shot: build lib then publish dist/quartz to npm as quartz-headless
pnpm publish:lib

# Or manually:
pnpm build:lib
npm publish ./dist/quartz --access public
```

Requires being logged in to npm (`npm login`) with access to the `@andersseen` scope. The published package is `dist/quartz/` — the monorepo root is never published (`"private": true`).

## Architecture

### Two-part monorepo

**Library** (`packages/quartz/`): unstyled, headless Angular primitives built with `ng-packagr`. Output: `dist/quartz/`. Each primitive lives in its own folder under `src/lib/` with an `index.ts` barrel. Public surface is `src/public-api.ts`.

**Demo/docs app** (`src/`): AnalogJS (Vite + Angular) app on Cloudflare Pages. File-based routing under `src/app/pages/`. The `(docs)` route group wraps all component pages in a shared layout. New pages added to `(docs)/` sometimes need a manual extra-route entry in `src/app/app.config.ts` due to a Vite cache issue — see the comment in that file.

### Angular patterns used throughout

- **Zoneless** (`provideZonelessChangeDetection`) — no `NgZone`. Use `signal()` / `computed()` for reactivity; avoid `markForCheck()` or `detectChanges()` unless necessary.
- **Standalone components only** (`@angular-eslint/prefer-standalone: error`).
- **`inject()` function** over constructor injection everywhere.
- **Signals-first**: services expose state as `signal()` / `computed()`; outputs prefer `output()` or `outputFromObservable()`.
- **Component/directive selector prefix**: `qz-` (elements) and `qzCamelCase` (attributes). App layer uses `app-` / `appCamelCase`.

### How primitives are structured

Each primitive follows this pattern:

```
lib/<name>/
  <name>.service.ts        # Core logic, @Injectable({ providedIn: 'root' })
  <name>.types.ts          # Interfaces, types, default config constants
  <name>-ref.ts            # Ref object returned to consumers (dialog, overlay)
  <name>*.directive.ts     # Host binding directives where applicable
  <name>.component.ts      # Rendered components where needed (toast, tree)
  index.ts                 # Re-exports (mirrors public-api.ts slice)
  *.spec.ts                # Vitest unit tests
```

**Overlay** is the foundation: `OverlayService.create()` returns an `OverlayRef` that manages a portal container attached to `document.body` with fixed positioning. `OverlayTriggerDirective` wraps the service for declarative use. Dialog and Tooltip build on top of Overlay.

**Dialog** renders templates via `ViewContainerRef.createEmbeddedView()`, passes `DialogRef` as `$implicit` context so templates can call `close()`.

**Toast** uses Angular signals internally (`#toasts = signal<Toast[]>([])`), groups toasts by position via `computed()`, and manages a polling timer for duration-based dismissal.

**Splitter** provides `SplitterService` scoped per `[qzSplitterContainer]` (via `providers: [SplitterService]`), coordinates three cooperating directives: container, handle, panel.

**VirtualScroll / Viewport**: standalone directives/services with no DOM side effects at import time — tree-shakeable.

### CLI (`cli/`)

The `quartz add` CLI copies raw TypeScript source files from `packages/quartz/src/lib/` into consumer projects. `registry.js` is the single source of truth for which files belong to each component and their transitive `deps`. When adding a new primitive, register it there. `tooltip` and `listbox` are currently marked `soon: true` — they appear in the registry but the copy step is skipped.

### Path aliases

`quartz` resolves to `packages/quartz/src/public-api.ts` in both the app's `tsconfig.json` paths and Vite `resolve.alias`. The library build ignores this alias (ng-packagr uses its own tsconfig).

### Testing

Unit tests live alongside source files as `*.spec.ts`. They use `@testing-library/angular` and `TestBed` with Vitest globals. The library's vitest config (`packages/quartz/vite.config.ts`) and the app's config (`vitest.app.config.ts`) are both registered as Vitest workspaces in the root `vitest.config.ts`.

E2E tests in `e2e/` use Playwright against a running dev server (auto-started by `webServer` config). Tests target `localhost:5173`.
