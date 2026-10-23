import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { RadioGroupDirective } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/**
 * Angular Forms adapter for `[qzRadioGroup]`. Value: the checked radio's `qzRadio` value, or
 * `null` when none is checked (also what `reset()` writes). Touched fires when focus leaves the group.
 */
@Directive({
  selector: '[qzRadioGroup][formControl], [qzRadioGroup][formControlName], [qzRadioGroup][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class RadioGroupControlDirective extends ControlAdapter<unknown> {
  private readonly group = inject(RadioGroupDirective<unknown>, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    super();
    this.group.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: unknown): void {
    this.group.value.set(value ?? null);
  }

  setDisabledState(isDisabled: boolean): void {
    this.group.setFormDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
