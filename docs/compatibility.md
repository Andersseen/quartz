# Compatibility

What `@quartz-headless/core` and `@quartz-headless/primitives` are verified to work with, and how that was
verified. Every claim below is backed by a command you can run (see
[Reproduce](#reproduce-the-matrix)); anything not proven is listed under
[Known limitations](#known-limitations).

> Status: the 0.17 consumer gate is **in progress** — see `docs/releases/0.17-acceptance.md` for the
> recorded results and the gates that remain open (manual screen-reader review, genuine browser
> autofill). Until `0.17.0` is published, the peer ranges below are what the branch declares.

## Supported versions

| Angular | Verified as                               | TypeScript | Node (official table)                 | RxJS                 |
| ------- | ----------------------------------------- | ---------- | ------------------------------------- | -------------------- |
| 21.2.0  | declared **minimum** (`angular-21.2-min`) | 5.9.3      | `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0` | `^6.5.3 \|\| ^7.4.0` |
| 21.2.25 | latest 21.2 (`angular-21.2`)              | 5.9.3      | same as above                         | same                 |
| 22.2.4  | Angular 22 (`angular-22`)                 | 6.0.3      | `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0` | same                 |

Source of truth for the Angular/Node/TypeScript/RxJS combinations:
<https://angular.dev/reference/versions>. The two Angular fixtures deliberately use different
TypeScript majors (Angular 21 requires `>=5.9 <6.0`, Angular 22 requires `>=6.0 <6.1`), each with its
own dependency tree and lockfile (`consumer/fixtures/*/package-lock.json`).

Declared peers (identical in Core and Primitives):

```json
"@angular/core": "^21.2.0 || ^22.0.0",
"@angular/common": "^21.2.0 || ^22.0.0",
"@angular/forms": "^21.2.0 || ^22.0.0"   // Primitives only, optional
"rxjs": "^7.8.0"
```

**Why `^21.2.0` and not `^21.0.0`.** Angular 21.0.0 was tried as the minimum and fails to build: the
Primitives `ToastContainerComponent` template uses an arrow function (`[dismissContext]="() => …"`), a
template syntax Angular added in 21.2. The error is raised when the Angular compiler links the installed
package (`Parser Error: Unexpected token ) … [() => toastService.dismiss(toast.id)]`). The peer range was
narrowed to the lowest version that passes the whole suite. Angular 21.1 was not tested and is not
claimed.

**Angular 22** is claimed only because the full Angular 22.2.4 consumer matrix passes (strict AOT,
production build, real SSR, hydration, interaction, accessibility). `@angular/forms` stays an optional
peer: the main `@quartz-headless/primitives` entry never imports it; only
`@quartz-headless/primitives/forms` does.

## What "verified" means

For every supported fixture the **installed packages** (real `npm pack` tarballs from `packages/*/dist`,
installed with `npm` into a throwaway project outside the pnpm workspace) are exercised by an Angular
standalone, zoneless application:

| Check                 | How                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict AOT            | `@angular/build:application`, production, `strictTemplates`, `strictInjectionParameters`, extended diagnostics as errors, `skipLibCheck: false`                               |
| Detects bad templates | before the real build, an invalid binding is injected into a copy and the build **must fail** (`NG8002`/type error); the copy is reverted                                     |
| Public imports only   | the app imports `@quartz-headless/core`, `@quartz-headless/primitives`, `@quartz-headless/primitives/forms`; no path aliases, no `packages/*/src`, no workspace links         |
| Real SSR              | the Angular SSR server renders three+ routes; sequential and concurrent requests must produce byte-identical HTML (no cross-request state)                                    |
| Real hydration        | the server HTML is loaded in the browser; **no** console/page errors, **no** server-rendered interactive node replaced, **no** duplicate ids, **no** dangling ARIA references |
| Interaction           | real keyboard/pointer input in Chromium, Firefox and WebKit (Playwright 1.59: Chromium 147, Firefox 148, WebKit 26.4)                                                         |
| Accessibility         | axe-core 4.14 (WCAG 2 A/AA, 2.1 A/AA) on meaningful states, plus independent keyboard, focus-restoration and ARIA-relationship assertions                                     |
| No retries            | the consumer Playwright config uses `retries: 0`; a pass is a pass                                                                                                            |

The per-row inventory (which of the 46 Volt-parity rows runs on which page and spec) is generated into
`docs/releases/0.17-evidence-matrix.md`.

## Node

Quartz itself has no Node runtime requirement beyond what the Angular toolchain demands. CI runs the
consumer matrix on Node `20.19.0` (Angular 21.2.0), `24` (Angular 21.2) and `22` (Angular 22, asserted
`>=22.22.3`); the repository toolchain builds the libraries on Node 22. The CI cells for Node 20 and 24 cannot be
reproduced on a machine that only has Node 22 — they are CI-only evidence.

## Browsers

Verified in the latest Playwright builds of Chromium, Firefox and WebKit (desktop viewport plus resized
viewports for the responsive controls). Quartz adds no polyfills; browser support otherwise follows the
Angular "widely available" Baseline for the Angular version you use.

## SSR and hydration

- Quartz primitives do no DOM work at import time; browser-only work (overlay positioning, focus,
  scroll lock, timers, `matchMedia`) runs after render and is guarded by the injected `DOCUMENT`.
- **Generated ids are application-scoped.** Until 0.17, generated ids (`qz-radio-3`, `qz-select-trigger-2`,
  …) came from module-level counters shared by every Angular application in the same JavaScript realm — on
  a server, by every request. Identical requests rendered different ids (`qz-radio-3` then `qz-radio-7`),
  and the ids never matched what the client rendered. Ids now come from `QzIdGenerator`
  (`providedIn: 'root'`, per-prefix counters), so each request/application numbers from 1 and the
  server and client agree.
- **Form-field ids are yours.** `qzFormField` requires an explicit `id`; the label, description, error and
  control ids derive from it, so they are identical on server and client by construction.
- **Responsive controls settle after hydration.** The server has no viewport, so the Sidebar renders its
  desktop default. When hydrating on a mobile width the off-canvas sidebar now starts **closed** instead of
  opening an overlay with scroll lock on page load (found by the 0.17 hydration run).
- Do not use `ngSkipHydration` to hide a Quartz problem; the consumer app hydrates every page without it.

Required Angular setup for hydration with SSR:

```ts
provideZonelessChangeDetection(),
provideClientHydration(withEventReplay()),
```

and `security.allowedHosts` (Angular ≥ 21.2.x builders) or `NG_ALLOWED_HOSTS` so the SSR host check does
not silently fall back to client rendering.

## Zoneless

Quartz is zoneless-first (signals, `provideZonelessChangeDetection`). The consumer apps run without
`zone.js`. Reading non-signal state in a template (for example `form.controls.x.value`) does not
re-render under zoneless; expose it as a signal (`toSignal(control.valueChanges)`).

## Angular Forms

Optional. Import adapters from `@quartz-headless/primitives/forms` (`QUARTZ_FORMS`). Core and the main
Primitives entry load without `@angular/forms`.

## Bundle size

Measured on real consumer output with one toolchain and production settings; see
`docs/releases/0.17-bundle-size.md` and the guidance in the Doqs "Consumer testing" guide. Regression
budgets live in `consumer/bundle/budgets.json` and are enforced by `pnpm verify:bundle`.

## CLI source-copy

`quartz add` copies source from a **clone of this repository** (the CLI is not published as its own
package). Core pieces are self-contained; Primitives import `@quartz-headless/core` as a bare package,
so install it as a peer. Behaviour: preflight (nothing is written when anything is wrong), never
overwrites modified files without `--force`, repeatable (a second run is a no-op), rolls back on write
failure, exit codes `0/2/3/4/5/6`. Verified by `pnpm verify:consumer:cli` — a fresh Angular app outside the
workspace, a destination path containing a space, strict AOT, and a browser interaction in three engines.

## Known limitations

- **Genuine browser autofill is not verified.** Automation cannot put an input into the browser's autofill
  state (Playwright's Chromium exposes no DevTools `Autofill` domain; Firefox and WebKit offer no hook).
  `AutofillDirective` detection is best-effort and relies on `:-webkit-autofill` / `:autofill`
  triggering a CSS animation; do not assume every browser or credential manager emits an observable
  event. The `autofill` parity row therefore stays **C**.
- **Physical IME and real clipboard (Firefox/WebKit).** InputOTP composition is verified with synthetic
  composition events and paste with a synthetic `ClipboardEvent` (plus a real Ctrl/Cmd+V in Chromium).
  A physical input method and an OS-clipboard paste in Firefox/WebKit are manual-pending.
- **Screen readers.** No real screen-reader pass has been executed; axe and keyboard assertions are not a
  substitute. The manual matrix is in `docs/releases/0.17-manual-a11y.md` and is **pending**.
- **Touch input** is not exercised (desktop pointer and keyboard only); Resizable pointer capture is verified with a mouse.
- **Angular 21.0 / 21.1** are not supported (21.0 fails to build, see above).
- **Directory pickers** only set `webkitdirectory`; directory contents are never traversed or read, and
  there is no upload or file-content validation.
- The Node 20 and Node 24 matrix cells run in CI only.

## Reproduce the matrix

```bash
pnpm install --frozen-lockfile
pnpm build:lib

# One fixture, all three engines (each cell: npm ci from the fixture lockfile, install tarballs,
# negative AOT check, production build, SSR server, Playwright):
pnpm verify:consumer:runtime -- --fixture angular-21.2-min
pnpm verify:consumer:runtime -- --fixture angular-21.2
pnpm verify:consumer:runtime -- --fixture angular-22

pnpm verify:consumer:cli        # CLI source-copy consumer
pnpm verify:bundle              # bundle budgets (add --report --write-budgets via node to regenerate)
pnpm verify:evidence            # parity rows <-> consumer tests
```

Fixtures live in `consumer/fixtures/<name>/package.json` (exact versions) with their own
`package-lock.json`; to move a fixture to another Angular patch, edit the versions and run the runner with
`--update-lock`.
