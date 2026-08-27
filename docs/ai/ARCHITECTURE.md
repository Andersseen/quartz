# ARCHITECTURE — How the Codebase Fits Together

## Top-level map

```
quartz/                        # pnpm workspace (see pnpm-workspace.yaml: packages/*)
├── packages/
│   ├── core/                    # @quartz-headless/core — QUARTZ CORE (own npm package)
│   │   └── src/
│   │       ├── public-api.ts      # Core's public surface
│   │       └── <name>/
│   └── primitives/               # @quartz-headless/primitives — HEADLESS PRIMITIVES
│       └── src/
│           ├── public-api.ts      # Primitives' public surface
│           └── <name>/
├── src/                    # DEMO/DOCS APP (AnalogJS, deployed to Cloudflare Pages)
│   └── app/pages/          # file-based routing; (docs) group = component pages
├── cli/                    # `quartz add` copy-source CLI
│   └── registry.js         # SINGLE SOURCE OF TRUTH: files per component + deps + layer
├── e2e/                    # Playwright tests against the demo app (localhost:5173)
└── docs/ai/                # these docs
```

Four deliverables share this repo: **two published npm packages**, the **demo site**, and
the **CLI**. A change to a primitive usually touches several (lib code → demo page →
registry).

## Quartz Core vs. Quartz Headless Primitives — two real packages

Quartz ships as **two independent, independently-versioned npm packages** (both under the
`@quartz-headless` org), not one:

```
@quartz-headless/core                    @quartz-headless/primitives
(low-level, like Angular CDK)            (accessible, unstyled UI patterns)

collection   focus   dismiss             dialog   tooltip   toast
overlay      viewport                    tree     listbox
drag-drop    virtual-scroll   splitter
```

**Dependency rule — one-way only**: Primitives depends on Core as a real npm
`peerDependency`; Core must **never** depend on Primitives. This is verified three
independent ways:

1. **Physical package boundary** — Core and Primitives are separate pnpm workspace
   packages (`packages/core/`, `packages/primitives/`). Core's source cannot reach into
   `packages/primitives/` via a relative import at all; the only way to reference it would
   be the bare specifier `@quartz-headless/primitives`, which Core never declares as a
   dependency.
2. `eslint.config.js` — a `no-restricted-imports` override scoped to
   `packages/core/src/**/*.ts` fails any import matching `@quartz-headless/primitives` or
   `@quartz-headless/primitives/**`.
3. `packages/core/src/core-boundary.spec.ts` — a Vitest spec that statically scans every
   file under Core's `src/` for an import referencing `primitives`, independent of lint.

All three must stay green. If you're tempted to import something from Primitives inside
Core, the piece you need almost certainly belongs in Core instead.

### Why Toast has no Core dependency

Toast visually floats above content like Overlay-based primitives, but it does **not**
use Overlay — it needs a global host, position-grouped stacking, timers and `aria-live`
regions, none of which are Overlay's job (portal lifecycle, anchors, positioning). Sharing
infrastructure only makes sense when the underlying behavior is actually the same; Toast
and Overlay's behavior isn't, so Toast stays a standalone primitive with zero dependency on
Core. Don't "fix" this by wiring Toast through Overlay — it was evaluated and deliberately
rejected.

### Why Primitives resolves Core via a real package, not a relative path

An earlier iteration of this split kept Core and Primitives as two folders inside **one**
npm package, with Primitives reaching into Core via `../../core/dismiss`-style relative
imports, and explored ng-packagr **secondary entry points**
(`quartz-headless/core`/`quartz-headless/primitives`) so each could still be a separate
subpath install. Both were abandoned after hitting the same confirmed, open, unresolved
upstream Angular CLI/TypeScript bug ("Cannot destructure property 'pos' of
'file.referencedFiles[index]' as it is undefined") whenever one Angular library project's
TypeScript program pulls in another project's **.ts source** across a project/entry-point
boundary — reproduced locally on this exact toolchain (Angular 21 / TypeScript 5.9 /
ng-packagr 21.2.2), matching
[angular/angular-cli#29450](https://github.com/angular/angular-cli/issues/29450) and
[angular/angular-cli#32281](https://github.com/angular/angular-cli/issues/32281).

Splitting into **two real, separate packages** (this current structure) sidesteps the bug
entirely: `@quartz-headless/primitives`'s real `ng build` resolves
`@quartz-headless/core` through normal `node_modules` resolution (a pnpm workspace symlink
to `packages/core/`, whose `package.json` `exports`/`module`/`typings` point into its own
**built** `packages/core/dist/`) — the exact same mechanism every `rxjs`/`@angular/core`
import already uses safely. The bug is specifically about crossing into another project's
**source**; resolving another project's **compiled output** as a normal dependency has
never been a problem.

**Two resolution paths for `@quartz-headless/core`, deliberately different:**

- **Real `ng build` / `pnpm typecheck`** — resolves via `node_modules` to Core's _built_
  package. `packages/core` must be built first (`pnpm typecheck` and `pnpm build:lib` both
  do this automatically). This is required, not optional — pointing Primitives' library
  build at Core's raw `.ts` source (via a tsconfig `paths` alias, even to the same
  workspace) reproduces the exact upstream crash above.
- **Vitest (`packages/primitives/vite.config.ts`) and the demo app** — resolve
  `@quartz-headless/core` the same way, via `node_modules` to the built package. An earlier
  attempt aliased Vitest straight to Core's `.ts` source for a buildless fast path; that
  broke silently (`@analogjs/vite-plugin-angular` only correctly transforms Angular
  decorators for files inside its _own_ project's registered TypeScript program — a file
  reached via alias from a sibling package's program came back with zero exports, no
  error). Don't reintroduce that alias without solving the "file must be in the plugin's
  own program" problem first.

**Net effect**: `packages/core` must be built (`pnpm exec ng build quartz-core`) before
`packages/primitives` can be built, typechecked, or unit-tested. `pnpm build:lib` and
`pnpm typecheck` already sequence this; if you run `ng build quartz-primitives` or its
vitest project directly without building core first, you'll get a "failed to resolve
import" error — that's expected, not a bug.

## The primitive anatomy (memorize this)

Every folder under `packages/core/src/<name>/` or `packages/primitives/src/<name>/`
follows the same pattern:

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

Adding an export? It must appear in the primitive's own `index.ts` and in its package's
`public-api.ts` (`packages/core/src/public-api.ts` or
`packages/primitives/src/public-api.ts`).

## Dependency graph

```
@quartz-headless/core                    ◄── @quartz-headless/primitives (peerDependency)

  overlay    ◄── dialog, tooltip     (dialog renders through overlay's portal container;
                                       tooltip positions through it — both import from
                                       '@quartz-headless/core', a real package import)
  dismiss    ◄── dialog, tooltip
  focus      ◄── dialog
  collection ◄── listbox, tree

  splitter, drag-drop, virtual-scroll, viewport (Core)
  toast (Primitives)
    →  standalone, no cross-package or cross-folder deps
```

`cli/registry.js` encodes this as `layer: 'core' | 'primitives'` plus either `deps: [...]`
(Core-internal sibling folders the CLI must also copy — e.g. overlay needs dismiss) or
`peerDeps: ['@quartz-headless/core']` (Primitives — the CLI does **not** copy Core source
for a primitive; it tells the consumer to `npm install` it instead, matching the pattern of
shadcn copying a styled wrapper while keeping Radix as a real dependency). If you make a
Core component import another Core component, add it to `deps`. Core entries must never
carry a `peerDeps` pointing at `@quartz-headless/primitives` (see boundary rule above).

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
  component pages in the shared docs layout (sidebar + header). The sidebar shows two
  groups, "Core" and "Primitives", matching the package split; each page's `<app-demo-page
badge="...">` is `"Core"` or `"Primitive"` accordingly.
- Each primitive gets: `(docs)/<name>.page.ts` + `.page.html` + `<name>.snippets.ts`
  (code snippets shown on the page).
- **Known Vite cache bug**: new `.page.ts` files inside `(docs)/` are sometimes not picked
  up by file routing. Fix: add a manual entry to `extraRoutes` in `src/app/app.config.ts`
  (see existing `tree`, `virtual-scroll`, `viewport` entries there).
- The app uses Tailwind 4, `@voltui/components`, and `lumen-icons` — those are **demo-only**
  dependencies; never import them in `packages/core/` or `packages/primitives/`.

## Path aliases

`tsconfig.app.json` and the demo app's `vite.config.ts` / `vitest.app.config.ts` each map
`@quartz-headless/core` → `packages/core/src/public-api.ts` and
`@quartz-headless/primitives` → `packages/primitives/src/public-api.ts` (demo-app-only —
these source-pointing aliases must **not** be added to the shared root `tsconfig.json`,
since that would leak into the library tsconfigs and reintroduce the crash described
above). The demo app imports the libraries as `import { ... } from '@quartz-headless/core'`
/ `'@quartz-headless/primitives'`, same specifiers a real npm consumer would use — the
alias just points them at source instead of a published version for fast local iteration.

## Build & test topology

| Concern    | Tool / config                                                                                                                                                                                                         |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lib build  | ng-packagr, two Angular CLI projects (`quartz-core`, `quartz-primitives` in `angular.json`) → `packages/core/dist/`, `packages/primitives/dist/` (`pnpm build:lib`, core first)                                       |
| Demo build | Vite (`pnpm build:demo`), deploy: `pnpm pages:deploy` (wrangler)                                                                                                                                                      |
| Unit tests | Vitest workspaces: `packages/core/vite.config.ts` + `packages/primitives/vite.config.ts` + `vitest.app.config.ts` + `vitest.cli.config.ts`, registered in root `vitest.config.ts`; jsdom + `@testing-library/angular` |
| E2E        | Playwright (`e2e/`), auto-starts dev server via `webServer` config                                                                                                                                                    |
| Type check | `pnpm typecheck`: builds Core, then `tsc --noEmit` for both lib tsconfigs plus `tsconfig.app.json`                                                                                                                    |
| Publish    | `pnpm publish:lib` → `npm publish` both `packages/core/dist` and `packages/primitives/dist`; root pkg is `"private": true`. CI publishes Core before Primitives.                                                      |
| Legacy     | The old unscoped `quartz-headless` package is **frozen** at its last published version — no longer built or published from this repo.                                                                                 |
