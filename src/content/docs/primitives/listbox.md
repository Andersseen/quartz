---
title: Listbox
description: 'A headless WAI-ARIA listbox for single and multiple selection. Quartz owns keyboard behaviour; your design system owns every visual detail.'
group: Primitives
order: 107
---

## At a glance

- **Keyboard** — Arrows, Home/End, Enter/Space and type-ahead
- **Signals** — Reactive value model with two-way binding
- **Accessible** — Active-descendant and option semantics included
- **Composable** — Foundation for select, combobox and command palettes

## Sections and headers

Wrap options in `qzListboxGroup` with a `qzListboxGroupLabel`, and separate sections with `qzListboxSeparator`. Labels and separators are not options: keyboard navigation and typeahead skip them, DOM order is preserved, and dynamically added or removed sections re-register in place.

```html
<div qzListbox aria-label="Fruit" [(value)]="fruit">
  <div qzListboxGroup>
    <div qzListboxGroupLabel>Citrus</div>
    <div qzListboxOption="lemon">Lemon</div>
    <div qzListboxOption="lime" qzListboxOptionDisabled>Lime</div>
  </div>
  <div qzListboxSeparator></div>
  <div qzListboxGroup>
    <div qzListboxGroupLabel>Berries</div>
    <div qzListboxOption="fig">Fig</div>
  </div>
</div>
```

::playground[quartz-listbox]

## Value contract

The Quartz listbox keeps its own representation: a **scalar** in single mode and an **array** with `multiple`. An adapter for a library that always uses arrays translates at its boundary; Quartz does not force an array on single mode. `valueChangeCommitted` fires once per user change and never for programmatic writes. Selection and the active option are independent: moving with the arrows does not select.

Group labels are named through `aria-labelledby`, disabled options are skipped by navigation and keep `aria-disabled`. Horizontal listboxes follow reading direction (RTL mirrors ArrowLeft/ArrowRight).

## Forms

`ListboxControlDirective` writes silently and notifies once per commit: scalar (single) or array (`multiple`), `null` for none. Touched fires when focus leaves the listbox.

## Live examples

::demo[listbox]

## Code

### Single selection

```ts
import { signal } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';

selected = signal<string | null>('starter');

// All visual styles are yours.
<div qzListbox [value]="selected()" (valueChange)="selected.set($event)">
  <button qzListboxOption="starter">Starter</button>
  <button qzListboxOption="pro">Pro</button>
  <button qzListboxOption="enterprise">Enterprise</button>
</div>
```

### Multiple selection

```html
<div qzListbox [multiple]="true" [value]="tags()" (valueChange)="tags.set($event)">
  <button qzListboxOption="angular">Angular</button>
  <button qzListboxOption="signals">Signals</button>
  <button qzListboxOption="ssr" [qzListboxOptionDisabled]="true">SSR (unavailable)</button>
</div>
```

### Angular Forms

```ts
import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';
import { ListboxControlDirective } from '@quartz-headless/primitives/forms';

// <div qzListbox [multiple]="true" formControlName="tags" aria-label="Tags">
//   <div qzListboxOption="alpha">Alpha</div> ...
// </div>
// value: T (single) | T[] (multiple); reset() writes null = nothing selected.
```
