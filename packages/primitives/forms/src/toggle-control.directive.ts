import { Directive, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToggleDirective } from '@quartz-headless/primitives';
import { ControlAdapter } from './control-adapter';

/** Angular Forms adapter for `button[qzToggle]`. Value: `boolean` (pressed); `null`/`undefined` write `false`. */
@Directive({
  selector:
    'button[qzToggle][formControl], button[qzToggle][formControlName], button[qzToggle][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleControlDirective),
      multi: true,
    },
  ],
  host: { '(blur)': 'onTouched()' },
})
export class ToggleControlDirective extends ControlAdapter<boolean> {
  private readonly toggle = inject(ToggleDirective, { self: true });

  constructor() {
    super();
    this.toggle.pressedChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: boolean | null | undefined): void {
    this.toggle.pressed.set(value === true);
  }

  setDisabledState(isDisabled: boolean): void {
    this.toggle.setFormDisabled(isDisabled);
  }
}
