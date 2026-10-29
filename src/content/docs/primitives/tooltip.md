---
title: Tooltip
description: 'Accessible, hover/focus tooltip with configurable placement, delays, and rich templates. Built on the same overlay engine as dialogs and menus.'
group: Primitives
order: 102
---

## At a glance

- **Hover & Focus** — Opens on mouseenter or focus
- **12 Placements** — All overlay positions supported
- **Rich Templates** — HTML content via ng-template
- **Accessible** — aria-describedby wiring

## Live examples

::demo[tooltip]

## Code

### Text Tooltip

```html
<!-- Text tooltip -->
<button qzTooltip="Save changes" tooltipPlacement="top" type="button">Save</button>
```

### Placement

```html
<!-- Try different placements -->
<button qzTooltip="Above" tooltipPlacement="top">Top</button>
<button qzTooltip="Below" tooltipPlacement="bottom">Bottom</button>
<button qzTooltip="Before" tooltipPlacement="left">Left</button>
<button qzTooltip="After" tooltipPlacement="right">Right</button>
```

### Rich Template

```html
<!-- Rich HTML tooltip via template -->
<button [qzTooltip]="statsTpl" tooltipPlacement="bottom">View Stats</button>

<ng-template #statsTpl>
  <div class="tooltip-rich"><strong>42</strong> new views today</div>
</ng-template>
```

### Need interactive content?

```html
<!-- A tooltip with focusable/interactive content (links, buttons) violates the
     WAI-ARIA tooltip pattern — role="tooltip" must never receive focus or stay
     open while the pointer moves into it. Use Popover for that case instead: -->
<button qzPopoverTrigger [popover]="details" type="button">Learn more</button>

<ng-template #details>
  <div qzPopover class="popover">
    <a href="/docs">Read the docs</a>
  </div>
</ng-template>
```

### Delay

```html
<!-- Customize show/hide delay -->
<button qzTooltip="Fast feedback" tooltipPlacement="top" [tooltipDelay]="0" [tooltipHideDelay]="0">
  Instant
</button>

<button
  qzTooltip="Slow and steady"
  tooltipPlacement="top"
  [tooltipDelay]="800"
  [tooltipHideDelay]="400"
>
  Delayed
</button>
```

## Arrow geometry

Quartz computes where a consumer-rendered arrow goes; it renders no arrow and no colors. Opt in with `tooltipArrowSize` (the arrow's length in px along the tooltip edge) and optionally `tooltipArrowPadding`.

::demo[tooltip-arrow]

::playground[quartz-tooltip-arrow]

```html
<button
  qzTooltip="Save changes"
  tooltipPlacement="top"
  [tooltipArrowSize]="8"
  [tooltipArrowPadding]="6"
  #tip="qzTooltip"
>
  Save
</button>
```

The tooltip element then carries `data-side` (the side of the anchor it sits on after any flip), `data-placement` (resolved, physical placement), `--qz-arrow-x` / `--qz-arrow-y` (px offset of the arrow's start edge) and `data-qz-arrow="hidden"` when no safe position exists:

```css
.qz-tooltip[data-side='top']::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: var(--qz-arrow-x);
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  background: inherit;
}
.qz-tooltip[data-qz-arrow='hidden']::after {
  display: none;
}
```

The directive exposes `arrow()` (an `OverlayArrowGeometry` or `null`) and `resolvedPlacement()`. `TemplateRef` content receives the same values as signals in its context:

```html
<ng-template #tpl let-arrow="arrow" let-placement="placement">
  <div>
    Hint ({{ placement() }}) @if (arrow()?.available) { <i [style.left.px]="arrow()!.offset"></i> }
  </div>
</ng-template>
```

`arrow().offset` is the distance from the surface's start edge (left for top/bottom placements, top for left/right) to the arrow's start edge; `centerOffset` is relative to the surface center; `edge` is the surface edge facing the anchor. The arrow stays centered on the anchor, clamped inside the surface by `padding`; it is `available: false` (offsets `null`, never `NaN`) when it plus its padding does not fit, or the anchor no longer overlaps the tooltip. Geometry updates after flip, viewport shift, anchor or tooltip resize and window resize; tooltips still close on scroll. With no arrow size nothing is added.

Resolved `-start`/`-end` placements are physical: in RTL a requested `top-start` resolves to `top-end`.

## Tooltip vs Popover

A tooltip is a non-interactive description (`role="tooltip"`, `aria-describedby`, hover/focus, Escape) and must not contain focusable content. Use [Popover](/docs/primitives/popover) for interactive surfaces.

## Differences from Volt and limitations

No visual arrow markup or colors are provided, and no Floating UI dependency is used. Template tooltips are positioned by Overlay; text tooltips use the same positioning function and are re-measured on resize.
