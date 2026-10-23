import type { ControlValueAccessor } from '@angular/forms';

/**
 * Callback plumbing shared by every Quartz Forms adapter. Adapters stay thin: they translate
 * `writeValue` into a model write (silent), the primitive's `*ChangeCommitted` output into
 * `onChange` (once per user interaction) and focus loss into `onTouched`.
 */
export abstract class ControlAdapter<V> implements ControlValueAccessor {
  protected onChange: (value: V) => void = () => {};
  protected onTouched: () => void = () => {};

  abstract writeValue(value: V | null | undefined): void;
  abstract setDisabledState(isDisabled: boolean): void;

  registerOnChange(fn: (value: V) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}

/** True when focus moved outside `host` (or to nowhere), i.e. the control was really left. */
export function focusLeft(host: HTMLElement, event: FocusEvent): boolean {
  const next = event.relatedTarget;
  return !(next instanceof Node && host.contains(next));
}
