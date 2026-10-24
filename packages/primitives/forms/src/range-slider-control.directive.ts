import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { RangeSliderDirective, type RangeSliderValue } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/**
 * Angular Forms adapter for `[qzRangeSlider]`. Value: `{ low: number; high: number }` — an object,
 * never a tuple (map `[low, high]` yourself when migrating from Volt). `null` / `undefined` (e.g.
 * `reset()`) show the full `min..max` range; any other shape is ignored. `onChange` fires once
 * per user change; `writeValue` is silent. Touched fires when focus leaves the slider.
 */
@Directive({
  selector:
    '[qzRangeSlider][formControl], [qzRangeSlider][formControlName], [qzRangeSlider][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RangeSliderControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class RangeSliderControlDirective extends ControlAdapter<RangeSliderValue> {
  private readonly slider = inject(RangeSliderDirective, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    super();
    this.slider.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: RangeSliderValue | null | undefined): void {
    this.slider.writeFormValue(value);
  }

  setDisabledState(isDisabled: boolean): void {
    this.slider.setFormDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
