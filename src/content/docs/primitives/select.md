---
title: Select
description: 'A button-triggered select (single or multiple, with groups) that renders a WAI-ARIA listbox popup with Quartz-owned keyboard, dismissal and positioning.'
group: Primitives
order: 106
---

## At a glance

- **Keyboard** — Enter, Space, arrows, Home/End, Escape, Tab and type-ahead
- **Values** — Strings or objects with compareWith and displayWith; single or `multiple` arrays
- **Popup** — Overlay placement, flip and trigger-width matching
- **CLI** — pnpm quartz add select

## Imports

```ts
import {
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  // 0.10: groups and separators
  SelectGroupDirective,
  SelectGroupLabelDirective,
  SelectSeparatorDirective,
} from '@quartz-headless/primitives';
import { SelectControlDirective } from '@quartz-headless/primitives/forms'; // optional Forms adapter
```

## Multiple selection and groups

Set `multiple` and bind `values` (an array) instead of `value`. Toggling an option keeps the popup open unless you set `closeOnSelect` explicitly. Groups are labelled `role="group"` regions; group labels and separators are not options, so the keyboard and typeahead never land on them.

```html
<div qzSelect multiple #s="qzSelect" [(values)]="fruits" [closeOnSelect]="false">
  <button qzSelectTrigger aria-label="Fruit">{{ s.selectedLabel() || 'Pick fruit' }}</button>
  <ng-template qzSelectContent>
    <div qzSelectListbox>
      <div qzSelectGroup>
        <div qzSelectGroupLabel>Citrus</div>
        <button qzSelectOption="lemon">Lemon</button>
        <button qzSelectOption="lime" qzSelectOptionDisabled>Lime</button>
      </div>
      <div qzSelectSeparator></div>
      <div qzSelectGroup>
        <div qzSelectGroupLabel>Berries</div>
        <button qzSelectOption="blueberry">Blueberry</button>
      </div>
    </div>
  </ng-template>
</div>
```

::playground[quartz-select]

## Value contract

| Concept            | Single                                      | Multiple                                               |
| ------------------ | ------------------------------------------- | ------------------------------------------------------ |
| Model              | `value: T \| null`                          | `values: readonly T[]` (controlled: write a new array) |
| User commit output | `valueChangeCommitted(T)` — once per change | `valuesChangeCommitted(T[])` — once per toggle         |
| Every selection    | `selected(T)`                               | `selected(T)` (the toggled option)                     |
| Label              | `selectedLabel()`                           | `selectedLabel()` joins `selectedLabels()` with `, `   |
| Empty              | `isEmpty()` / `data-qz-placeholder`         | same, for `[]`                                         |

- **Identity.** `compareWith` decides whether an option is selected; use it with object values.
- **Unrendered options.** The label derives from the value through `displayWith`, never from rendered options, so a value whose option is not rendered (lazy list) still shows its label. The option appears selected once it renders.
- **Selected vs active.** The selected value(s) and the active (highlighted) option are separate signals. `aria-selected` follows selection; `data-qz-highlighted` follows the active option.
- **`closeOnSelect`.** Defaults to `true` for single and `false` for multiple; an explicit value always wins.
- **Programmatic writes** never emit the committed outputs.

## Keyboard

| Key                                      | Action                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Enter / Space / ArrowDown on the trigger | Open (ArrowUp opens on the last option)                                      |
| ArrowUp / ArrowDown / Home / End         | Move the active option (skips disabled options, group labels and separators) |
| Enter / Space on an option               | Select (multiple: toggle)                                                    |
| Type characters                          | Typeahead by option text                                                     |
| Escape                                   | Close and return focus to the trigger                                        |
| Tab                                      | Close, hand focus back to the trigger, then move on                          |

## Forms

`SelectControlDirective` (from `@quartz-headless/primitives/forms`) attaches to `[qzSelect]` with `formControl`, `formControlName` or `ngModel`. Single: option value or `null`. Multiple: an array; `[]` after emptying, and `reset()` (writes `null`) shows empty until the user commits again. `writeValue` is silent and `onChange` fires exactly once per user toggle. See [Angular Forms adapters](/docs/guides/angular-forms).

## Styling hooks and ARIA

`data-qz-open`, `data-qz-disabled` and `data-qz-placeholder` on the trigger; `data-qz-selected`, `data-qz-highlighted`, `data-qz-disabled` on options; `aria-multiselectable` on the listbox when `multiple`. The listbox is named after the trigger.

## Limitations and related

No virtualization or async option loading (use [Combobox](/docs/primitives/combobox) for search). Related: [Listbox](/docs/primitives/listbox), [Combobox](/docs/primitives/combobox), [Dialog](/docs/primitives/dialog) (a Select inside a Dialog stays interactive).

## Live examples

::demo[select]

## Code

### Basic and disabled option

```ts
import { signal } from '@angular/core';
import {
  SelectDirective,
  SelectTriggerDirective,
  SelectContentDirective,
  SelectListboxDirective,
  SelectOptionDirective,
} from '@quartz-headless/primitives';

country = signal<string | null>('es');

<div qzSelect #select="qzSelect" [(value)]="country">
  <button qzSelectTrigger>{{ select.selectedLabel() || 'Choose country' }}</button>
  <ng-template qzSelectContent>
    <div qzSelectListbox>
      <button qzSelectOption="es">Spain</button>
      <button qzSelectOption="fr">France</button>
    </div>
  </ng-template>
</div>
```

### Object values and RTL

```html
<div qzSelect [(value)]="country" [displayWith]="displayCountry" [compareWith]="compareCountry">
  <button qzSelectTrigger>{{ country()?.name ?? 'Choose country' }}</button>
  <ng-template qzSelectContent>
    <div qzSelectListbox>
      @for (country of countries(); track country.code) {
      <button [qzSelectOption]="country" [qzSelectOptionLabel]="country.name">
        {{ country.name }}
      </button>
      }
    </div>
  </ng-template>
</div>
```

### Angular Forms

```ts
import {
  SelectDirective,
  SelectTriggerDirective,
  SelectContentDirective,
  SelectListboxDirective,
  SelectOptionDirective,
} from '@quartz-headless/primitives';
import { SelectControlDirective } from '@quartz-headless/primitives/forms';

// <div qzSelect formControlName="country" #s="qzSelect">
//   <button qzSelectTrigger aria-label="Country">{{ s.selectedLabel() || 'Choose' }}</button>
//   <ng-template qzSelectContent>
//     <div qzSelectListbox> ...options... </div>   <!-- named after the trigger automatically -->
//   </ng-template>
// </div>
```
