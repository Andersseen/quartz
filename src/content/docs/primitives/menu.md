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

## Groups, labels and separators

::demo[menu-groups]

```ts
import {
  MenuGroupDirective,
  MenuLabelDirective,
  MenuSeparatorDirective,
} from '@quartz-headless/primitives';
```

```html
<div qzMenu class="menu" aria-label="Workspace">
  <div qzMenuGroup>
    <div qzMenuLabel>Account</div>
    <button qzMenuItem>Profile</button>
    <button qzMenuItem [disabled]="true">Billing</button>
  </div>
  <div qzMenuSeparator></div>
  <div qzMenuRadioGroup [(value)]="density">
    <div qzMenuLabel>Density</div>
    <button qzMenuRadioItem value="compact">Compact</button>
    <button qzMenuRadioItem value="comfortable">Comfortable</button>
  </div>
</div>
```

`qzMenuGroup` is `role="group"` and is named by its `qzMenuLabel` through `aria-labelledby`; `qzMenuRadioGroup` is named the same way. A label keeps its own `id` when it has one. Labels, groups and separators (`role="separator"`, `aria-orientation="horizontal"`) are never registered as menu items: they are skipped by arrow keys, Home/End and typeahead, never take focus and cannot be activated. Removing a label removes `aria-labelledby`; groups can be added and removed dynamically.

## Menu vs NavigationMenu

Use Menu for an action menu (`role="menu"`) opened from a button. Use [NavigationMenu](/docs/primitives/navigation-menu) for site navigation with links and disclosure panels.

## Differences from Volt and limitations

The submenu `ng-template` must be declared inside its parent `qzMenu` so it resolves the parent menu service. Labels are plain elements; Quartz does not add visual separators or headings.
