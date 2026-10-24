import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import {
  SelectContentDirective,
  SelectDirective,
  SelectGroupDirective,
  SelectGroupLabelDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectSeparatorDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';

export interface FruitGroup {
  label: string;
  items: { value: string; label: string; disabled?: boolean }[];
}

export const FRUIT_GROUPS: FruitGroup[] = [
  {
    label: 'Citrus',
    items: [
      { value: 'lemon', label: 'Lemon' },
      { value: 'lime', label: 'Lime', disabled: true },
      { value: 'orange', label: 'Orange' },
    ],
  },
  {
    label: 'Berries',
    items: [
      { value: 'blueberry', label: 'Blueberry' },
      { value: 'strawberry', label: 'Strawberry' },
    ],
  },
];

/** Real `qzSelect` driven by Doqs playground controls: multiple, grouped, closeOnSelect, disabled, RTL. */
@Component({
  selector: 'app-select-playground',
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectGroupDirective,
    SelectGroupLabelDirective,
    SelectSeparatorDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.dir]="rtl() ? 'rtl' : 'ltr'" class="flex flex-col gap-3 max-w-sm">
      <span id="qz-fruit-label" class="text-sm text-gray-400">Fruit</span>
      <div
        qzSelect
        #select="qzSelect"
        [multiple]="multiple()"
        [disabled]="disabled()"
        [closeOnSelect]="closeOnSelect()"
        [(value)]="single"
        [(values)]="many"
        (selected)="selection.emit(String($event))"
      >
        <button
          qzSelectTrigger
          id="qz-fruit-trigger"
          aria-labelledby="qz-fruit-label qz-fruit-trigger"
          class="w-full rounded-md border border-white/15 px-4 py-2 text-start text-gray-100 data-[qz-placeholder]:text-gray-400 data-[qz-open]:border-emerald-400 data-[qz-disabled]:opacity-50"
        >
          {{ select.selectedLabel() || 'Pick fruit' }}
        </button>
        <ng-template qzSelectContent>
          <div
            qzSelectListbox
            class="rounded-md border border-white/15 bg-[#111318] p-1 shadow-xl"
            [attr.dir]="rtl() ? 'rtl' : 'ltr'"
          >
            @for (group of groups; track group.label; let last = $last) {
              @if (grouped()) {
                <div qzSelectGroup>
                  <div qzSelectGroupLabel class="px-3 py-1 text-xs uppercase text-gray-400">
                    {{ group.label }}
                  </div>
                  @for (item of group.items; track item.value) {
                    <button
                      [qzSelectOption]="item.value"
                      [qzSelectOptionDisabled]="!!item.disabled"
                      class="flex w-full items-center justify-between rounded px-3 py-2 text-start text-gray-200 data-[qz-highlighted]:bg-emerald-500/20 data-[qz-selected]:text-emerald-200 data-[qz-disabled]:text-gray-600"
                    >
                      {{ item.label }}
                    </button>
                  }
                </div>
                @if (!last) {
                  <div qzSelectSeparator class="my-1 h-px bg-white/10"></div>
                }
              } @else {
                @for (item of group.items; track item.value) {
                  <button
                    [qzSelectOption]="item.value"
                    [qzSelectOptionDisabled]="!!item.disabled"
                    class="flex w-full items-center justify-between rounded px-3 py-2 text-start text-gray-200 data-[qz-highlighted]:bg-emerald-500/20 data-[qz-selected]:text-emerald-200 data-[qz-disabled]:text-gray-600"
                  >
                    {{ item.label }}
                  </button>
                }
              }
            }
          </div>
        </ng-template>
      </div>
      <p class="text-sm text-gray-400" data-testid="select-playground-value">
        Value: {{ multiple() ? '[' + many().join(', ') + ']' : (single() ?? 'null') }}
      </p>
    </div>
  `,
})
export class SelectPlaygroundComponent {
  // #region doqs:select-playground-inputs
  readonly multiple = input(false);
  readonly disabled = input(false);
  readonly closeOnSelect = input(false);
  readonly grouped = input(true);
  readonly rtl = input(false);
  // #endregion doqs:select-playground-inputs
  /** Fires with the toggled option value on each user selection. */
  readonly selection = output<string>();

  protected readonly groups = FRUIT_GROUPS;
  protected readonly String = String;
  protected readonly single = signal<string | null>(null);
  protected readonly many = signal<readonly string[]>(['blueberry']);
}
