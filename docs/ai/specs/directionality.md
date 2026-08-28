# Spec: Directionality (Core foundation)

- **Status:** Done
- **Branch:** fix/docs-responsive
- **Date:** 2026-08-28
- **Related:** N/A

## 1. Problem

Quartz has zero LTR/RTL awareness anywhere in `packages/core/` or `packages/primitives/`
(confirmed by grep — no `dir`/`RTL`/`ltr` logic exists outside generated `dist/` type
declarations). `CollectionStore.handleKeydown` and `OverlayPlacement`'s `-start`/`-end`
suffix both hard-code a left-to-right assumption. Every future direction-sensitive widget
(Menu, Tabs, Toolbar) would otherwise reinvent this resolution independently.

## 2. Goal / non-goals

- Goal: a small, dependency-free Core foundation that resolves effective direction and
  converts between physical (left/right) and logical (inline-start/inline-end) concepts,
  reusable by any current or future Core/Primitives piece.
- Non-goals: no new primitives (Menu, Popover, Select, Combobox, Tabs, …), no DOM
  `MutationObserver`, no Overlay redesign, no behavior change to Listbox or Tree.

## 3. Public API

```ts
// from '@quartz-headless/core'
export type Direction = 'ltr' | 'rtl';
export type LogicalInlineDirection = 'inline-start' | 'inline-end';
export type PhysicalHorizontal = 'left' | 'right';
export type InlineArrowKey = 'ArrowLeft' | 'ArrowRight';

export function resolveDirection(element: Element | null | undefined): Direction;
export function oppositeDirection(direction: Direction): Direction;
export function inlineToPhysical(
  direction: Direction,
  logical: LogicalInlineDirection,
): PhysicalHorizontal;
export function physicalToInline(
  direction: Direction,
  physical: PhysicalHorizontal,
): LogicalInlineDirection;
export function inlineStartKey(direction: Direction): InlineArrowKey;
export function inlineEndKey(direction: Direction): InlineArrowKey;
export function resolveInlineArrowKey(
  direction: Direction,
  key: string,
): LogicalInlineDirection | null;

export class DirectionalityService {
  readonly direction: Signal<Direction>;
  refresh(): void;
  resolve(element?: Element | null): Direction;
  set(direction: Direction): void;
}
```

`CollectionConfig` gained `direction: Direction` (default `'ltr'`). `calculatePosition()`
(Overlay) gained a trailing optional `direction: Direction = 'ltr'` parameter.

## 4. Audit findings

Classified per the three buckets requested:

**1. Should use Directionality (fixed in this PR):**

- `CollectionStore.handleKeydown` (`packages/core/src/collection/collection.ts`) hard-coded
  ArrowRight=next/ArrowLeft=previous for horizontal orientation. This is Core's own public,
  documented convenience API (exported from `public-api.ts`), not just an internal detail —
  any direct consumer of `CollectionStore` was stuck with LTR-only horizontal nav. Now reads
  `config.direction` (default `'ltr'`, so existing behavior is byte-for-byte unchanged) via
  `inlineStartKey`/`inlineEndKey`.
- `OverlayPlacement`'s `top-start`/`top-end`/`bottom-start`/`bottom-end` (cross-axis
  alignment on the horizontal axis) were named as if logical but were physically hard-coded
  (`-start` always meant left). `calculatePosition()` now resolves these four values against
  `direction` before computing; `OverlayRef` resolves direction from the trigger's own
  subtree via `resolveDirection(anchorElement)`. `left`/`right` placements (and their own
  `-start`/`-end`, which align the _vertical_ cross-axis) are untouched — see finding 2.

**2. Physically correct, deliberately left alone:**

- Overlay's `left`/`right` placements and their `-start`/`-end` (vertical alignment)
  variants: there's no direction-dependent meaning for aligning to `top` vs `bottom`, so
  mirroring them would be arbitrary rather than corrective.
- `SplitterHandleDirective.onKeydown` (`packages/core/src/splitter/splitter-handle.directive.ts`):
  ArrowLeft/Right step `SplitterService.position`, a percentage measured from the
  container's physical left edge (`calculatePositionFromEvent` uses `rect.left`). Mouse/touch
  dragging is inherently physical (`clientX` against a physical rect). Making the keyboard
  step logical while the value it steps stays physical, without Splitter controlling or even
  seeing how its two panels are laid out (a headless piece has no opinion on the surrounding
  flex/grid), would desync keyboard from pointer interaction rather than fix anything. Left
  unchanged — this is bucket 2 (physical, correctly so), not a gap.

**3. Out of scope for this PR (Primitives, not Core):**

- `ListboxDirective.onKeydown` (`packages/primitives/src/listbox/listbox.directive.ts`) and
  `TreeNodeComponent.onKeydown` (`packages/primitives/src/tree/tree-node.component.ts`) both
  hard-code ArrowLeft/Right physically. Neither calls `CollectionStore.handleKeydown` — each
  reimplements its own key switch, so fixing Collection does not change their behavior
  either way (confirmed: `CollectionStore.handleKeydown` has no callers anywhere in
  Primitives; `ListboxService` uses `CollectionStore` only for its `next()`/`previous()`
  navigation, not its keydown handling). This PR does not touch either primitive — that's a
  Primitives-layer behavior change, out of scope by the stated constraints ("no new
  primitives", "don't break Listbox/Tree"). Worth a follow-up once a Menu/Tabs primitive
  needs the same mirroring, at which point Listbox could also be pointed at
  `CollectionStore.handleKeydown` directly instead of duplicating the switch.

## 5. Direction resolution

`resolveDirection(element)` walks `element.closest('[dir]')` and reads the `dir` attribute,
defaulting to `'ltr'` when nothing is found. Deliberately attribute-based, not
`getComputedStyle`-based: it needs nothing beyond `Element.closest`/`getAttribute`, which
holds under SSR DOM implementations without a `defaultView` guard, and is exact/predictable
in jsdom for tests (`getComputedStyle`-based `direction` inheritance is not reliably
implemented in jsdom). This resolves both required levels: `<html dir="rtl">` and a
subtree-overriding `<div dir="rtl">` (closest checks the element itself first, then walks
up).

No `MutationObserver`. `DirectionalityService.direction` is resolved once at construction;
`refresh()` re-syncs from the DOM on demand (cheap, explicit, no observer), and `set()`
lets an app override the tracked value directly (e.g. a settings toggle that doesn't touch
`document.documentElement` at all). Evaluated and rejected auto-observing `dir` mutations:
it adds a persistent observer + cleanup lifecycle for a case (live `dir` flips without any
app code driving them) that doesn't come up in practice — apps that support an RTL toggle
already run code at the toggle point, which is exactly where `refresh()`/`set()` fits.

## 6. SSR behavior

`resolveDirection` touches nothing but the `Element` passed to it — no `document`/`window`
reference at all — so it works identically during SSR without a guard. `DirectionalityService`
only touches `DOCUMENT` inside its constructor (via `inject()`, not a field initializer run
at import time), matching the existing `ViewportService`/`OverlayService` pattern. Covered by
`directionality.service.ssr.spec.ts` (fake `Document` with `defaultView: null`, via
`createEnvironmentInjector` + `runInInjectionContext`, mirroring `dialog.service.ssr.spec.ts`).

## 7. Files created / modified

| File                                                                  | Action | Purpose                                                  |
| --------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| `packages/core/src/directionality/directionality.types.ts`            | create | `Direction` + logical/keyboard types                     |
| `packages/core/src/directionality/directionality.ts`                  | create | pure resolve/convert/keyboard helpers                    |
| `packages/core/src/directionality/directionality.service.ts`          | create | `DirectionalityService`                                  |
| `packages/core/src/directionality/index.ts`                           | create | barrel                                                   |
| `packages/core/src/directionality/*.spec.ts` (3 files)                | create | unit + SSR tests                                         |
| `packages/core/src/public-api.ts`                                     | edit   | export Directionality                                    |
| `packages/core/src/collection/collection.types.ts`                    | edit   | `CollectionConfig.direction`                             |
| `packages/core/src/collection/collection.ts`                          | edit   | direction-aware `handleKeydown`                          |
| `packages/core/src/collection/collection.spec.ts`                     | edit   | rtl/ltr/vertical keyboard tests                          |
| `packages/core/src/overlay/overlay-position.ts`                       | edit   | direction param + cross-axis swap                        |
| `packages/core/src/overlay/overlay-position.spec.ts`                  | create | placement resolution tests                               |
| `packages/core/src/overlay/overlay-ref.ts`                            | edit   | resolve anchor direction, pass through                   |
| `cli/registry.js`                                                     | edit   | `directionality` entry; `deps` on `collection`/`overlay` |
| `cli/cli.smoke.spec.js`                                               | edit   | account for the new transitive dep                       |
| `src/app/pages/(docs)/directionality.page.{ts,html}` + `.snippets.ts` | create | demo                                                     |
| `src/app/components/sidebar/sidebar.component.ts`                     | edit   | nav entry                                                |
| `src/app/app.config.ts`                                               | edit   | `extraRoutes` (Vite cache workaround)                    |
| `README.md`                                                           | edit   | primitive table row                                      |

## 8. Definition of done

- [x] Audit documented before implementation (§4)
- [x] `DirectionalityService` + pure helpers, signals-first, zoneless, SSR-safe
- [x] Collection integrated (opt-in `direction`, zero default-behavior change)
- [x] Overlay's logical placements integrated (opt-in via anchor's `dir`, zero
      default-behavior change)
- [x] Splitter's physical-only decision documented, not changed
- [x] Listbox/Tree explicitly out of scope, documented, unchanged
- [x] CLI registry + smoke test updated
- [x] Demo page added and wired into the sidebar/router
- [x] `pnpm lint && pnpm typecheck && pnpm test` green
- [x] `docs/ai/STATE.md` updated
