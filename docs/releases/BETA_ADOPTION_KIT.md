# Beta adoption kit

For the operators of the two independent consumer integrations required by `docs/roadmap/1.0-validation.md` (V1-REL-02). **Nothing in this
kit has been executed by a real consumer.** No beta version exists yet (`1.0.0-beta.N` is not published); until it does, use the exact version the
beta announcement names. The Quartz demo and the in-repo `consumer/` fixture do **not** count as adopters.

## Ground rules

- Install **only published npm artifacts**: no path/`tsconfig` aliases to Quartz sources, no `workspace:`/`file:` links, no local patches to Quartz.
  If you need a patch, that is a finding (file it), not a workaround to keep silently.
- Use your real application and your real styling. Record what you changed in _your_ code to integrate.
- Do not report an integration as accepted unless you, the operator, accept it. Acceptance is recorded in the feedback template below.

## Requirements

| Item       | Requirement                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Angular    | `^21.2.0 \|\| ^22.0.0` (21.0 does not build; 21.1 untested). Standalone, zoneless-compatible                                    |
| Node       | The Node range of your Angular version (21.2: `^20.19.0 \|\| ^22.12.0 \|\| ^24.0.0`; 22: `^22.22.3 \|\| ^24.15.0 \|\| ^26.0.0`) |
| TypeScript | Whatever your Angular version requires (verified: 5.9.3 with Angular 21.2, 6.0.3 with Angular 22)                               |
| RxJS       | `^7.8.0`                                                                                                                        |
| Peers      | `@quartz-headless/primitives` peers `@quartz-headless/core` at the **same** version line; `@angular/forms` is optional          |

Compatibility evidence and its limits: `docs/compatibility.md`.

## Install

```bash
npm install @quartz-headless/core@<beta> @quartz-headless/primitives@<beta>
# Forms adapters are in the secondary entry point; @angular/forms must already be installed
```

```ts
import { DialogService, SelectComponent } from '@quartz-headless/primitives';
import { SelectControlDirective } from '@quartz-headless/primitives/forms'; // optional
```

Import only from the package roots and `@quartz-headless/primitives/forms`. Deep imports are unsupported.

Optional Forms setup: add the adapter directive from `@quartz-headless/primitives/forms` to a component that uses `formControlName`/`ngModel`
on a Quartz control; guide: `src/content/docs/guides/angular-forms.md`.

## SSR and hydration guidance

- Primitives are SSR-safe: no DOM access at import or construction time; ids are application-scoped (`QzIdGenerator`), so concurrent requests render identical HTML.
- Overlays, toasts and similar surfaces appear only after hydration. Do not rely on them in the server HTML.
- Do not add `ngSkipHydration` to work around a Quartz mismatch: report it.
- Guide: `src/content/docs/guides/ssr-and-lifecycle.md`. Reference app: `consumer/app` (read it, do not depend on it).

## Public API expectations

The API is a **freeze candidate, not frozen** (`docs/api/FREEZE_POLICY.md`). During beta, expect: bug fixes, accessibility corrections that keep contracts, and
additive API with a CHANGELOG entry. A breaking change needs a maintainer decision, a migration note and a new beta. Inspect the surface in
`docs/api/API_INVENTORY.md`.

## Consumer A — CRUD / forms application

A real CRUD application with: **Select, Checkbox, RadioGroup, Switch**, validation (required, async), **Dialog** (create/edit/confirm delete), **Menu** (row actions),
**Toast** (save/undo feedback), and your own CSS (native or custom).

Workflow 1 — create/edit with validation

1. Open a Dialog from a toolbar button; confirm focus enters it and returns to the opener on close (also Escape).
2. Fill a form built from Select/Checkbox/RadioGroup/Switch bound with Angular Forms; submit empty and confirm errors appear and are announced once.
3. Save; confirm a Toast confirms it and that its Undo action works.

Workflow 2 — row actions

1. Open a row's Menu with the keyboard; choose "Delete"; confirm the confirm-Dialog; confirm focus lands somewhere sensible afterwards.
2. Disable controls conditionally (`disabled` form state) and confirm the visual and keyboard behaviour.

## Consumer B — SSR application

An independent SSR + hydrated application with **Tabs, Accordion, responsive navigation (Sidebar/NavigationMenu), overlays**, served to multiple concurrent requests.

Workflow 1 — server render and hydrate

1. Request each route several times, sequentially and concurrently; compare HTML (ids must match across requests).
2. Load in a browser with the console open; confirm no hydration errors, no replaced nodes, no duplicate ids.

Workflow 2 — client behaviour after hydration

1. Use Tabs and Accordion by keyboard; open/close responsive navigation at desktop and phone width (hydrate at phone width too).
2. Open overlays after hydration; navigate client-side between routes and back.

## Known limitations (as of 0.19)

- Manual screen-reader verification is **not done**; automated axe and keyboard checks are not a substitute (`docs/releases/0.17-manual-a11y.md`).
- Genuine autofill is verified in Chrome only (`docs/releases/0.19-autofill-verification.md`); Firefox/Safari unverified.
- Touch input, physical IME and OS-clipboard paste in Firefox/WebKit are not exercised.
- Angular 21.0/21.1 unsupported. See `docs/compatibility.md` for the full list.
- Combobox result-count and Toast live-region announcements are review targets, not confirmed defects.

## Reproduction instructions (for every report)

State: Quartz versions (exact), Angular/Node/TypeScript versions, browser + version, SSR or client-only, minimal steps, expected vs actual, console output, and
whether it reproduces in `consumer/` (`pnpm review:manual` serves it) or the docs site. A failing minimal component is preferred over a description.

## Issue severity

| Level | Meaning                                                                                                | Release effect                             |
| ----- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| P0    | Data loss, crash, security issue, or unusable in a supported configuration                             | blocks the next beta and RC                |
| P1    | A documented contract is broken (keyboard, focus, ARIA, SSR/hydration, Forms value) with no workaround | fix + regression before RC                 |
| P2    | Defect with a reasonable workaround, or a cosmetic/documentation problem                               | backlog, unless it breaks a stable promise |
| P3    | Enhancement or question                                                                                | after 1.0                                  |

## Upgrade and rollback

- Upgrade Core and Primitives **together** to the same version; check the CHANGELOG and `src/content/docs/migration/` first.
- Pin exact beta versions (no `^`) while evaluating: `npm install --save-exact`.
- Roll back by reinstalling the previous exact pair (`npm install --save-exact @quartz-headless/core@<prev> @quartz-headless/primitives@<prev>`) and reverting only your
  own code changes; the latest stable-channel version is `0.16.0` until a newer one is published. Do not mix versions between the two packages.

## Feedback template

Copy into an issue or send to the maintainer. Leave fields you did not test as "not tested".

```markdown
## Consumer integration report

- Consumer: A (CRUD/forms) | B (SSR) | Operator:
- Project: (name or "private"), real application: yes/no
- Quartz versions: core= primitives= (installed from npm: yes/no; any local patch/alias: none/describe)
- Angular= Node= TypeScript= Browser(s)=
- Components used:
- Workflows run: A1 A2 / B1 B2 — outcome of each (PASS / FAIL / not tested)
- Integration difficulty (1 easy – 5 hard) and why:
- Defects (each with severity P0–P3, repro, workaround):
- API gaps or surprises:
- Accessibility observations (with the assistive tech and version, if used):
- Operator acceptance: ACCEPTED | NOT ACCEPTED | PENDING — reason:
- Date of use (target: two weeks of real use):
```
