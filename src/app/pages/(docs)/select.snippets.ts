export const BASIC_SNIPPET = `import { signal } from '@angular/core';
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
</div>`;

export const OBJECT_SNIPPET = `<div qzSelect [(value)]="country" [displayWith]="displayCountry" [compareWith]="compareCountry">
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
</div>`;
