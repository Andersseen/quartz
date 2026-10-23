# Spec: v1 layer composition

- **Status:** Implemented in 0.7.0
- **Branch:** feat/quartz-0.7-core-consolidation
- **Date:** 2026-10-22
- **Related:** `docs/ai/specs/v1-core-contract.md`, `docs/roadmap/0.7-core.md` (07-02, 07-03),
  `docs/releases/0.7-acceptance.md`

## 1. Problem

Dialog, Overlay (Popover, Menu, Select, Tooltip, Combobox) and any consumer of Dismiss, Focus and
Scroll lock can be open at the same time and nested: Dialog A → Dialog B → a popup opened from B.
Each layer registers its own document-level listeners, so without an explicit ownership model the
lower layers react to events that belong to the layer above.

Defects reproduced and fixed in 0.7.0:

1. Every open Dialog registered a capture `keydown` handler from its focus trap. With Dialog B open
   on top of A, A's trap saw focus outside its container and pulled it back into A.
2. `OverlayRef` registered its dismiss controller one animation frame after opening and then
   re-registered it when arming outside-pointer, so a layer opened right after it could end up
   _below_ it in the stack and lose Escape ownership.
3. Closing a lower Dialog out of order restored focus to its opener even while the user was working
   in another layer.
4. A focus restorer could target an element that had been removed from the document.

## 2. Model (no new public abstraction)

State is per `Document`, held in module-level `WeakMap`s already used by Dismiss and Scroll lock:

| Concern     | Owner                         | Structure (per Document)                       |
| ----------- | ----------------------------- | ---------------------------------------------- |
| Dismissal   | `createDismissController`     | ordered layer stack                            |
| Tab trap    | `createFocusTrap`             | ordered trap stack                             |
| Scroll lock | `createScrollLock`            | reference count + the original body `overflow` |
| Layer order | order of creation/registering | the stack position **is** the creation order   |

A layer is "on top" when it is the last live entry of the dismiss stack. There is no `LayerManager`
and none is exported; the public surface is byte-identical to 0.6.0 (guarded by
`docs/api/snapshots/`).

## 3. Rules

### 3.1 Escape

Only the topmost live dismiss layer reacts to Escape. A top layer that does not listen for Escape
(`closeOnEscape: false`) still owns the key: lower layers do not react either. An Escape handled by
an overlay calls `stopPropagation()`.

### 3.2 Outside pointer

Only the topmost layer evaluates `pointerdown`. The event is "outside" when its target is not inside
the layer's root(s) or its excluded elements (an overlay excludes its anchor). Consequently:

- A pointerdown inside a lower layer while a child popup is open dismisses the popup only.
- A child portal rendered elsewhere in `document.body` never makes the parent layer see an
  "outside" click, because the parent is not on top while the child lives.
- One physical event is claimed by the first layer that dismisses on it (`claimedEvents`), so a
  layer that becomes top _because_ the previous one just closed cannot also react to the same event.
- Overlay arms outside-pointer one task after opening so the gesture that opened it is not read as
  an outside interaction.

### 3.3 Focus

- **Initial focus:** `focusInitialElement` focuses the first tabbable descendant, else the container
  (made script-focusable with `tabindex="-1"`).
- **Trap:** only the most recently created, still-alive trap handles Tab. Lower traps are inert, so
  stacked modals never compete. Destroying a trap (in any order) removes it from the stack and
  never re-activates a destroyed one.
- **Related portals:** if focus is inside `[data-qz-overlay-container]` (a popup/menu/select owned
  by the trapped layer) the trap does not pull focus back; the popup owns Tab while it has focus.
- **Restoration:** a layer captures `document.activeElement` when it opens. On close it restores
  that element only if (a) it is still connected and focusable, and (b) the layer still owns focus
  (focus is inside it, or lost to `<body>`). Closing B returns focus into A; closing A returns it
  to A's opener; closing A while B holds focus does not move focus.

### 3.4 Modal isolation

Implemented in 0.8.0 (design in `v1-floating-contract.md` §9.2). A modal Dialog isolates the
background with the backdrop (pointer), the Tab trap (3.3), Escape/outside ownership (3.1/3.2),
the scroll lock (3.5) **and native `inert`** (`aria-hidden` fallback) on the siblings along the
path from the dialog to `<html>`. Quartz-owned portals opened from inside the modal stay
operable; overlays that were already open are isolated; nested modals isolate the lower dialog;
state is reference-counted and restored exactly.

### 3.5 Scroll lock

Locks are reference-counted per Document. The original `body.style.overflow` is captured by the
first lock and restored exactly when the count reaches zero. Controllers are independent: they
compose, may be released in any order, and `unlock()` / `destroy()` are idempotent and cannot
release another controller's locks. Without a window or body they no-op.

### 3.6 Closing and destroying

- Close/destroy removes the layer from every stack and removes every document listener it added.
- Destroying twice is safe. Closing out of order leaves the remaining stack order intact.
- `OverlayRef` registers its dismiss layer synchronously in `open()` (not on the next frame), so
  stack order equals open order.
- When the host view container is destroyed, Dialog and Overlay close once, release their DOM,
  listeners and locks, and emit `closed` once.

### 3.7 Documents

Two Documents never share a stack, trap list or lock count (each is its own `WeakMap` key).

## 4. Scenario matrix (A–L from the 0.7 brief)

| Scenario                                 | Evidence                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| A/B/C nested open, D Escape ownership    | `dismiss-layers.spec.ts`, `dialog.service.spec.ts`, `core-contracts.spec.ts` |
| E Tab stays in active scope              | `focus-contract.spec.ts` (trap stacking), E2E "Tab stays inside…"            |
| F/G focus restore B→A, A→opener          | `dialog.service.spec.ts`, E2E "Escape closes only the topmost dialog…"       |
| H scroll restored after all layers close | `scroll-lock.spec.ts`, `dialog.service.spec.ts`, E2E "scroll lock is held…"  |
| I independent Documents                  | `dismiss-layers.spec.ts` (per-Document), `viewport.service.lifecycle.spec`   |
| J double destroy                         | `dismiss-layers.spec.ts`, `scroll-lock.spec.ts`, `overlay-lifecycle.spec.ts` |
| K child portal does not dismiss parent   | `overlay-lifecycle.spec.ts`, E2E "clicking inside B while its popup is open" |
| L one pointer event, one dismissal       | `dismiss-layers.spec.ts`                                                     |
| Popup from B closes first, B and A stay  | E2E "a popup opened from B closes first on Escape"                           |

## 5. Non-goals

No public layer manager, no change to selectors or `data-qz-*` hooks, no
change to Dialog/Overlay public config.
