---
title: Angular Forms adapters
description: Opt-in ControlValueAccessor directives for Checkbox, Switch, RadioGroup, Select, Listbox, Combobox, Slider, RangeSlider, Toggle and ToggleGroup.
group: Guides
order: 13
---

Forms support lives in a secondary entry point so consumers who only use signals never pull in `@angular/forms`:

```ts
import { ReactiveFormsModule } from '@angular/forms';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

@Component({
  imports: [ReactiveFormsModule, SelectDirective /* … */, ...QUARTZ_FORMS],
  template: `<div qzSelect formControlName="country">…</div>`,
})
export class Settings {}
```

Adapters attach only where a Forms directive (`formControl`, `formControlName`, `ngModel`) is bound; signal-only usage is unchanged.

## Contract

1. `writeValue` is **silent**: it updates the model, never emits a committed event, and does not dirty the control.
2. A user action calls `onChange` **exactly once** with the public value; re-selecting the current value is not a change.
3. `onTouched` fires when focus really leaves the control (not when it moves between inner items).
4. `setDisabledState` blocks interaction and closes an open popup; the `disabled` input is not overwritten.

## Values per control

| Adapter     | Form value                                                  | `reset()` / `null`                     |
| ----------- | ----------------------------------------------------------- | -------------------------------------- |
| Checkbox    | `true`, `false`, `'indeterminate'`                          | `false`                                |
| Switch      | `boolean`                                                   | `false`                                |
| RadioGroup  | checked radio value                                         | `null` (none)                          |
| Select      | option value; with `multiple` an array (`[]` when emptied)  | `null` shown as empty                  |
| Listbox     | value, or array with `multiple`                             | `null` = none                          |
| Combobox    | committed selection (never the text); array with `multiple` | clears selection **and** text silently |
| Slider      | `number`                                                    | shown at `min`; control keeps `null`   |
| RangeSlider | `{ low: number; high: number }` (object, not a tuple)       | full `min..max` range shown            |
| Toggle      | `boolean`                                                   | `false`                                |
| ToggleGroup | single: item value or `null`; multiple: array               | nothing pressed; control keeps `null`  |

For a multiple Select/Combobox, an emptied selection is `[]`; `reset()` writes `null`, which is displayed as empty and kept on the control until the user commits a change.

## Sliders, Toggle and ToggleGroup

Slider and RangeSlider commit **continuously**: `onChange` fires for every key step and every new value reached while dragging, never for a repeat of the same value. Toggle and ToggleGroup commit once per activation. Touched fires on blur (Toggle) or when focus leaves the control (Slider, RangeSlider, ToggleGroup — moving between a range slider's two thumbs does not touch it). Moving focus inside a ToggleGroup never commits. RangeSlider's value is `{ low, high }`; Volt's `[low, high]` tuple needs a one-line mapping (see [RangeSlider](/docs/primitives/range-slider)).

## Combobox: text versus value

The text in the input is a query. Typing does not notify Forms. Forms is notified when the **selection** changes through a user action: an option is chosen or deselected, a freeform value is committed, or editing the text clears a previously selected value.

## Strict templates

All adapters compile under `strictTemplates` against the installed tarball (verified by the consumer smoke test in CI).
