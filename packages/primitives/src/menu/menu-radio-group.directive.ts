import { Directive, input, model } from '@angular/core';

@Directive({
  selector: '[qzMenuRadioGroup]',
  exportAs: 'qzMenuRadioGroup',
  standalone: true,
  host: {
    '[attr.role]': '"group"',
  },
})
export class MenuRadioGroupDirective<T> {
  readonly value = model<T | null>(null);
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  isChecked(value: T): boolean {
    const current = this.value();
    return current !== null && this.compareWith()(current, value);
  }

  select(value: T): void {
    this.value.set(value);
  }
}
