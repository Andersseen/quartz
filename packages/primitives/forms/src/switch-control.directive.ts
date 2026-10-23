import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { SwitchDirective } from '@quartz-headless/primitives';
import { ControlAdapter } from './control-adapter';

/** Angular Forms adapter for `button[qzSwitch]`. Value: `boolean`; `null`/`undefined` write `false`. */
@Directive({
  selector:
    'button[qzSwitch][formControl], button[qzSwitch][formControlName], button[qzSwitch][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchControlDirective),
      multi: true,
    },
  ],
  host: { '(blur)': 'onTouched()' },
})
export class SwitchControlDirective extends ControlAdapter<boolean> {
  private readonly toggle = inject(SwitchDirective, { self: true });

  constructor() {
    super();
    this.toggle.checkedChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: boolean | null | undefined): void {
    this.toggle.checked.set(value === true);
  }

  setDisabledState(isDisabled: boolean): void {
    this.toggle.setFormDisabled(isDisabled);
  }
}
