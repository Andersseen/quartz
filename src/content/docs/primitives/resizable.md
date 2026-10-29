---
title: Resizable
description: 'Resizable panels on the Core Splitter: a keyboard- and pointer-operable separator with ARIA values, clamping, RTL mirroring and observable resizing state.'
group: Primitives
order: 103
---

Quartz does not ship a second resizing engine. **Resizable** is the Core [Splitter](/docs/core/splitter): `qzSplitterContainer`, `qzSplitterPanel` and `qzSplitterHandle`. The Splitter is the behavior (position, constraints, input, ARIA); any visual resizable layout is yours.

## Live demo

::demo[resizable]

::playground[quartz-resizable]

## Installation and imports

```sh
pnpm quartz add resizable   # alias of: pnpm quartz add splitter
```

```ts
import {
  SplitterContainerDirective,
  SplitterPanelDirective,
  SplitterHandleDirective,
} from '@quartz-headless/core';
```

## Accessible usage

```html
<div
  qzSplitterContainer
  orientation="horizontal"
  [minSize]="20"
  [maxSize]="80"
  [step]="5"
  [defaultPosition]="40"
  (positionChange)="size.set($event)"
>
  <div qzSplitterPanel>Navigator</div>
  <div qzSplitterHandle aria-label="Resize navigator"></div>
  <div [qzSplitterPanel]="false">Editor</div>
</div>
```

The handle is `role="separator"` and stays in the Tab order. Give it a name with `aria-label` or `aria-labelledby`. It exposes `aria-valuemin`, `aria-valuemax` and `aria-valuenow`. Per WAI-ARIA, `aria-orientation` describes the separator's own axis: a `horizontal` container lays panels out in a row, so its separator is a _vertical_ bar (`aria-orientation="vertical"`), and a `vertical` container has a horizontal separator.

## Units and constraints

Every size is a **percentage (0–100) of the container's main-axis size** taken by the primary panel; the secondary panel takes the remainder (`flex: 1 1 0%`), so a handle with thickness never overflows it. `minSize`/`maxSize` bound the primary panel; the secondary panel's minimum is therefore `100 - maxSize`. Pixel constraints are not supported and are not interchangeable with these. `step` is the keyboard increment and the snapping unit. Non-finite inputs fall back to the defaults, `maxSize` is raised to `minSize` when smaller, and the current position is re-clamped whenever bounds change. A collapsed container (zero size) leaves the position unchanged. The model is two panels; nest containers for more regions.

## Inputs, outputs and state

| API                                             | Meaning                                                  |
| ----------------------------------------------- | -------------------------------------------------------- |
| `orientation`                                   | `horizontal` (row) or `vertical` (column)                |
| `minSize`, `maxSize`, `step`, `defaultPosition` | percent bounds, increment and initial value              |
| `disabled`                                      | blocks pointer and keyboard; handle gets `aria-disabled` |
| `positionChange`, `dragStart`, `dragEnd`        | outputs                                                  |
| `splitterService.position()` / `resizing()`     | signals; `resizing` is `true` during a drag              |
| `data-qz-resizing`                              | on the container and handle while dragging               |

## Keyboard

| Key                | Horizontal           | Vertical          |
| ------------------ | -------------------- | ----------------- |
| Arrow Right / Down | grow primary (LTR)   | grow primary      |
| Arrow Left / Up    | shrink primary (LTR) | shrink primary    |
| Home / End         | minimum / maximum    | minimum / maximum |

In RTL the horizontal axis mirrors: Arrow Left grows the primary panel, which sits on the right. Cross-axis arrows are ignored and keep their browser behavior.

## Pointer

The handle uses Pointer Events with native pointer capture. `pointerup`, `pointercancel` and `lostpointercapture` all end the drag; events from other pointers are ignored (a second finger cannot steal a drag); only the primary button starts it. Destroying the handle mid-drag releases capture and clears the state. Each container owns its own service, so splitters never affect each other. No document-wide listeners are installed.

## RTL

The writing direction is resolved from the container (`dir` attribute or inherited). Pointer positions are measured from the right edge and horizontal arrows mirror. The vertical axis is unaffected.

## Styling

Quartz applies only structural styles (flex layout, panel sizes, `touch-action: none`, cursor). Give the handle a thickness and a visible focus style:

```css
[qzSplitterHandle]:focus-visible {
  outline: 2px solid;
}
.qz-splitter-container--dragging [qzSplitterHandle] {
  background: currentColor;
}
```

## Splitter vs a visual resizable layout

The Splitter provides state and semantics; Volt's `resizable` also renders panels with a visual grip. Reproduce that styling in your CSS. There is no panel collapse, persistence or arbitrary N-panel group in this milestone.

## SSR

Nothing touches the DOM at import time. The position is deterministic from `defaultPosition`; pointer capture and geometry are only read in the browser.
