---
title: Menu
description: 'Accessible dropdown menus with roving tabindex, type-ahead, nested submenus, checkable items, radio groups, RTL-aware submenu keys and outside dismissal.'
group: Primitives
order: 105
---

## At a glance

- **Keyboard Complete** — Arrows, Home, End, type-ahead, Escape and Tab
- **Nested** — Submenus compose through Overlay and Dismiss
- **Checkable** — Checkbox and radio menu item semantics
- **RTL** — Logical inline keys and placement

## Live examples

::demo[menu]

## Code

### Dropdown Menu

```ts
import { MenuDirective, MenuTriggerDirective, MenuItemDirective } from '@quartz-headless/primitives';

<button qzMenuTrigger [menu]="fileMenu" type="button">File</button>

<ng-template #fileMenu>
  <div qzMenu class="menu">
    <button qzMenuItem (selected)="create()">New file</button>
    <button qzMenuItem (selected)="rename()">Rename</button>
    <button qzMenuItem [disabled]="true">Archive</button>
  </div>
</ng-template>
```

### Submenus

```html
<button qzMenuTrigger [menu]="menu" type="button">Share</button>

<ng-template #menu>
  <div qzMenu class="menu">
    <button qzMenuItem [submenu]="shareMenu">Share with</button>
    <ng-template #shareMenu>
      <div qzMenu class="menu">
        <button qzMenuItem>Email</button>
        <button qzMenuItem>Copy link</button>
      </div>
    </ng-template>
  </div>
</ng-template>
```

### Checkbox And Radio Items

```html
<button qzMenuCheckboxItem [(checked)]="showToolbar">Show toolbar</button>

<div qzMenuRadioGroup [(value)]="density">
  <button qzMenuRadioItem value="compact">Compact</button>
  <button qzMenuRadioItem value="comfortable">Comfortable</button>
</div>
```
