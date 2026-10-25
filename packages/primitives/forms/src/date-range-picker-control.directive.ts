import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DateRangePickerDirective, type DateRange } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/** Forms adapter for `[qzDateRangePicker]`; partial values use `{ start, end: null }`. */
@Directive({
  selector:
    '[qzDateRangePicker][formControl], [qzDateRangePicker][formControlName], [qzDateRangePicker][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class DateRangePickerControlDirective extends ControlAdapter<DateRange> {
  private readonly picker = inject(DateRangePickerDirective, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  constructor() {
    super();
    this.picker.rangeChangeCommitted.subscribe((value) => this.onChange(value));
  }
  writeValue(value: DateRange | null | undefined): void {
    this.picker.writeFormValue(value);
  }
  setDisabledState(disabled: boolean): void {
    this.picker.setFormDisabled(disabled);
  }
  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
