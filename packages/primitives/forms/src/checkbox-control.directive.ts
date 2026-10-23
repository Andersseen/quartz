import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CheckboxDirective, type CheckboxState } from '@quartz-headless/primitives';
import { ControlAdapter } from './control-adapter';

/**
 * Angular Forms adapter for `button[qzCheckbox]`.
 * Value: `true | false | 'indeterminate'`. `null`/`undefined` (e.g. `reset()`) write `false`.
 */
@Directive({
  selector:
    'button[qzCheckbox][formControl], button[qzCheckbox][formControlName], button[qzCheckbox][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxControlDirective),
      multi: true,
    },
  ],
  host: { '(blur)': 'onTouched()' },
})
export class CheckboxControlDirective extends ControlAdapter<CheckboxState> {
  private readonly checkbox = inject(CheckboxDirective, { self: true });

  constructor() {
    super();
    this.checkbox.checkedChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: CheckboxState | null | undefined): void {
    this.checkbox.checked.set(value === 'indeterminate' ? value : value === true);
  }

  setDisabledState(isDisabled: boolean): void {
    this.checkbox.setFormDisabled(isDisabled);
  }
}
