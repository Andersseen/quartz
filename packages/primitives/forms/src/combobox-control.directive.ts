import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ComboboxDirective } from '@quartz-headless/primitives';
import { ControlAdapter } from './control-adapter';

/**
 * Angular Forms adapter for `[qzCombobox]`. The form value is the committed selection, never the
 * text in the input: the option value (single) or an array of values (`multiple`, `[]` when empty).
 * Typing alone does not notify Forms; the notification happens when a user action changes the
 * selection (option chosen/deselected, freeform committed, or a selected value cleared by editing
 * the text). `writeValue(null)` (also `reset()`) clears the selection and the text silently.
 * Touched fires when focus leaves the control.
 */
@Directive({
  selector: '[qzCombobox][formControl], [qzCombobox][formControlName], [qzCombobox][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxControlDirective),
      multi: true,
    },
  ],
})
export class ComboboxControlDirective extends ControlAdapter<unknown> {
  private readonly combobox = inject(ComboboxDirective<unknown>, { self: true });

  constructor() {
    super();
    this.combobox.valueChangeCommitted.subscribe((value) => this.onChange(value));
    this.combobox.valuesChangeCommitted.subscribe((values) => this.onChange(values));
    this.combobox.touched.subscribe(() => this.onTouched());
  }

  writeValue(value: unknown): void {
    this.combobox.writeFormValue(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.combobox.setFormDisabled(isDisabled);
  }
}
