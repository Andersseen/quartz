---
title: Slider
description: 'A single-thumb headless slider with normalization, keyboard support, Pointer Events, RTL mapping and geometry CSS variables.'
group: Primitives
order: 116
---

## At a glance

- **API** — qzSlider, qzSliderTrack, qzSliderRange, qzSliderThumb
- **Keyboard** — Arrows, Home/End, PageUp/PageDown
- **Pointer** — Track press and drag via pointer capture
- **CLI** — pnpm quartz add slider

## Playground

::playground[quartz-slider]

## Live examples

::demo[slider]

## Code

### Basic, decimal, vertical, RTL and disabled

```ts
volume = signal(50);

<div qzSlider [(value)]="volume" [min]="0" [max]="100" [step]="1">
  <div qzSliderTrack>
    <div qzSliderRange></div>
    <button qzSliderThumb aria-label="Volume"></button>
  </div>
</div>
```
