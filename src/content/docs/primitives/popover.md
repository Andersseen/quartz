---
title: Popover
description: 'A non-modal floating surface for interactive content. It composes Overlay dismissal and positioning without trapping focus or forcing dialog semantics.'
group: Primitives
order: 104
---

## At a glance

- **Interactive** — Buttons, links and form controls can live inside
- **Non Modal** — No focus trap by default
- **Dismissable** — Escape, outside pointer and scroll close it
- **Positioned** — Placement, offset, flip and width matching

## Live examples

::demo[popover]

## Code

### Basic Popover

```ts
import { PopoverDirective, PopoverTriggerDirective } from '@quartz-headless/primitives';

<button qzPopoverTrigger [popover]="details" type="button">
  Details
</button>

<ng-template #details>
  <div qzPopover class="popover">
    <button type="button">Focusable action</button>
  </div>
</ng-template>
```

### Controlled State

```html
<button qzPopoverTrigger [popover]="settings" [(open)]="open" [autoFocus]="true">Settings</button>
```

## Arrow geometry

Set `arrowSize` (px) and optionally `arrowPadding` on the trigger to receive geometry for an arrow you render yourself.

::demo[popover-arrow]

::playground[quartz-popover-arrow]

```html
<button
  qzPopoverTrigger
  [popover]="tpl"
  placement="bottom"
  [arrowSize]="10"
  [arrowPadding]="8"
  #pop="qzPopoverTrigger"
>
  Details
</button>

<ng-template #tpl let-arrow="arrow" let-placement="placement" let-open="open">
  <div qzPopover class="popover" style="position: relative">
    <button type="button">Action</button>
    @if (arrow()?.available) {
    <i class="arrow" [style.left.px]="arrow()!.offset"></i>
    }
  </div>
</ng-template>
```

The context values are signals (`arrow`, `placement`, `open`) and the trigger exposes `arrow()` and `resolvedPlacement()` while open (`null` when closed). The panel also gets `data-side`, `data-placement`, `--qz-arrow-x`/`--qz-arrow-y` and `data-qz-arrow="hidden"`, so a pure-CSS arrow works too. See [Tooltip](/docs/primitives/tooltip#arrow-geometry) for the exact meaning of `side`, `edge`, `offset`, `centerOffset` and `available`.

The arrow follows the actual surface after flip, shift, resize and (since a Popover closes on scroll) every reposition; it never keeps a stale position after flipping. `aria-expanded` mirrors the real state, and `aria-controls` references the panel only while it is mounted. Focus handling is unchanged: Escape, outside press and `autoFocus` behave as before. In RTL, `bottom-start` resolves to a physical `bottom-end`, and `arrow().placement` reports the physical value.

## Differences from Volt and limitations

Quartz does not render the arrow. Arrow geometry is computed from the overlay's final, clamped position; if the anchor leaves the viewport, the arrow is reported unavailable rather than guessed.
