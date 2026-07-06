# BEST PRACTICES — Hard Rules for Writing Code Here

These are not suggestions. Lint, the pre-commit hook, or review will reject violations.

## Angular patterns (library AND demo app)

| ✅ Do                                                                                     | ❌ Don't                                                                                |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `signal()`, `computed()`, `effect()` for state                                            | `BehaviorSubject` for new internal state; `NgZone`; `markForCheck()`; `detectChanges()` |
| `inject(Thing)` as a field initializer                                                    | Constructor parameter injection                                                         |
| Standalone components/directives (no `standalone: true` needed in v21 — it's the default) | `NgModule` anywhere                                                                     |
| `ChangeDetectionStrategy.OnPush` on every component                                       | Default change detection                                                                |
| `input()` / `output()` / `model()` signal APIs                                            | `@Input()` / `@Output()` decorators in new code                                         |
| `outputFromObservable()` when bridging RxJS                                               | Manual subscribe + EventEmitter                                                         |
| `host: { ... }` metadata or host-binding signals                                          | `@HostBinding` / `@HostListener` decorators in new code                                 |
| Native control flow `@if` / `@for` (with `track`)                                         | `*ngIf` / `*ngFor`                                                                      |
| ES `#private` fields for internal state (`#toasts = signal(...)`)                         | `private _foo` naming for true internals                                                |

## Library-only rules (`packages/quartz/`)

1. **Zero styling.** No CSS classes with visual meaning, no style opinions. Allowed:
   `data-qz-*` attributes for consumers to target, and structural inline styles that are
   required for behaviour (`position: fixed`, `pointer-events`, transform for positioning).
2. **Zero dependencies** beyond `@angular/*` (peer), `rxjs`, `tslib`. Never import from
   `src/` (demo app), `@voltui/*`, `lumen-icons`, or Tailwind.
3. **SSR-safe always.** Never touch `document`/`window` at import time or in field
   initializers. Get the document via `inject(DOCUMENT)` and guard browser-only code with
   `if (!this.document.defaultView) return ...;` (see `overlay.service.ts` for the
   canonical pattern). Every DOM-creating service needs an SSR test
   (see `dialog.service.ssr.spec.ts`).
4. **No DOM side effects at import time** — keeps the library tree-shakeable
   (`sideEffects: false` in package.json is a promise; don't break it).
5. **Config pattern:** each primitive's `<name>.types.ts` exports the interfaces and a
   `DEFAULT_<NAME>_CONFIG` constant; APIs accept `Partial<Config>` and merge:
   `{ ...DEFAULT_X_CONFIG, ...config }`.
6. **Selectors:** elements `qz-*`, attributes `qzCamelCase`. Demo app uses `app-*`.
7. **Public API discipline:** new exports go in the primitive's `index.ts` AND
   `public-api.ts`. Types exported with `export type { ... }`.
8. **Accessibility is a feature, not polish.** Keyboard support and ARIA roles/attributes
   are part of a primitive's definition of done (see WORKFLOW.md).
9. **Clean up everything.** Directives/services that add listeners, timers, or DOM nodes
   must remove them via `DestroyRef`/`OnDestroy` or by returning cleanup functions.
   Overlays/dialogs/tooltips must not leak containers.

## Testing rules

- Unit tests live **next to the source** as `*.spec.ts`, run by Vitest (globals enabled)
  with jsdom and `@testing-library/angular`.
- Test through a **host component** rendered with `render(TestHost)` from
  `@testing-library/angular`; query with `screen` (see `tooltip.directive.spec.ts` for the
  canonical shape).
- Timer-based behaviour: `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in
  `afterEach`, advance with `vi.advanceTimersByTime(ms)`.
- **Clean the DOM in `afterEach`** — portals attach to `document.body` and survive between
  tests otherwise.
- Run a single file: `pnpm exec vitest run packages/quartz/src/lib/<x>/<x>.spec.ts`.
- E2E only for user-visible flows on the demo site (`e2e/*.spec.ts`, Playwright, targets
  `localhost:5173`). Don't write E2E for logic a unit test can cover.

## Formatting & lint (mechanical — just conform)

- Prettier: `printWidth: 100`, `singleQuote: true`, Angular parser for HTML.
- ESLint: `@angular-eslint/prefer-standalone` is an **error**; TS-ESLint 7.
- `pnpm lint` and `pnpm format` before finishing. The pre-commit hook runs
  lint-staged + `pnpm typecheck` + `pnpm test` — all three must pass.

## Commit / PR conventions

- Conventional-ish prefixes seen in history: `feat:`, `fix:`, `refactor:`.
- Branches: `feature/<topic>`, merged to `main` via PR.
- Never commit `dist/`, never publish from the root (root package is `"private": true`).

## Common mistakes that waste sessions (learn from past pain)

1. Editing library code but forgetting `cli/registry.js` → CLI copies break silently.
2. Adding a `(docs)/` page and not seeing the route → it's the Vite cache issue; add the
   route to `extraRoutes` in `src/app/app.config.ts`, don't debug the router.
3. Assuming the dev server is on `:4200` → it's Vite on `:5173`.
4. Using Zone-era APIs (`fakeAsync`, `tick`, `TestBed.flushEffects` hacks) → use Vitest
   fake timers and `await` + `fixture.whenStable()`/`detectChanges` via testing-library.
5. Importing demo-app helpers into the library (the `quartz` alias only goes one way:
   app → lib).
6. Forgetting `cp README.md / LICENSE` step exists in `build:lib` → don't hand-copy files
   into `dist/`, the script does it.
