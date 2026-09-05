# Spec: v1 core contract

- **Status:** Draft
- **Branch:** v1-roadmap
- **Date:** 2026-09-05
- **Related:** `docs/api/public-surface.md`, `docs/api/v1-scope.md`, `docs/roadmap/0.6-contracts.md`

## 1. Problem

Core contains the interaction machinery that primitives compose. Several APIs already work well,
but v1 needs explicit lifecycle and cleanup contracts so future fixes do not silently change
focus, dismissal, overlays or RTL behavior.

## 2. Goal / non-goals

- Goal: define stable observable behavior for included Core areas: Collection, Focus, Dismiss,
  Scroll lock, Directionality, Overlay and Viewport.
- Non-goals: no new Core areas, no Forms integration and no commitment yet for Splitter, Drag and
  drop or Virtual scroll.

## 3. Public API

All included Core exports listed in `docs/api/public-surface.md` remain candidates for v1. No new
exports are proposed by this spec. The conditional Core exports remain available in 0.x until a
separate include/remove decision is implemented.

## 4. Behaviour

1. Collection registers only enabled items as navigable and reconciles active item when a selected
   item unregisters or becomes disabled.
2. Collection keyboard navigation respects orientation, loop, disabled items, typeahead timeout and
   RTL through Directionality helpers where used.
3. Focus utilities return only elements that can actually receive focus in the current DOM state;
   hidden ancestors, disabled controls and inert containers are not focus targets.
4. Focus restorer restores the original element if it still exists and is focusable; otherwise it
   no-ops without throwing.
5. Focus trap loops Tab/Shift+Tab inside the container and releases all listeners on destroy.
6. Dismiss calls `onDismiss` only for the topmost active layer and reports one of `escape`,
   `outside-pointer`, `focus-outside` or `scroll`.
7. Scroll lock supports nested locks per `Document`, restores the original body overflow and is
   safe when called with no browser window.
8. Directionality resolves nearest `[dir]`, falls back to document direction, supports explicit
   service override and maps inline arrows consistently.
9. Overlay creates no DOM during SSR, attaches browser portals to `document.body`, emits opened and
   closed once per transition, updates position on supported triggers and destroys views/listeners.
10. Viewport produces deterministic server state and updates browser matches without leaking
    listeners across service instances.

## 5. Files to create / modify

| File                             | Action           | Purpose                           |
| -------------------------------- | ---------------- | --------------------------------- |
| `packages/core/src/**/*.spec.ts` | edit/add later   | One regression per behavior above |
| `scripts/verify-build.js`        | maybe edit later | Public API contract check         |
| `docs/api/public-surface.md`     | maintain         | Public inventory                  |

## 6. Test plan

- Unit: each behavior above receives at least one focused test in its owning Core area.
- E2E: Overlay and focus composition receive browser tests in Chromium, Firefox and WebKit once
  primitives compose them in 0.8.
- SSR: Directionality, Viewport and Overlay no-op behavior must run without real `window`.

## 7. Definition of done

- [ ] Included Core areas have requirement IDs in implementation specs.
- [ ] Conditional Core areas are either promoted with equivalent requirements or excluded with a
      migration note.
- [ ] Coverage gate and public API checks run in CI.

## 8. Open questions

1. Should `isFocusable` be renamed or narrowed if current behavior intentionally means
   "matches focusable selector" rather than "can receive focus now"?
2. Should Overlay auto-update on `resize` and content resize, or remain manual with a documented
   `updatePosition()` obligation?
