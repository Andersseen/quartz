import { Directive, input, model } from '@angular/core';
import { MenuLabelRegistry, QZ_MENU_LABEL_HOST, type MenuLabelHost } from './menu-group.directive';

@Directive({
  selector: '[qzMenuRadioGroup]',
  exportAs: 'qzMenuRadioGroup',
  standalone: true,
  providers: [{ provide: QZ_MENU_LABEL_HOST, useExisting: MenuRadioGroupDirective }],
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labels.labelledBy()',
  },
})
export class MenuRadioGroupDirective<T> implements MenuLabelHost {
  readonly value = model<T | null>(null);
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);
  protected readonly labels = new MenuLabelRegistry();

  registerLabel(id: string): void {
    this.labels.registerLabel(id);
  }

  unregisterLabel(id: string): void {
    this.labels.unregisterLabel(id);
  }

  isChecked(value: T): boolean {
    const current = this.value();
    return current !== null && this.compareWith()(current, value);
  }

  select(value: T): void {
    this.value.set(value);
  }
}
