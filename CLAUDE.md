# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI working docs — read before starting work

`docs/ai/` contains the extended agent documentation. Start every session by reading
`docs/ai/CONTEXT.md` (why the project exists) and `docs/ai/STATE.md` (current status —
update it when status changes). Before writing code, follow `docs/ai/BEST_PRACTICES.md`;
for features, use the spec-driven workflow in `docs/ai/WORKFLOW.md` with templates in
`docs/ai/specs/`. See `docs/ai/README.md` for the reading order per task type.

## Commands

```bash
# Dev server (localhost:5173 via Vite/AnalogJS — not :4200)
pnpm start

# Build
pnpm build:lib        # ng-packagr → packages/core/dist/ + packages/primitives/dist/ (core builds first)
pnpm build:demo       # Vite build (demo app)

# Tests
pnpm test             # Run all Vitest tests (both libs + app) once
pnpm test:watch       # Vitest in watch mode
pnpm test:coverage    # Coverage report → coverage/

# Run a single test file
pnpm exec vitest run packages/core/src/overlay/overlay.service.spec.ts

# E2E (requires dev server running or uses webServer config)
pnpm e2e              # Playwright headless
pnpm e2e:ui           # Playwright UI mode

# Run a single E2E spec
pnpm exec playwright test e2e/components.spec.ts

# Lint & format
pnpm lint
pnpm format

# Type check (both libs + app; builds @quartz-headless/core first — required, see Architecture)
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
# One-shot: build both libs then publish each to npm
pnpm publish:lib

# Or manually (core first — primitives declares it as a peer dependency):
pnpm build:lib
npm publish ./packages/core/dist --access public
npm publish ./packages/primitives/dist --access public
```

Requires being logged in to npm (`npm login`) with access to the `@quartz-headless` org. The published packages are `packages/core/dist/` (`@quartz-headless/core`) and `packages/primitives/dist/` (`@quartz-headless/primitives`) — the monorepo root is never published (`"private": true`). The old unscoped `quartz-headless` package is **frozen** at its last published version; don't resurrect a publish path for it.

## Architecture

### Two npm packages + a demo app (pnpm workspace)

**`@quartz-headless/core`** (`packages/core/`): low-level interaction infrastructure — overlay, dismiss, focus, collection, viewport, drag-drop, virtual-scroll, splitter. Built with `ng-packagr`. Output: `packages/core/dist/`. Each piece lives in its own folder under `src/` with an `index.ts` barrel. Public surface is `src/public-api.ts`.

**`@quartz-headless/primitives`** (`packages/primitives/`): accessible UI patterns built on Core — dialog, tooltip, toast, tree, listbox. Depends on `@quartz-headless/core` as a real npm `peerDependency` (resolved locally via the pnpm workspace symlink to Core's **built** output — see "Path aliases" and `docs/ai/ARCHITECTURE.md` for why this must go through `node_modules` and never a tsconfig path to Core's source). Output: `packages/primitives/dist/`.

**Demo/docs app** (`src/`): AnalogJS (Vite + Angular) app on Cloudflare Pages. File-based routing under `src/app/pages/`. The `(docs)` route group wraps all component pages in a shared layout. New pages added to `(docs)/` sometimes need a manual extra-route entry in `src/app/app.config.ts` due to a Vite cache issue — see the comment in that file.

### Angular patterns used throughout

- **Zoneless** (`provideZonelessChangeDetection`) — no `NgZone`. Use `signal()` / `computed()` for reactivity; avoid `markForCheck()` or `detectChanges()` unless necessary.
- **Standalone components only** (`@angular-eslint/prefer-standalone: error`).
- **`inject()` function** over constructor injection everywhere.
- **Signals-first**: services expose state as `signal()` / `computed()`; outputs prefer `output()` or `outputFromObservable()`.
- **Component/directive selector prefix**: `qz-` (elements) and `qzCamelCase` (attributes). App layer uses `app-` / `appCamelCase`.

### How primitives are structured

Each piece, under `packages/core/src/<name>/` or `packages/primitives/src/<name>/`, follows this pattern:

```
<name>/
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

The `quartz add` CLI copies raw TypeScript source files from `packages/core/src/` or `packages/primitives/src/` into consumer projects, flat (`<output>/<name>/`). `registry.js` is the single source of truth: each entry has a `layer` ('core' | 'primitives'), and either `deps` (Core-internal sibling folders also copied) or `peerDeps` (Primitives — tells the consumer to `npm install @quartz-headless/core` instead of copying it). When adding a new piece, register it there.

### Path aliases

`@quartz-headless/core` and `@quartz-headless/primitives` resolve to each package's `src/public-api.ts` in the app's `tsconfig.app.json` paths and the demo's Vite `resolve.alias` — **demo-app-only**, never add these to the shared root `tsconfig.json` (it would leak into the library tsconfigs and break the library build — see `docs/ai/ARCHITECTURE.md`). The library builds ignore these aliases and resolve `@quartz-headless/core` via real `node_modules` (the pnpm workspace symlink to Core's built output), which is why `packages/core` must be built before `packages/primitives`.

### Testing

Unit tests live alongside source files as `*.spec.ts`. They use `@testing-library/angular` and `TestBed` with Vitest globals. Each library's vitest config (`packages/core/vite.config.ts`, `packages/primitives/vite.config.ts`) and the app's config (`vitest.app.config.ts`) are registered as Vitest workspaces in the root `vitest.config.ts`. Primitives' vitest project resolves `@quartz-headless/core` via `node_modules` too, so `packages/core` must be built before running primitives' unit tests (`pnpm test` at the root doesn't hit this because CI/local flows build first — running `vitest` directly against just the primitives project without a prior core build will fail to resolve the import).

E2E tests in `e2e/` use Playwright against a running dev server (auto-started by `webServer` config). Tests target `localhost:5173`.
