export const BASIC_SNIPPET = `import { signal } from '@angular/core';
import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';

selected = signal<string | null>('starter');

// All visual styles are yours.
<div qzListbox [value]="selected()" (valueChange)="selected.set($event)">
  <button qzListboxOption="starter">Starter</button>
  <button qzListboxOption="pro">Pro</button>
  <button qzListboxOption="enterprise">Enterprise</button>
</div>`;

export const MULTI_SNIPPET = `<div qzListbox [multiple]="true" [value]="tags()" (valueChange)="tags.set($event)">
  <button qzListboxOption="angular">Angular</button>
  <button qzListboxOption="signals">Signals</button>
  <button qzListboxOption="ssr" [qzListboxOptionDisabled]="true">SSR (unavailable)</button>
</div>`;

export const FORMS_SNIPPET = `import { ListboxDirective, ListboxOptionDirective } from '@quartz-headless/primitives';
import { ListboxControlDirective } from '@quartz-headless/primitives/forms';

// <div qzListbox [multiple]="true" formControlName="tags" aria-label="Tags">
//   <div qzListboxOption="alpha">Alpha</div> ...
// </div>
// value: T (single) | T[] (multiple); reset() writes null = nothing selected.`;
