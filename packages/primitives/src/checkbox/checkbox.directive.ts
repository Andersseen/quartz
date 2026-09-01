import { Directive, booleanAttribute, computed, input, model, output } from '@angular/core';

export type CheckboxState = boolean | 'indeterminate';

@Directive({
  selector: '[qzCheckbox]',
  exportAs: 'qzCheckbox',
  standalone: true,
  host: {
    type: 'button',
    '[attr.role]': '"checkbox"',
    '[attr.aria-checked]': 'ariaChecked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-state]': 'state()',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class CheckboxDirective {
  readonly checked = model<CheckboxState>(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly checkedChangeCommitted = output<CheckboxState>();

  readonly state = computed(() =>
    this.checked() === 'indeterminate' ? 'indeterminate' : this.checked() ? 'checked' : 'unchecked',
  );
  readonly ariaChecked = computed(() =>
    this.checked() === 'indeterminate' ? 'mixed' : this.checked(),
  );

  toggle(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    const next = this.checked() === true ? false : true;
    this.checked.set(next);
    this.checkedChangeCommitted.emit(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON') return;
    event.preventDefault();
    this.toggle();
  }
}
