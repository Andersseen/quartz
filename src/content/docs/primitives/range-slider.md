---
title: RangeSlider
description: 'A two-thumb headless range slider with coordinated low/high state, non-crossing thumbs, minimum distance, nearest-thumb track press, RTL and vertical geometry, and an Angular Forms adapter with a { low, high } value.'
group: Primitives
order: 121
---

## At a glance

- **API** — qzRangeSlider, qzRangeSliderTrack, qzRangeSliderRange, qzRangeSliderThumb="low" | "high"
- **Model** — `[(low)]` and `[(high)]`; combined value `{ low, high }`
- **Constraints** — thumbs never cross; optional `minDistance`
- **Forms** — `RangeSliderControlDirective`, value `{ low: number; high: number }`
- **CLI** — pnpm quartz add range-slider (also copies the `slider` folder it builds on)

## Imports

```ts
import {
  RangeSliderDirective,
  RangeSliderTrackDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  type RangeSliderValue,
} from '@quartz-headless/primitives';
import { RangeSliderControlDirective } from '@quartz-headless/primitives/forms'; // optional
```

## Minimal template

```html
<div
  qzRangeSlider
  [(low)]="min"
  [(high)]="max"
  [min]="0"
  [max]="500"
  [minDistance]="10"
  class="relative h-8"
>
  <div qzRangeSliderTrack class="absolute inset-x-0 top-1/2 h-2 bg-gray-200">
    <div
      qzRangeSliderRange
      class="absolute h-full bg-blue-500"
      [style.left]="'var(--qz-range-low-percent)'"
      [style.width]="'var(--qz-range-size-percent)'"
    ></div>
  </div>
  <button
    qzRangeSliderThumb="low"
    aria-label="Minimum price"
    class="absolute top-1/2 size-5"
  ></button>
  <button
    qzRangeSliderThumb="high"
    aria-label="Maximum price"
    class="absolute top-1/2 size-5"
  ></button>
</div>
```

Each thumb needs its own accessible name; Quartz warns in development when one is missing. The root and track are not tab stops: Tab visits the low thumb, then the high thumb (DOM order).

## Inputs and outputs

| Name                   | Kind                                 | Notes                                                       |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------- |
| `low` / `high`         | `model<number>`                      | Defaults `0` / `100`.                                       |
| `min` / `max` / `step` | inputs                               | Same numeric contract as [Slider](/docs/primitives/slider). |
| `minDistance`          | input, default `0`                   | Smallest allowed `high − low`; clamped to `0..(max − min)`. |
| `orientation`          | `horizontal \| vertical`             |                                                             |
| `disabled`             | boolean input                        | Disables both thumbs; also set by a disabled Forms control. |
| `valueText`            | `(value, 'low' \| 'high') => string` | Feeds each thumb's `aria-valuetext`.                        |
| `dragging`             | `model<boolean>`                     |                                                             |
| `valueChangeCommitted` | output `{ low, high }`               | **User changes only**, once per change.                     |

## Value model

The canonical value is the object `{ low, high }` (`RangeSliderValue`), used by `valueChangeCommitted` and by Forms. The two-way models are `low` and `high`. Quartz never uses a tuple.

**Invariants.** Both values are snapped to the step grid inside `min..max`, `low ≤ high`, and `high − low ≥ minDistance`. When an external write breaks them (e.g. `low` 90, `high` 30), **`high` wins** and `low` is pulled back (at `min`, `high` is pushed up instead). A **user action moves only the thumb it targets**, clamped against the other; a thumb never drags the other one along. Dynamic `min`, `max`, `step` and `minDistance` are re-applied immediately.

## Keyboard

Each thumb is independently focusable and uses the [Slider keys](/docs/primitives/slider#keyboard) (Arrows, PageUp/PageDown, Home/End, RTL mapping). A key can never produce an invalid range: the low thumb stops at `high − minDistance`, the high thumb at `low + minDistance`. For accessibility each thumb's `aria-valuemin` / `aria-valuemax` reflect that other-thumb limit.

## Pointer behaviour

- Pressing **on a thumb** grabs that thumb.
- Pressing **the track** grabs the **nearest** thumb by value distance and moves it to the pointer. Ties go to `low`; when the thumbs coincide, the side of the pointer decides (a coincident pair at `max` can only be moved by `low`).
- The gesture uses pointer capture and ends on release, `pointercancel`, `lostpointercapture`, disabling and destroy. `data-qz-dragging` is set on the root and on the grabbed thumb only.
- An external write during a drag applies immediately; the next `pointermove` of the grabbed thumb overrides it.

## RTL and vertical

Horizontal RTL mirrors pointer geometry and the Left/Right keys; vertical measures bottom-up. Because the percentages are logical (distance from the minimum end), use logical CSS (`inset-inline-start`) or flip them yourself.

## Accessibility

Two `role="slider"` thumbs with distinct names, `aria-valuenow`, `aria-valuemin`/`aria-valuemax` coordinated with the other thumb, `aria-valuetext` (from `valueText`), `aria-orientation` and `aria-disabled`. Focus visibility is yours to style (`:focus-visible`). Automated axe scans pass in Chromium, Firefox and WebKit; manual screen-reader testing has not been performed.

## Angular Forms

`RangeSliderControlDirective` (`[qzRangeSlider]` + `formControl` / `formControlName` / `ngModel`). Value `{ low: number; high: number }`. `writeValue` is silent; `null` / `undefined` (e.g. `reset()`) show the full `min..max` range; other shapes are ignored. `onChange` fires once per `valueChangeCommitted`; touched fires when focus leaves the control (moving between the two thumbs does not touch it).

**Volt UI mapping.** Volt's `volt-range-slider` has `low` / `high` inputs and a CVA value of `[low, high]`. Map with `value => ({ low: value[0], high: value[1] })` and back; Volt ignores a `null` write, Quartz resets to the full range.

## Styling hooks

Root: `--qz-range-low-percent`, `--qz-range-high-percent`, `--qz-range-size-percent` (high − low), `--qz-range-low`, `--qz-range-high`, `data-qz-orientation`, `data-qz-disabled`, `data-qz-dragging`. Thumbs: `--qz-range-thumb-percent`, `data-qz-range-thumb="low|high"`, `data-qz-dragging`, `data-qz-disabled`. Fill: `data-qz-range-slider-range`. No colors, sizes or motion are included, and `touch-action: none` is set on the root.

## Known limitations

Two thumbs only (no N-thumb slider); no ticks; the fill/thumb layout is yours. The pointer press chooses the nearest thumb by value, not by DOM overlap.

## Playground

::playground[quartz-range-slider]

## Live examples

::demo[range-slider]
