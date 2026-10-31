---
title: Migrating from 0.5 to the 1.0 line
description: Every verified packaging, behavior and peer-range change between the 0.5 baseline and the current 0.x line that leads to 1.0, with before/after examples.
group: Migration
order: 950
---

Quartz has not released 1.0. This page covers the **development path from the 0.5 baseline to the current 0.x line** and lists only changes that are
recorded in `CHANGELOG.md`, the per-release acceptance records under `docs/releases/` and the code. Releases not listed here changed nothing you
need to act on. Public signatures are guarded by `docs/api/snapshots/`; the current list of exports is in `docs/api/API_INVENTORY.md`.

## Do these first

1. Install **both** scoped packages at the **same version**; Primitives declares `@quartz-headless/core` at that version as a peer (`^X.Y.Z` for
   stable releases, the exact version for `-beta.N`/`-rc.N`):
   `npm install @quartz-headless/core@X @quartz-headless/primitives@X`.
2. Use Angular `^21.2.0 || ^22.0.0` (see [Peer ranges](#peer-ranges)).
3. Rebuild with `strictTemplates` and fix compile errors, then re-run your keyboard and focus tests against the behavior changes below.

## Packaging (0.2.0)

|                   | Before                                  | After                                                                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------------------------------------------------- |
| npm package       | one unscoped package, `quartz-headless` | `@quartz-headless/core` and `@quartz-headless/primitives`                                |
| Status of the old | —                                       | **frozen at 0.2.1**; no further releases                                                 |
| `quartz add <ui>` | copied Core source next to a Primitive  | prints `npm install @quartz-headless/core`; Core pieces still copy                       |
| Forms (0.9)       | not available                           | optional entry `@quartz-headless/primitives/forms`; `@angular/forms` is an optional peer |

```ts
// before
import { OverlayTriggerDirective } from 'quartz-headless';
// after (OverlayTriggerDirective is a Core export; accessible patterns such as DialogService are in Primitives)
import { OverlayTriggerDirective } from '@quartz-headless/core';
import { DialogService } from '@quartz-headless/primitives';
```

## 0.5 baseline

Button-first Checkbox/Switch/Toggle hosts, the committed Switch output, non-interactive Tooltip and the `TreeNodeContext` shape — see
[Migrating to the 0.5 baseline](/docs/migration/upgrading-to-0-5).

```html
<!-- before -->
<div qzSwitch (toggled)="save($event)">Notifications</div>
<!-- after -->
<button qzSwitch [(checked)]="enabled" (checkedChangeCommitted)="save($event)">
  Notifications
</button>
```

## 0.7 — Core behavior fixes (no export, signature or selector change)

- `isFocusable(plainDiv)` is now `false`; give the element a `tabindex` (usually `-1`) before `focusSafely(div)`.
- `closeOnScroll: false` now follows scrolling instead of staying put; an anchor removed from the document closes the overlay.
- `flipAxis: 'cross' | 'both'` flip as documented (previously equal to `'main'`).
- `ViewportService.height()` follows height-only resizes; `CollectionStore.typeahead()` with no match keeps the active item.

## 0.8 — modal isolation

Rendering a Dialog now makes the rest of the page `inert` (or `aria-hidden` as fallback). Content you render into `<body>` while a modal is open is
treated as background. A Dialog needs an accessible name: bind a title to `ariaLabelledBy`, use a valid configured id, or set `ariaLabel`.
`TooltipDirective` now appends/removes its own id in `aria-describedby` instead of overwriting it.

## 0.9 — Forms and selection

- Angular Forms adapters moved to the secondary entry (`QUARTZ_FORMS`): `import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms'`.
- `SelectOptionDirective.label` is now `() => string` (default: the option text). The template syntax `[qzSelectOptionLabel]` is unchanged.
- Tabs and Accordion no longer rewrite a bound value during teardown; Select typeahead no longer throws for options without a label.

## 0.10 – 0.16 — additive

Existing exports and selectors are unchanged (see [0.9 → 0.10](/docs/migration/upgrading-to-0-10) and [0.10 → 0.11](/docs/migration/upgrading-to-0-11)).
Behavior to check:

- Combobox ignores input during IME composition, reports `valueChangeCommitted(null)` when a selected value is edited, and `closeOnSelect` defaults per mode.
- `ToggleGroup` no longer renders `aria-orientation` on its `role="group"` host; use `data-qz-orientation`.
- `SplitterHandleDirective` reports `aria-orientation` as the separator's own axis (a horizontal container's handle is `vertical`); the secondary panel uses
  `flex: 1 1 0%` instead of a computed percentage.
- Documentation URLs moved to `/docs/core/*` and `/docs/primitives/*`; old root URLs redirect.

## 0.17 — consumers, SSR and hydration

- **IDs:** generated ids come from the application-scoped `QzIdGenerator` (`@quartz-headless/core`). Server renders are identical across requests and ids
  survive hydration. If you relied on module-global counters or a specific `qz-*-N` value, stop: bind your own `id` where you need a stable one.
- **NavigationMenu** no longer puts `aria-orientation` on its plain `<ul>`; **Sidebar** starts closed on a first render at a mobile width.
- **CLI:** `quartz add` plans first, refuses to overwrite modified files without `--force`, is repeatable, rolls back on failure and supports `--dry-run`/`--output`.
- **Angular peers** are `^21.2.0 || ^22.0.0` (were `^21.0.0`): Angular 21.0 fails to build because the Toast template uses an arrow function that needs 21.2.

## Peer ranges

| Package    | Peer                               | Range                                                         |
| ---------- | ---------------------------------- | ------------------------------------------------------------- |
| both       | `@angular/core`, `@angular/common` | `^21.2.0 \|\| ^22.0.0`                                        |
| both       | `rxjs`                             | `^7.8.0`                                                      |
| Primitives | `@quartz-headless/core`            | same version as Primitives (`^X.Y.Z`; exact for pre-releases) |
| Primitives | `@angular/forms`                   | `^21.2.0 \|\| ^22.0.0`, **optional**                          |

## What is not promised

Unsupported Angular or Node versions, deep imports into `dist/`, `ɵ`-prefixed or non-public members, and any export not in `docs/api/API_INVENTORY.md`. 1.0 is not
declared; the freeze rules are in `docs/api/FREEZE_POLICY.md`.
