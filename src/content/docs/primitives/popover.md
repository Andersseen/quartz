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
