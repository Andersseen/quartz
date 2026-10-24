---
title: Overlay
description: 'Portal-based positioning system with smart auto-flip, click-outside handling, and scroll management. Build dropdowns, popovers, and menus with full control.'
group: Core
order: 31
---

## At a glance

- **12 Placements** — All position combinations
- **Auto-flip** — Smart viewport detection
- **Click Outside** — Automatic close handling
- **Scroll Close** — Close on scroll option

## Live examples

::demo[overlay]

## Code

### Menu Dropdown

```html
<button qzOverlayTrigger [overlayTemplate]="dropdownTpl" placement="bottom-start">Open menu</button>

<ng-template #dropdownTpl>
  <div class="dropdown">
    <button class="dropdown__item">Edit</button>
    <button class="dropdown__item">Delete</button>
  </div>
</ng-template>
```

### Auto-flip & Placements

```html
<button qzOverlayTrigger [overlayTemplate]="popoverTpl" placement="top" [flip]="true">Open</button>
```

### Select / Combobox

```html
<button
  qzOverlayTrigger
  [overlayTemplate]="selectTpl"
  placement="bottom-start"
  [matchAnchorWidth]="true"
>
  Select option
</button>
```

### Hover Tooltips

```html
<!-- Hover tooltip via TooltipDirective -->
<span qzTooltip="Save changes" tooltipPlacement="top"> 💾 </span>

<!-- Template-based tooltip -->
<button [qzTooltip]="statsTpl" tooltipPlacement="bottom">View Stats</button>
```

### Programmatic Usage

```ts
const overlayRef = this.overlayService.create(templateRef, viewContainerRef, anchorElement, {
  placement: 'bottom-start',
  offset: 8,
});

overlayRef.open();
```
