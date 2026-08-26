# ARCHITECTURE — How the Codebase Fits Together

## Top-level map

```
quartz/
├── packages/quartz/        # THE LIBRARY (published as quartz-headless)
│   └── src/
│       ├── public-api.ts   # root barrel — re-exports core/ + primitives/, back-compat
│       ├── core/            # QUARTZ CORE — low-level interaction infrastructure
│       │   ├── public-api.ts   # Core-only barrel
│       │   └── <name>/
│       └── primitives/      # QUARTZ HEADLESS PRIMITIVES — accessible UI patterns
│           ├── public-api.ts   # Primitives-only barrel
│           └── <name>/
├── src/                    # DEMO/DOCS APP (AnalogJS, deployed to Cloudflare Pages)
│   └── app/pages/          # file-based routing; (docs) group = component pages
├── cli/                    # `quartz add` copy-source CLI
│   └── registry.js         # SINGLE SOURCE OF TRUTH: files per component + deps + layer
├── e2e/                    # Playwright tests against the demo app (localhost:5173)
└── docs/ai/                # these docs
```

Three deliverables share this repo: the **library**, the **demo site**, and the **CLI**.
A change to a primitive usually touches all three (lib code → demo page → registry).

## Quartz Core vs. Quartz Headless Primitives

Quartz is split into two layers, enforced by folder location + lint, not just convention:

```
Quartz Core                              Quartz Headless Primitives
(low-level, like Angular CDK)            (accessible, unstyled UI patterns)

collection   focus   dismiss             dialog   tooltip   toast
overlay      viewport                    tree     listbox
drag-drop    virtual-scroll   splitter
```

**Dependency rule — one-way only**: Primitives may import Core; Core may **never** import
Primitives. This is verified two independent ways:

1. `eslint.config.js` — a `no-restricted-imports` override scoped to
   `packages/quartz/src/core/**/*.ts` fails any import matching `**/primitives/**`.
2. `packages/quartz/src/core/core-boundary.spec.ts` — a Vitest spec that statically scans
   every file under `src/core/` for an import referencing `primitives`, independent of
   lint (runs under `pnpm test`).

Both must stay green. If you're tempted to import something from `primitives/` inside
`core/`, the piece you need almost certainly belongs in `core/` instead.

### Why Toast has no Core dependency

Toast visually floats above content like Overlay-based primitives, but it does **not**
use Overlay — it needs a global host, position-grouped stacking, timers and `aria-live`
regions, none of which are Overlay's job (portal lifecycle, anchors, positioning). Sharing
infrastructure only makes sense when the underlying behavior is actually the same; Toast
and Overlay's behavior isn't, so Toast stays a standalone primitive with zero cross-folder
imports. Don't "fix" this by wiring Toast through Overlay — it was evaluated and
deliberately rejected.

### Why there's no `quartz-headless/core` npm subpath (yet)

The Core/Primitives split was originally meant to also ship as ng-packagr **secondary
entry points** (`quartz-headless/core`, `quartz-headless/primitives`) so consumers could
install just one layer. This was implemented and then reverted: ng-packagr's Angular
Package Format secondary-entry-point build crashes whenever one entry point's source
cross-references another entry point's source in this toolchain (Angular 21 / TypeScript
5.9 / ng-packagr 21.2.2) — reproduced locally, and it matches a confirmed, open,
unresolved upstream bug ("Cannot destructure property 'pos' of
'file.referencedFiles[index]' as it is undefined"):
[angular/angular-cli#29450](https://github.com/angular/angular-cli/issues/29450),
[angular/angular-cli#32281](https://github.com/angular/angular-cli/issues/32281). Building
`core` alone works; building `primitives` alone works; building `primitives` when it
imports from `core` (exactly the composition this library needs) crashes. There is no
known workaround short of downgrading TypeScript, which is out of scope for an
architecture-only change.

The package therefore still ships as a **single flat entry point** (`quartz-headless`),
exactly as before — this also matches the constraint that this refactor must not publish
new packages yet. The practical goals secondary entry points would have served are still
met without them:

- **Tree-shaking already works** at the symbol level — the build has `sideEffects: false`
  and every primitive/foundation is a standalone directive/service with no import-time
  side effects, so a consumer who only imports `OverlayService` doesn't pay for Dialog.
- **The Core/Primitives boundary is enforced at the source level** (lint + spec, above),
  which is the part that actually prevents architectural drift.
- `src/core/public-api.ts` and `src/primitives/public-api.ts` exist as real, layer-scoped
  barrels today — they're just not (yet) individually published. Wiring them up as real
  `exports` subpaths is a small, mechanical follow-up once the upstream bug is fixed (or
  if TypeScript is deliberately downgraded), not an architecture change.

## The primitive anatomy (memorize this)

Every folder under `packages/quartz/src/core/<name>/` or
`packages/quartz/src/primitives/<name>/` follows the same pattern:

```
<name>/
  <name>.types.ts          # interfaces + DEFAULT_<NAME>_CONFIG constant
  <name>.service.ts        # core logic, @Injectable({ providedIn: 'root' }) *
  <name>-ref.ts            # ref object handed to consumers (overlay, dialog)
  <name>*.directive.ts     # host-binding directives (declarative API)
  <name>*.component.ts     # rendered components, only where unavoidable (toast, tree)
  index.ts                 # barrel re-exporting the public slice
  *.spec.ts                # Vitest unit tests (excluded from CLI copies)
```

\* Exception: `SplitterService` is **not** root-provided — it is scoped per container via
`providers: [SplitterService]` on `SplitterContainerDirective`, so each splitter instance
gets its own state. Follow this pattern when a primitive needs per-instance state
coordinated across multiple directives.

Adding an export? It must appear in the primitive's own `index.ts` and in its layer's
barrel (`src/core/public-api.ts` or `src/primitives/public-api.ts`). The root
`src/public-api.ts` never needs a manual edit — it's just
`export * from './core/public-api'; export * from './primitives/public-api';`.

## Dependency graph between primitives

```
core/overlay    ◄── primitives/dialog     (dialog renders through overlay's portal container)
                ◄── primitives/tooltip    (tooltip positions through overlay)
core/dismiss    ◄── primitives/dialog, primitives/tooltip
core/focus      ◄── primitives/dialog
core/collection ◄── primitives/listbox, primitives/tree

core/splitter, primitives/toast, core/drag-drop, core/virtual-scroll, core/viewport
  →  standalone, no cross-folder deps
```

`cli/registry.js` encodes this graph as `deps: ['overlay']` plus a `layer: 'core' |
'primitives'` field per entry. If you make a component import from another folder, you
MUST add `deps: [...]` to its registry entry, or CLI users will get broken copies. New
Core pieces get `layer: 'core'`; new Primitives get `layer: 'primitives'`. Core entries
must never import from a `primitives`-layer entry (see boundary rule above).

## How the key primitives work

- **Overlay** (the foundation): `OverlayService.create()` lazily creates one
  `<div data-qz-overlay-container>` fixed to `document.body` (SSR-guarded via
  `document.defaultView` check) and returns an `OverlayRef` that opens/closes embedded
  views inside it. `OverlayTriggerDirective` (`qzOverlayTrigger`) is the declarative wrapper.
  `createAt()` accepts a virtual `{x, y}` anchor for context menus.
- **Dialog**: `DialogService.open(template)` renders via
  `ViewContainerRef.createEmbeddedView()` and passes `DialogRef` as `$implicit` template
  context, so templates do `let-ref` and call `ref.close(result)`.
- **Toast**: `#toasts = signal<Toast[]>([])` internally, `computed()` groups by position,
  a polling timer handles duration-based auto-dismiss. `ToastContainerComponent` renders groups.
- **Splitter**: three cooperating directives (container / handle / panel) coordinated by a
  container-scoped `SplitterService`. Keyboard + touch support live in the handle.
- **VirtualScroll / Viewport**: directives/services with **no DOM side effects at import
  time** — this keeps them tree-shakeable. Preserve that property.

## Demo/docs app (`src/`)

- **AnalogJS** = Vite + Angular. Dev server on **`localhost:5173`** (never :4200).
- File-based routing: `src/app/pages/<route>.page.ts`. The `(docs)` group wraps all
  component pages in the shared docs layout (sidebar + header).
- Each primitive gets: `(docs)/<name>.page.ts` + `.page.html` + `<name>.snippets.ts`
  (code snippets shown on the page).
- **Known Vite cache bug**: new `.page.ts` files inside `(docs)/` are sometimes not picked
  up by file routing. Fix: add a manual entry to `extraRoutes` in `src/app/app.config.ts`
  (see existing `tree`, `virtual-scroll`, `viewport` entries there).
- The app uses Tailwind 4, `@voltui/components`, and `lumen-icons` — those are **demo-only**
  dependencies; never import them in `packages/quartz/`.

## Path aliases

`quartz` → `packages/quartz/src/public-api.ts`, defined in BOTH the app `tsconfig.json`
`paths` and Vite `resolve.alias`. The demo app imports the library as
`import { ... } from 'quartz'`. The ng-packagr build ignores this alias (own tsconfig).

## Build & test topology

| Concern    | Tool / config                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lib build  | ng-packagr → `dist/quartz/` (`pnpm build:lib`), single entry point (see subpath note above)                                                                                      |
| Demo build | Vite (`pnpm build:demo`), deploy: `pnpm pages:deploy` (wrangler)                                                                                                                 |
| Unit tests | Vitest workspaces: `packages/quartz/vite.config.ts` + `vitest.app.config.ts` + `vitest.cli.config.ts`, registered in root `vitest.config.ts`; jsdom + `@testing-library/angular` |
| E2E        | Playwright (`e2e/`), auto-starts dev server via `webServer` config                                                                                                               |
| Type check | two tsconfigs: `packages/quartz/tsconfig.lib.json` + `tsconfig.app.json`                                                                                                         |
| Publish    | `pnpm publish:lib` → publishes `dist/quartz/` only; root pkg is private                                                                                                          |
