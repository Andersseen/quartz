import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputOtpComponent } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/** Angular Forms adapter for `qz-input-otp`; value is a string and reset writes an empty string. */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- The adapter targets the custom element host so consumers can use CVA without an extra marker attribute.
  selector: 'qz-input-otp[formControl], qz-input-otp[formControlName], qz-input-otp[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputOtpControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class InputOtpControlDirective extends ControlAdapter<string> {
  private readonly inputOtp = inject(InputOtpComponent, { self: true });

  constructor() {
    super();
    this.inputOtp.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: string | null | undefined): void {
    this.inputOtp.value.set(value ?? '');
  }

  setDisabledState(disabled: boolean): void {
    this.inputOtp.setFormDisabled(disabled);
  }

  onFocusOut(event: FocusEvent): void {
    if (focusLeft(event.currentTarget as HTMLElement, event)) this.onTouched();
  }
}
