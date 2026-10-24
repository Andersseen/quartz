---
title: Combobox
description: 'An editable WAI-ARIA combobox with input-owned focus, active-descendant suggestions, filtering and Overlay positioning.'
group: Primitives
order: 108
---

## At a glance

- **Editable** — Input text stays separate from committed value
- **Focused** — DOM focus remains on the input while options activate
- **Async Safe** — Options can be replaced while the popup is open
- **Headless** — Projection keeps suggestion markup fully owned by you

## Imports

```ts
import {
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  ComboboxGroupDirective,
  ComboboxGroupLabelDirective,
  ComboboxSeparatorDirective,
  createLatestRequest,
} from '@quartz-headless/primitives';
import { ComboboxControlDirective } from '@quartz-headless/primitives/forms';
```

::playground[quartz-combobox]

## Query versus value

The text in the input (`inputValue`) is a **query**; the selection (`value` / `values`) is what the user committed. They are separate on purpose:

- Typing changes the query, filters the options (unless `[filter]="null"`) and emits `queryChanged` — it does not change the selection.
- Choosing an option commits it: single mode sets `value` and writes its label into the input; multiple mode toggles it in `values`, clears the query and keeps the popup open.
- Editing the text of a selected value clears the selection (reported once through `valueChangeCommitted(null)`). With `allowFreeform` (single), the typed text is committed on blur or Tab.
- `allowDeselect` (single): choosing the selected option again clears it.
- `closeOnSelect` defaults to `true` for single and `false` for multiple.

## IME composition

While an IME composition is active (`compositionstart` … `compositionend`, or `isComposing` input events, or Safari's keyCode 229 Enter) the query is neither filtered, committed nor rewritten, and Enter belongs to the IME. The final text is applied once on `compositionend`.

## Remote results

Quartz does not fetch. You own the request and pass results through `[options]` (use `[filter]="null"` when the server filters). For a sound integration use `createLatestRequest()` inside an injection context:

```ts
private readonly latest = createLatestRequest();
readonly results = signal<string[]>([]);
readonly loading = signal(false);

async search(query: string) {
  this.loading.set(true);
  const rows = await this.latest.run((signal) =>
    fetch(`/api/cities?q=${encodeURIComponent(query)}`, { signal }).then((r) => r.json()),
  );
  if (rows === undefined) return; // superseded or cancelled: a newer request owns `loading`
  this.results.set(rows);
  this.loading.set(false);
}
```

```html
<div
  qzCombobox
  #c="qzCombobox"
  [options]="results()"
  [filter]="null"
  [loading]="loading()"
  (queryChanged)="search($event)"
></div>
```

`run()` aborts the previous request (its `AbortSignal` fires) and discards its result even if the task ignores the signal; the in-flight request is aborted when the owner is destroyed. Quartz can only cancel work you start through it.

## Status and states

`status()` is `'loading' | 'empty' | 'results'`; the listbox carries `aria-busy`, `data-qz-loading` and `data-qz-empty`. Render your own "No results" and "Loading" rows from `status()`.

## ARIA and keyboard

The input has `role="combobox"`, `aria-expanded`, `aria-autocomplete`, and `aria-controls` / `aria-activedescendant` only while the popup exists (no dangling references). DOM focus stays on the input. ArrowDown/ArrowUp open and move; Enter commits the active option; Escape closes (and restores the committed text); Tab closes and commits a freeform value. A disabled combobox is natively disabled.

## Forms

`ComboboxControlDirective` (`@quartz-headless/primitives/forms`): the form value is the committed selection (array for `multiple`), never the text. `writeValue` is silent, `reset()` clears selection and text, `onChange` fires once per user commit, touched on blur. See [Angular Forms adapters](/docs/guides/angular-forms).

## Limitations

No virtualization, no automatic fetching and no chips UI (render selected `values` yourself). Typeahead in the input is the query itself. Backspace on an empty multiple input does not remove the last value.

## Live examples

::demo[combobox]

## Code

### Static options

```ts
import {
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxContentDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
} from '@quartz-headless/primitives';

fruits = ['Apple', 'Apricot', 'Banana', 'Grape'];
selected = signal<string | null>(null);

<div qzCombobox #combo="qzCombobox" [content]="content" [options]="fruits" [(value)]="selected">
  <input qzComboboxInput aria-label="Fruit" />

  <ng-template #content qzComboboxContent>
    <ul qzComboboxListbox>
      @for (fruit of combo.filteredOptions(); track fruit) {
        <li [qzComboboxOption]="fruit">{{ fruit }}</li>
      }
    </ul>
  </ng-template>
</div>
```

### Object values

```ts
users = signal([
  { id: 1, name: 'Ada Lovelace', role: 'Computing pioneer' },
  { id: 2, name: 'Grace Hopper', role: 'Compiler pioneer' },
]);

displayUser = (user: User) => user.name;
compareUsers = (a: User, b: User) => a.id === b.id;

<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="users()"
  [displayWith]="displayUser"
  [compareWith]="compareUsers"
  [(value)]="selectedUser">
  <input qzComboboxInput aria-label="User" />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @for (user of combo.filteredOptions(); track user.id) {
        <div [qzComboboxOption]="user" [qzComboboxOptionLabel]="user.name">
          {{ user.name }}
        </div>
      }
    </div>
  </ng-template>
</div>
```

### Async replacement

```html
<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="results()"
  [filter]="null"
  [loading]="loading()"
  [(inputValue)]="query"
>
  <input qzComboboxInput aria-label="Repository" />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @if (loading()) {
      <div>Loading...</div>
      } @for (result of combo.filteredOptions(); track result.id) {
      <div [qzComboboxOption]="result" [qzComboboxOptionLabel]="result.name">{{ result.name }}</div>
      } @if (combo.empty() && !combo.loading()) {
      <div>No results</div>
      }
    </div>
  </ng-template>
</div>
```
