# Spec: v1 floating and feedback contract

- **Status:** Draft
- **Branch:** v1-roadmap
- **Date:** 2026-09-05
- **Related:** `docs/api/public-surface.md`, `docs/api/v1-scope.md`

## 1. Problem

Dialog, Tooltip, Popover, Menu, Select, Combobox and Toast rely on shared overlay, focus, dismiss
and timer behavior. v1 needs a shared contract so each primitive closes, focuses and cleans up in
predictable ways, especially when composed together.

## 2. Goal / non-goals

- Goal: define the contract for included floating/feedback primitives: Dialog, Tooltip, Popover,
  Menu, Select and Toast.
- Non-goals: no visual theme, no new components, no decision to include Combobox unless its
  conditional requirements are accepted separately.

## 3. Public API

Use the existing exports and selectors from `docs/api/public-surface.md`. Tooltip remains
non-interactive. Popover/Menu/Select own interactive floating content. Dialog is service-driven.

## 4. Behaviour

1. A floating primitive emits open/close events at most once per transition and never emits close
   twice for the same user action.
2. Escape dismisses only the topmost active dismiss layer.
3. Outside pointer dismissal ignores clicks inside the trigger, floating content and registered
   child portals.
4. Programmatic open and close follow the same DOM cleanup as user-triggered open and close.
5. Destroying a trigger, route or service removes timers, views, document listeners and scroll locks.
6. Tooltip opens on hover/focus after configured delay, closes on blur/mouse leave/Escape and never
   hosts interactive content.
7. Popover and Menu restore or preserve focus according to their trigger contract and support
   keyboard navigation through enabled items only.
8. Dialog traps focus when modal, restores focus on close when possible, supports empty content and
   has a required accessible name path documented for consumers.
9. Toast announces messages according to severity, supports manual close, pause/resume and duration
   zero, and stops timers when no toast needs work.
10. Dialog -> Menu/Select and Dialog -> Dialog composition works without leaking focus, scroll lock
    or close events across layers.

## 5. Files to create / modify

| File                                                                       | Action         | Purpose                   |
| -------------------------------------------------------------------------- | -------------- | ------------------------- |
| `packages/primitives/src/dialog/**/*.spec.ts`                              | edit/add later | Dialog contract           |
| `packages/primitives/src/{tooltip,popover,menu,select,toast}/**/*.spec.ts` | edit/add later | Family contract           |
| `e2e/**/*.spec.ts`                                                         | edit/add later | Cross-browser composition |

## 6. Test plan

- Unit: event counts, close reasons, cleanup and disabled behavior.
- E2E: keyboard navigation, Escape ownership, outside pointer, route cleanup and composed modal
  scenarios across three Playwright projects.

## 7. Definition of done

- [ ] Included floating/feedback primitives pass the shared behaviors.
- [ ] Combobox is either promoted with IME/async/freeform tests or marked outside v1.
- [ ] Docs state Tooltip vs Popover responsibilities clearly.

## 8. Open questions

1. Should `DialogRef` carry a typed close result before 1.0?
2. Should close reason types be exposed for Dialog/Popover/Menu for consistency with Select?
