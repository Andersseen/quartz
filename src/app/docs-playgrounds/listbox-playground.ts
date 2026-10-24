import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  ListboxDirective,
  ListboxGroupDirective,
  ListboxGroupLabelDirective,
  ListboxOptionDirective,
  ListboxSeparatorDirective,
} from '@quartz-headless/primitives';
import { FRUIT_GROUPS } from './select-playground';

/** Real `qzListbox` with sections: single/multiple, orientation and disabled. */
@Component({
  selector: 'app-listbox-playground',
  imports: [
    ListboxDirective,
    ListboxOptionDirective,
    ListboxGroupDirective,
    ListboxGroupLabelDirective,
    ListboxSeparatorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex max-w-sm flex-col gap-3">
      <div
        qzListbox
        aria-label="Fruit"
        [multiple]="multiple()"
        [disabled]="disabled()"
        [(value)]="value"
        (valueChangeCommitted)="committed.emit(stringify($event))"
        class="rounded-md border border-white/15 p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400"
      >
        @for (group of groups; track group.label; let last = $last) {
          @if (grouped()) {
            <div qzListboxGroup>
              <div qzListboxGroupLabel class="px-3 py-1 text-xs uppercase text-gray-400">
                {{ group.label }}
              </div>
              @for (item of group.items; track item.value) {
                <div
                  [qzListboxOption]="item.value"
                  [qzListboxOptionDisabled]="!!item.disabled"
                  class="rounded px-3 py-2 text-gray-200 data-[qz-active]:bg-emerald-500/20 data-[qz-selected]:text-emerald-200 data-[qz-disabled]:text-gray-600"
                >
                  {{ item.label }}
                </div>
              }
            </div>
            @if (!last) {
              <div qzListboxSeparator class="my-1 h-px bg-white/10"></div>
            }
          } @else {
            @for (item of group.items; track item.value) {
              <div
                [qzListboxOption]="item.value"
                [qzListboxOptionDisabled]="!!item.disabled"
                class="rounded px-3 py-2 text-gray-200 data-[qz-active]:bg-emerald-500/20 data-[qz-selected]:text-emerald-200 data-[qz-disabled]:text-gray-600"
              >
                {{ item.label }}
              </div>
            }
          }
        }
      </div>
      <p class="text-sm text-gray-400">Value: {{ stringify(value()) }}</p>
    </div>
  `,
})
export class ListboxPlaygroundComponent {
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly grouped = input(true);
  /** Fires once per user selection change with the new value. */
  readonly committed = output<string>();

  protected readonly groups = FRUIT_GROUPS;
  protected readonly value = signal<string | string[] | null>(null);
  protected readonly stringify = (value: unknown): string => JSON.stringify(value);
}
