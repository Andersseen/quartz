---
title: Splitter
description: 'Resizable panel system with keyboard navigation, touch support, and flexible constraints. Perfect for IDE-style layouts and dashboards.'
group: Core
order: 34
---

## At a glance

- **Horizontal & Vertical** — Both orientations
- **Keyboard Nav** — Arrow keys, Home, End
- **Touch Support** — Mobile friendly
- **Constraints** — Min/max size limits

## Live examples

::demo[splitter]

## Code

### Horizontal Splitter

```html
<div
  qzSplitterContainer
  orientation="horizontal"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="40"
  (positionChange)="onPositionChange($event)"
>
  <div qzSplitterPanel="true">Panel A</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Panel B</div>
</div>
```

### Vertical Splitter

```html
<div
  qzSplitterContainer
  orientation="vertical"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="55"
>
  <div qzSplitterPanel="true">Top Panel</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Bottom Panel</div>
</div>
```

## Resizable behavior

The Splitter backs the **Resizable** pattern; see [Resizable](/docs/primitives/resizable) for units (percent of the container), the ARIA contract (`aria-orientation` is the separator's own axis), RTL mirroring, `disabled`, the `resizing` state and the pointer lifecycle (`pointerup`, `pointercancel` and `lostpointercapture` end a drag).
