---
title: Meter
description: Accessible scalar measurement within a meaningful range.
group: Primitives
order: 106
---

Meter describes a current measurement in a known range; it does not measure progress toward completion. Use native `<meter>` when its built-in semantics and visual presentation work for your application.

## Live demo

::demo[meter]

::playground[quartz-meter]

## Installation and imports

```sh
pnpm quartz add meter
```

```ts
import {
  MeterDirective,
  MeterTrackDirective,
  MeterIndicatorDirective,
} from '@quartz-headless/primitives';
```

## Accessible usage

```html
<div qzMeter [value]="storageUsed" [min]="0" [max]="100" aria-label="Storage used">
  <div qzMeterTrack><div qzMeterIndicator></div></div>
</div>
```

The root exposes `role="meter"`, `aria-valuemin`, `aria-valuemax`, a clamped `aria-valuenow`, and optional `aria-valuetext`. Non-finite bounds use 0/100 defaults; invalid ranges become `[min, min + 1]`, with 0/100 as a safe fallback if that would overflow; non-finite values use the minimum. Dynamic inputs update immediately. Provide a name with `aria-label` or `aria-labelledby`. Meter has no keyboard behavior. Styling hooks are `--qz-meter-percent`, `data-qz-value`, and `data-qz-part`. Keep initial values stable across SSR and hydration. CLI source-copy usage is `pnpm quartz add meter`; see the API reference for inputs.
