import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectDirective } from '@quartz-headless/primitives';
import { ControlAdapter } from './control-adapter';

/**
 * Angular Forms adapter for `[qzSelect]`. Value: the selected option's `qzSelectOption` value, or
 * `null` (also what `reset()` writes). With `multiple` the value is an array (`[]` when empty;
 * `null`/`undefined` written by Forms, e.g. `reset()`, is shown as empty, and the control keeps that
 * `null` until the user commits a change). A value without a matching option is kept as written.
 * Touched fires when focus leaves the control: trigger blur with the popup closed, or a popup
 * close that does not return focus to the trigger.
 */
@Directive({
  selector: '[qzSelect][formControl], [qzSelect][formControlName], [qzSelect][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectControlDirective),
      multi: true,
    },
  ],
})
export class SelectControlDirective extends ControlAdapter<unknown> {
  private readonly select = inject(SelectDirective<unknown>, { self: true });

  constructor() {
    super();
    this.select.valueChangeCommitted.subscribe((value) => this.onChange(value));
    this.select.valuesChangeCommitted.subscribe((values) => this.onChange(values));
    this.select.touched.subscribe(() => this.onTouched());
  }

  writeValue(value: unknown): void {
    this.select.writeFormValue(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.select.setFormDisabled(isDisabled);
  }
}
