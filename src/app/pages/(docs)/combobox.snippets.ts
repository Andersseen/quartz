export const BASIC_SNIPPET = `import {
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
</div>`;

export const OBJECT_SNIPPET = `users = signal([
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
</div>`;

export const ASYNC_SNIPPET = `<div
  qzCombobox
  #combo="qzCombobox"
  [content]="content"
  [options]="results()"
  [filter]="null"
  [loading]="loading()"
  [(inputValue)]="query">
  <input qzComboboxInput aria-label="Repository" />

  <ng-template #content qzComboboxContent>
    <div qzComboboxListbox>
      @if (loading()) {
        <div>Loading...</div>
      }
      @for (result of combo.filteredOptions(); track result.id) {
        <div [qzComboboxOption]="result" [qzComboboxOptionLabel]="result.name">
          {{ result.name }}
        </div>
      }
      @if (combo.empty() && !combo.loading()) {
        <div>No results</div>
      }
    </div>
  </ng-template>
</div>`;
