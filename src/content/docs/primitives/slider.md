---
title: Slider
description: 'A single-thumb headless slider: deterministic decimal stepping, WAI-ARIA keyboard, Pointer Events with capture, RTL and vertical geometry, a user-only committed output and an Angular Forms adapter.'
group: Primitives
order: 116
---

## At a glance

- **API** — qzSlider, qzSliderTrack, qzSliderRange, qzSliderThumb
- **Keyboard** — Arrows, Home/End, PageUp/PageDown (WAI-ARIA Slider)
- **Pointer** — Track press and drag with pointer capture; cancel, lost capture, disable and destroy all end the gesture
- **Forms** — `SliderControlDirective`, value `number`
- **CLI** — pnpm quartz add slider

## Imports

```ts
import {
  SliderDirective,
  SliderTrackDirective,
  SliderRangeDirective,
  SliderThumbDirective,
} from '@quartz-headless/primitives';
import { SliderControlDirective } from '@quartz-headless/primitives/forms'; // optional Forms adapter
```

## Minimal template

```html
<div qzSlider [(value)]="volume" [min]="0" [max]="100" [step]="1" class="relative h-8">
  <div qzSliderTrack class="absolute inset-x-0 top-1/2 h-2 bg-gray-200">
    <div qzSliderRange class="h-full bg-blue-500" [style.width]="'var(--qz-slider-percent)'"></div>
  </div>
  <button
    qzSliderThumb
    aria-label="Volume"
    class="absolute top-1/2 size-5"
    [style.left]="'calc(var(--qz-slider-percent) - 10px)'"
  ></button>
</div>
```

Quartz sets `type="button"`, `role="slider"` and all ARIA on the thumb. **You name the thumb** (`aria-label`, `aria-labelledby` or text); Quartz never invents a name and warns in development when one is missing.

## Inputs and outputs

| Name                   | Kind                     | Notes                                                                                          |
| ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `value`                | `model<number>`          | The value. Shown normalized; the model is rewritten with the normalized value on user changes. |
| `min` / `max` / `step` | inputs                   | Defaults `0` / `100` / `1`. May change at any time.                                            |
| `orientation`          | `horizontal \| vertical` | Default `horizontal`.                                                                          |
| `disabled`             | boolean input            | Also set by a disabled Forms control.                                                          |
| `valueText`            | `(value) => string`      | Feeds `aria-valuetext`.                                                                        |
| `dragging`             | `model<boolean>`         | `true` during a pointer gesture.                                                               |
| `valueChangeCommitted` | output `number`          | **User changes only** — see below.                                                             |

## Numeric contract

Every value (model write, key step, pointer position) goes through one normalization:

- Non-finite `min`/`max` fall back to `0`/`100`; swapped bounds are swapped back; `min == max` pins the value to `min` (percent `0`).
- A `step` that is not a positive finite number is `1`.
- The value grid is `min + n × step` **plus `max` itself**, so `0..10` step `3` offers `0, 3, 6, 9, 10`. `Home`/`End` always reach `min`/`max`.
- Arithmetic is done on integers scaled by the decimal places of `min` and `step`, so ten `0.1` steps from `0` land exactly on `1`, never `0.9999999999999999`.
- `NaN` becomes `min`; `±Infinity` clamps to the matching bound; negative and non-zero-minimum ranges work the same way.

## Committed value (what Forms listens to)

`valueChangeCommitted` emits the new value **once per user change**: each key step that changes the value, and each new value reached while dragging (continuous, not only on release). It is silent for programmatic `value` writes and for repeated gestures that land on the same value. The pointer **wins during a drag**: an external write to `value` applies immediately, and the next `pointermove` of the active gesture overwrites it.

## Keyboard

| Key                   | Action                                                     |
| --------------------- | ---------------------------------------------------------- |
| ArrowRight / ArrowUp  | +1 step (ArrowRight is −1 step in a horizontal RTL slider) |
| ArrowLeft / ArrowDown | −1 step (ArrowLeft is +1 step in a horizontal RTL slider)  |
| PageUp / PageDown     | ± a tenth of the range, never less than one step           |
| Home / End            | `min` / `max`                                              |

Handled keys call `preventDefault()`, so the page does not scroll. Vertical sliders keep Left/Right usable. Disabled sliders ignore all keys and pointers.

## Pointer behaviour

Pressing the track focuses the thumb, sets the value under the pointer and starts a gesture with pointer capture, so the drag continues outside the element. The gesture ends on `pointerup`, `pointercancel`, `lostpointercapture`, when the slider becomes disabled, and when it is destroyed; `data-qz-dragging` never outlives it. Geometry is read on every pointer event, so resizing, orientation and RTL changes apply immediately. Only the primary button starts a gesture. Quartz sets `touch-action: none` on the root so touch drags are not turned into scrolls.

## RTL and vertical

Horizontal RTL mirrors both pointer geometry (the minimum is on the right) and the Left/Right keys. Vertical sliders measure from the bottom up. Position the thumb with logical or physical CSS yourself, from `--qz-slider-percent`.

## Accessibility

`role="slider"` on the thumb with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, optional `aria-valuetext`, `aria-orientation` and `aria-disabled`. The thumb is one tab stop; the track is not focusable. Automated axe scans of default and interacted states are clean (Chromium, Firefox, WebKit); manual screen-reader testing has not been performed.

## Angular Forms

`SliderControlDirective` attaches to `[qzSlider]` with `formControl`, `formControlName` or `ngModel`. Value: `number`. `onChange` fires once per `valueChangeCommitted`; `writeValue` is silent; `null` / non-numbers (e.g. `reset()`) show the slider at `min`; touched fires when focus leaves the slider; `setDisabledState` disables it. See [Angular Forms adapters](/docs/guides/angular-forms).

## Styling hooks

On the root: `--qz-slider-percent` (0–100%), `--qz-slider-value`, `data-qz-orientation`, `data-qz-disabled`, `data-qz-dragging`. On the thumb: `data-qz-orientation`, `data-qz-disabled`. Track and range carry `data-qz-slider-track` / `data-qz-slider-range`. Quartz ships no colors, sizes or motion.

## Known limitations

One thumb only — use [RangeSlider](/docs/primitives/range-slider) for a range. No tick marks or value tooltip. `valueChangeCommitted` is continuous while dragging; if you need an on-release value, read `dragging`.

## Migration from 0.10

Additive. The model, selectors and CSS variable are unchanged. Changes to check: the grid now includes `max` (previously `End` on an uneven range stopped at the last multiple of `step`), `NaN`/`Infinity` writes clamp, an invalid `step` is `1`, and `touch-action: none` is applied to the root.

## Playground

::playground[quartz-slider]

## Live examples

::demo[slider]
