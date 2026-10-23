# Spec: v1 floating and feedback contract

- **Status:** Implemented in 0.8.0 (decisions in §9; evidence in `docs/releases/0.8-acceptance.md`)
- **Branch:** feat/quartz-0.8-floating-feedback
- **Date:** 2026-10-23 (drafted 2026-09-06)
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

## 8. Resolved questions (0.8.0)

1. **Typed `DialogRef` close result — no.** `DialogRef.close()` and `closed$` stay `void`. A result
   is trivially carried by the closure that opened the dialog (or the template's own state), and
   a generic `DialogRef<R>` / `close(result?)` would change every consumer signature for a
   convenience. Revisit only on demonstrated need; adding an optional generic with a `void`
   default later is backward compatible.
2. **Close reasons for Dialog/Popover/Menu — no.** Select and Combobox expose reasons because
   their values depend on them. Dialog closes for one of: Escape, backdrop, `close()` or host
   destruction, and every consumer-visible side effect is already observable (`closed$` fires
   once). No new exports.

## 9. 0.8.0 decisions

### 9.1 Dialog

- **Accessible name authoring path** (documented, one of):
  1. bind the template context `ariaLabelledBy` to the title element (`let-labelledBy="ariaLabelledBy"`
     → `<h2 [id]="labelledBy">`); likewise `ariaDescribedBy`;
  2. pass `ariaLabelledBy` / `ariaDescribedBy` ids of elements that exist in the document;
  3. pass the new optional `ariaLabel` (plain string) when there is no visible title.
- **References never dangle.** A reference is written only if its target exists: generated ids
  are looked up inside the panel, configured ids anywhere in the document. `ariaLabel` is used
  only when no `aria-labelledby` resolved. A dialog with no name logs one development-mode
  warning; Quartz does not invent a generic name.
- **Close semantics unchanged:** one-shot `DialogRef`, idempotent `close()`, `closed$` is a
  `ReplaySubject(1)` (late subscribers learn about the close) and emits exactly once, also when
  teardown throws and when the host view is destroyed. `closed$` subscribers may write signals
  even when the close happens during rendering (the emission is `untracked`).
- **SSR:** `open()` returns an already-closed no-op ref.

### 9.2 Modal isolation (internal `dialog/modal-isolation.ts`, no public API)

A modal Dialog makes the rest of the document inert so background pointer, focus and
assistive-technology access is blocked, while the dialog and its related portals stay operable.

- **Mechanism:** native `inert` on _siblings along the path_ from the dialog's backdrop/wrapper
  up to `<html>` — never on `<body>`, never on an ancestor of the dialog. Browsers without native
  `inert` get `aria-hidden="true"` on the same elements (fallback only).
- **Portal ownership.** Quartz-owned portals stay live: the shared overlay container
  (`[data-qz-overlay-container]`), text tooltips (`[data-qz-tooltip]`) and the Toast portal
  (`.qz-toast-portal`, even when nested in the app tree: its ancestors stay un-inert and only
  its non-portal siblings are isolated). Overlay _wrappers inside the container that were
  already open_ when the modal opened belong to someone else and are isolated individually;
  wrappers opened afterwards (a Menu/Popover/Select from inside the dialog) are not.
- **Nesting and ordering.** State is reference-counted per element per `Document`. Opening dialog
  B isolates dialog A (its layers are background for B); closing B releases only B's holds, so A
  is operable again. Closing A out of order leaves the background isolated for B. The original
  `inert` / `aria-hidden` of an element is captured on first hold and restored when the last
  hold is released (a pre-existing `inert` is never removed).
- **Dynamic siblings.** A `MutationObserver` on the path ancestors isolates nodes added while the
  modal is open (route content, third-party portals); it ignores Quartz portals/dialog layers and
  nodes that Angular re-parented before the callback ran (templates are inserted next to their
  host, then moved into the dialog wrapper).
- **Release order on close:** remove dialog DOM → scroll unlock → release isolation → restore
  focus (the opener lives in the isolated background and must be live again first).
- **View destruction.** A view Angular is already destroying is never destroyed again by Dialog
  or Overlay (a re-entrant `destroy()` detaches the view mid-walk and Angular then skips the
  cleanup of every ancestor view — a Dialog hosting an open Menu was never closed on route
  change). This is the one Core change in 0.8 (`OverlayRef`).
- **Limitations:** consumer-owned portals appended to `<body>` while a modal is open are treated
  as background (no public opt-in hook yet). Toast content is reachable by pointer but not by
  Tab while a modal is open (the focus trap keeps Tab inside the dialog).

### 9.3 Tooltip

- `aria-describedby` is managed imperatively: the tooltip id is _appended_ to the host's tokens
  while shown and only that token is removed afterwards; the attribute is removed only when
  nothing else remains. Previously a host binding overwrote and then deleted consumer
  descriptions. Consumer-provided ids on template tooltip roots are kept.
- Hover and keyboard focus are tracked separately; the tooltip hides only when neither is
  active. Escape hides immediately (and stays hidden until a new interaction begins).
- A second `hide()` replaces the pending hide timer; the string path's positioning frame is
  cancelled on teardown; content changes while visible update/replace the tooltip in place.
- String tooltips are positioned with the same `calculatePosition` (direction and viewport
  aware) as the Overlay path; unifying the two rendering paths onto one engine is deferred
  (the string path has no template to give Overlay).
- **Tooltip vs Popover:** a Tooltip is a non-interactive description (`role="tooltip"`,
  trigger keeps focus, never hosts focusable content). Anything the user must reach or operate
  is a Popover (or Menu/Select).

### 9.4 Popover

- Events: `opened`/`closed` once per real transition; no `closed` for a popover that never
  opened. The `open` model can never stay `true` while the trigger is disabled (it is pushed
  back to `false`); disabling an open trigger closes it without moving focus.
- The queued `autoFocus` frame is cancelled on close/destroy: a closed popover cannot receive
  focus. Popover is not modal and adds no focus trap of its own.
- Close and focus per interaction: Escape and trigger toggle close and restore focus to the
  trigger; outside pointer closes and lets focus follow the user's click; destroy closes
  without moving focus; Tab is left to the browser (non-modal).

### 9.5 Menu and submenus

- Frame-queued focus callbacks are cancelled when the menu/submenu closes.
- Hovering a plain sibling item closes the open submenu after the same `submenuOpenDelayMs`
  used for opening (so a diagonal move toward the submenu is not cut short) and moves focus to
  the hovered item. The pending hover timer is cancelled on pointer leave and destroy.
- Closing a submenu with focus restoration restores through the captured restorer, otherwise
  focuses the parent item (previously both ran).

### 9.6 Toast

- `pause(id)` freezes the _exact_ remaining time (the last 100 ms tick could be stale);
  `resume` on a toast that is not paused is a no-op (it used to shift the deadline).
- Severity: `error` → `role="alert"`, every other type → `role="status"`; `aria-atomic="true"`.
  The progress bar is `aria-hidden`, so progress updates never re-announce. The close button is
  named "Close notification".
- Structural vs visual: position/stacking stay in the container; spacing and size are
  consumer-controlled CSS variables with the previous values as defaults:
  `--qz-toast-inset` (16px), `--qz-toast-gap` (8px), `--qz-toast-max-width` (400px),
  `--qz-toast-z-index` (9999). Empty position containers never intercept pointer events.
- Automated checks cannot prove a screen reader announces a toast; manual assistive-technology
  validation is recorded as pending in the acceptance note.
