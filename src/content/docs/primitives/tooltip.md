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
