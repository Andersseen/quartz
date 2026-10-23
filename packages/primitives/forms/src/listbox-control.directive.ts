import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListboxDirective } from '@quartz-headless/primitives';
import { ControlAdapter, focusLeft } from './control-adapter';

/**
 * Angular Forms adapter for `[qzListbox]`. Value: the selected option value (single) or an array
 * of values (`multiple`). `null` (also what `reset()` writes) means nothing selected in both modes.
 * Touched fires when focus leaves the listbox.
 */
@Directive({
  selector: '[qzListbox][formControl], [qzListbox][formControlName], [qzListbox][ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListboxControlDirective),
      multi: true,
    },
  ],
  host: { '(focusout)': 'onFocusOut($event)' },
})
export class ListboxControlDirective extends ControlAdapter<unknown> {
  private readonly listbox = inject(ListboxDirective<unknown>, { self: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    super();
    this.listbox.valueChangeCommitted.subscribe((value) => this.onChange(value));
  }

  writeValue(value: unknown): void {
    this.listbox.value.set((value ?? null) as unknown[] | null);
  }

  setDisabledState(isDisabled: boolean): void {
    this.listbox.setFormDisabled(isDisabled);
  }

  protected onFocusOut(event: FocusEvent): void {
    if (focusLeft(this.host.nativeElement, event)) this.onTouched();
  }
}
