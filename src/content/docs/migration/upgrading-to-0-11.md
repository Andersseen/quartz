---
title: Migrating 0.10 to 0.11
description: Additive changes in 0.11 (RangeSlider, Forms adapters for Slider/Toggle/ToggleGroup, allowDeselection) and the few behaviours to check.
group: Migration
order: 952
---

0.11 is additive: existing exports and selectors are unchanged. `@quartz-headless/primitives` now peers on `@quartz-headless/core@^0.11.0`.

## New

- **RangeSlider**: `qzRangeSlider`, `qzRangeSliderTrack`, `qzRangeSliderRange`, `qzRangeSliderThumb="low|high"`, `RangeSliderValue`.
- **Committed outputs** (user changes only): `SliderDirective.valueChangeCommitted`, `ToggleGroupDirective.valueChangeCommitted`, `RangeSliderDirective.valueChangeCommitted`.
- **ToggleGroup**: `allowDeselection` (single mode).
- **Forms**: `SliderControlDirective`, `RangeSliderControlDirective`, `ToggleControlDirective`, `ToggleGroupControlDirective` (all in `QUARTZ_FORMS`). The CLI copies the primitives, not the Forms entry point.
- `isDisabled` / `setFormDisabled()` on Slider, Toggle, ToggleGroup and RangeSlider.

## Behaviour to check

| Area                           | Change                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Slider grid                    | `max` is always a valid value (`0..10` step `3` reaches `10`); `NaN` → `min`, `±Infinity` → bound; invalid step → `1`. |
| Slider decimals                | Stepping uses scaled integers; repeated `0.1` steps no longer drift.                                                   |
| Slider touch                   | `touch-action: none` is now set on the root. Only the primary button starts a drag.                                    |
| Slider lifecycle               | Disabling, `pointercancel`, `lostpointercapture` and destroy end the gesture and clear `data-qz-dragging`.             |
| Slider thumb name              | Development builds warn when a thumb has no accessible name.                                                           |
| ToggleGroup `isPressed`        | Mode-aware: an array in single mode (or a scalar in multiple mode) no longer shows items pressed.                      |
| ToggleGroup `aria-orientation` | Removed from the `role="group"` host (not allowed there). Use `data-qz-orientation`.                                   |
| ToggleGroup deselection        | Unchanged by default (`allowDeselection` is `true`); set `false` for a no-empty single group.                          |
