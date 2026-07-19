# ARCHITECTURE — How the Codebase Fits Together

## Top-level map

```
quartz/
├── packages/quartz/        # THE LIBRARY (published as quartz-headless)
│   └── src/
│       ├── public-api.ts   # single public surface — everything exported goes here
│       └── lib/<primitive>/
├── src/                    # DEMO/DOCS APP (AnalogJS, deployed to Cloudflare Pages)
│   └── app/pages/          # file-based routing; (docs) group = component pages
├── cli/                    # `quartz add` copy-source CLI
│   └── registry.js         # SINGLE SOURCE OF TRUTH: files per component + deps
├── e2e/                    # Playwright tests against the demo app (localhost:5173)
└── docs/ai/                # these docs
```

Three deliverables share this repo: the **library**, the **demo site**, and the **CLI**.
A change to a primitive usually touches all three (lib code → demo page → registry).

## The primitive anatomy (memorize this)

Every folder under `packages/quartz/src/lib/<name>/` follows the same pattern:

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

Adding an export? It must appear in **both** the primitive's `index.ts` **and**
`packages/quartz/src/public-api.ts`.

## Dependency graph between primitives

```
overlay  ◄── dialog      (dialog renders through overlay's portal container)
         ◄── tooltip     (tooltip positions through overlay)

splitter, toast, drag-drop, tree, virtual-scroll, viewport  →  standalone, no deps
```

`cli/registry.js` encodes this graph as `deps: ['overlay']`. If you make primitive A
import from primitive B, you MUST add `deps: ['B']` to A's registry entry, or CLI users
will get broken copies.

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

| Concern    | Tool / config                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lib build  | ng-packagr → `dist/quartz/` (`pnpm build:lib`)                                                                                                          |
| Demo build | Vite (`pnpm build:demo`), deploy: `pnpm pages:deploy` (wrangler)                                                                                        |
| Unit tests | Vitest workspaces: `packages/quartz/vite.config.ts` + `vitest.app.config.ts`, registered in root `vitest.config.ts`; jsdom + `@testing-library/angular` |
| E2E        | Playwright (`e2e/`), auto-starts dev server via `webServer` config                                                                                      |
| Type check | two tsconfigs: `packages/quartz/tsconfig.lib.json` + `tsconfig.app.json`                                                                                |
| Publish    | `pnpm publish:lib` → publishes `dist/quartz/` only; root pkg is private                                                                                 |
