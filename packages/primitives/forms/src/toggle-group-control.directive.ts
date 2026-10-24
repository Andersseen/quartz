import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ToggleGroupDirective } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/**
 * Angular Forms adapter for `[qzToggleGroup]`. Value: the pressed item's `qzToggleItem` value or
 * `null` in `type="single"`; an array of values in `type="multiple"`. `null`/`undefined` (e.g.
 * `reset()`) show nothing pressed in both modes (the control keeps that `null` until the user
 * commits a change). `onChange` fires once per user activation; `writeValue` is silent. Touched
 * fires when focus leaves the group.
 */
@Directive({
  selector:
    '[qzToggleGroup][formControl], [qzToggleGroup][formControlName], [qzToggleGroup][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleGroupControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class ToggleGroupControlDirective extends ControlAdapter<unknown> {
  private readonly group = inject(ToggleGroupDirective<unknown>, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    super();
    this.group.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: unknown): void {
    this.group.value.set((value ?? null) as never);
  }

  setDisabledState(isDisabled: boolean): void {
    this.group.setFormDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
