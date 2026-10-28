---
title: Progress
description: Accessible progressbar semantics for work moving toward completion.
group: Primitives
order: 105
---

Progress measures movement toward completion. Use native `<progress>` when its built-in semantics and rendering fit your use case; Quartz is useful when you need a composed, fully consumer-styled indicator.

## Live demo

::demo[progress]

::playground[quartz-progress]

## Installation and imports

```sh
pnpm quartz add progress
```

```ts
import {
  ProgressDirective,
  ProgressTrackDirective,
  ProgressIndicatorDirective,
} from '@quartz-headless/primitives';
```

## Accessible usage

```html
<div qzProgress [value]="uploadPercent" aria-label="Upload" aria-valuetext="Upload is 40 percent">
  <div qzProgressTrack><div qzProgressIndicator></div></div>
</div>
```

The root exposes `role="progressbar"`, minimum and maximum values, and a clamped `aria-valuenow` for determinate work. A `null`, NaN, or infinite value is indeterminate and omits `aria-valuenow`; it does not invent a percentage. Bounds that are non-finite use 0/100 defaults. A maximum that is not greater than the minimum is repaired to `min + 1`, with 0/100 as the safe fallback if that repair would overflow. Values outside the range clamp to its nearest bound. Updates are signal-driven. Supply an accessible name with `aria-label` or `aria-labelledby`; the progressbar's descendants are presentational to assistive technology.

The indicator exposes `--qz-progress-percent` and `data-qz-state`; track and indicator parts expose `data-qz-part`. Quartz adds no visual CSS. There are no keyboard interactions. For SSR, avoid deriving the initial value from browser-only state to keep hydration output stable. Source-copy installation is available through the CLI; check the API reference for all inputs.
