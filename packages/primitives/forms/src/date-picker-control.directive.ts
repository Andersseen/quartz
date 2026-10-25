import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePickerDirective } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/** Forms adapter for `[qzDatePicker]`; values are `Date | null` local civil dates. */
@Directive({
  selector: '[qzDatePicker][formControl], [qzDatePicker][formControlName], [qzDatePicker][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class DatePickerControlDirective extends ControlAdapter<Date> {
  private readonly picker = inject(DatePickerDirective, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    super();
    this.picker.dateChangeCommitted.subscribe((value) => this.onChange(value));
  }
  writeValue(value: Date | null | undefined): void {
    this.picker.writeFormValue(value);
  }
  setDisabledState(disabled: boolean): void {
    this.picker.setFormDisabled(disabled);
  }
  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
