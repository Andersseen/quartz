import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
} from '@quartz-headless/primitives';

const CITIES = ['Madrid', 'Málaga', 'Paris', 'Prague', 'Porto', 'Rome', 'Berlin', 'Lisbon'];

/** Real `qzCombobox`: single/multiple, deselect, freeform, loading and disabled. */
@Component({
  selector: 'app-combobox-playground',
  imports: [
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxContentDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-sm flex-col gap-3">
      <div
        qzCombobox
        #combo="qzCombobox"
        [options]="cities"
        [multiple]="multiple()"
        [disabled]="disabled()"
        [loading]="loading()"
        [allowDeselect]="allowDeselect()"
        [allowFreeform]="allowFreeform()"
        [(value)]="single"
        [(values)]="many"
        (queryChanged)="query.emit($event)"
        (valueChangeCommitted)="committed.emit(String($event))"
        (valuesChangeCommitted)="committed.emit($event.join(', '))"
      >
        <input
          qzComboboxInput
          aria-label="City"
          placeholder="Search cities"
          class="w-full rounded-md border border-white/15 bg-transparent px-4 py-2 text-gray-100 data-[qz-disabled]:opacity-50"
        />
        <ng-template qzComboboxContent>
          <ul
            qzComboboxListbox
            aria-label="Cities"
            class="max-h-56 overflow-auto rounded-md border border-white/15 bg-[#111318] p-1 shadow-xl"
          >
            @for (city of combo.filteredOptions(); track city) {
              <li
                [qzComboboxOption]="city"
                class="cursor-pointer rounded px-3 py-2 text-gray-200 data-[qz-active]:bg-emerald-500/20 data-[qz-selected]:text-emerald-200"
              >
                {{ city }}
              </li>
            }
            @if (combo.status() === 'empty') {
              <li class="px-3 py-2 text-gray-400">No results</li>
            }
            @if (combo.status() === 'loading') {
              <li class="px-3 py-2 text-gray-400">Loading…</li>
            }
          </ul>
        </ng-template>
      </div>
      <p class="text-sm text-gray-400">
        Value: {{ multiple() ? '[' + many().join(', ') + ']' : (single() ?? 'null') }}
      </p>
    </div>
  `,
})
export class ComboboxPlaygroundComponent {
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly allowDeselect = input(false);
  readonly allowFreeform = input(false);
  /** The text query after user typing (not during IME composition). */
  readonly query = output<string>();
  /** Fires once per user selection change. */
  readonly committed = output<string>();

  protected readonly cities = CITIES;
  protected readonly String = String;
  protected readonly single = signal<string | null>(null);
  protected readonly many = signal<readonly string[]>([]);
}
