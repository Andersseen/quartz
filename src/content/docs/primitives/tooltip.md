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

## Styling text tooltips

A string tooltip (`qzTooltip="…"`) is rendered by Quartz as a `div` appended to `document.body`, so style it globally, not from the host component's encapsulated styles. Quartz sets only behavioural inline styles (`position: fixed`, `top`/`left`, `transform`, `z-index: 9999`, `pointer-events: none`, `visibility` while measuring); everything visual is yours. Stable hooks:

| Hook                              | Use                                                                     |
| --------------------------------- | ----------------------------------------------------------------------- |
| `.qz-tooltip`                     | Class on every text tooltip                                             |
| `[data-qz-tooltip]`               | Attribute on every text tooltip (use it if `.qz-tooltip` clashes)       |
| `[role='tooltip']`                | ARIA role; also present on template tooltips' root element              |
| `[data-side]`, `[data-placement]` | Resolved side/placement after flip (with `tooltipArrowSize`, see below) |

```css
/* styles.css — global, uses your design tokens */
:root {
  --tooltip-bg: var(--color-neutral-900, #111827);
  --tooltip-fg: var(--color-neutral-50, #f9fafb);
  --tooltip-radius: var(--radius-sm, 6px);
  --tooltip-font: var(--text-xs, 0.75rem);
  --tooltip-shadow: var(--shadow-md, 0 4px 12px rgb(0 0 0 / 0.15));
}

[data-qz-tooltip] {
  max-width: 16rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--tooltip-radius);
  background: var(--tooltip-bg);
  color: var(--tooltip-fg);
  font-size: var(--tooltip-font);
  line-height: 1.4;
  box-shadow: var(--tooltip-shadow);
}

@media (prefers-color-scheme: dark) {
  :root {
    --tooltip-bg: var(--color-neutral-100, #f3f4f6);
    --tooltip-fg: var(--color-neutral-900, #111827);
  }
}
```

Do not override `position`, `transform` or `visibility`: positioning writes them. `z-index` can be raised from your stylesheet only with `!important` because it is inline.

## Pressing the trigger

Pressing the trigger (`pointerdown`) hides the tooltip at once and keeps it hidden while the pointer stays on the trigger, so a button that opens a dialog does not leave its tooltip above the backdrop. It shows again when the pointer leaves and re-enters, or on a new focus after focus has left the trigger (keyboard, focus return). Focus moving into a modal (`aria-modal="true"` or a modal `<dialog>`) and the window losing focus also close it. `show()` called programmatically is not affected.

## Tooltip vs Popover

A tooltip is a non-interactive description (`role="tooltip"`, `aria-describedby`, hover/focus, Escape) and must not contain focusable content. Use [Popover](/docs/primitives/popover) for interactive surfaces.

## Differences from Volt and limitations

No visual arrow markup or colors are provided, and no Floating UI dependency is used. Template tooltips are positioned by Overlay; text tooltips use the same positioning function and are re-measured on resize.
