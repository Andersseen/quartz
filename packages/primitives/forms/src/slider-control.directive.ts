import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SliderDirective } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/**
 * Angular Forms adapter for `[qzSlider]`. Value: `number`. `onChange` fires once per user change
 * (each key step and each new value reached while dragging); `writeValue` is silent. `null` /
 * `undefined` / non-numbers (e.g. `reset()`) show the slider at `min` and leave the control's
 * value as written until the user changes it. Touched fires when focus leaves the slider.
 */
@Directive({
  selector: '[qzSlider][formControl], [qzSlider][formControlName], [qzSlider][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SliderControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class SliderControlDirective extends ControlAdapter<number> {
  private readonly slider = inject(SliderDirective, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    super();
    this.slider.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: number | null | undefined): void {
    this.slider.value.set(typeof value === 'number' ? value : this.slider.bounds().min);
  }

  setDisabledState(isDisabled: boolean): void {
    this.slider.setFormDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
