import { Directive, inject } from '@angular/core';
import { ComboboxDirective } from './combobox.directive';

@Directive({
  selector: '[qzComboboxListbox]',
  exportAs: 'qzComboboxListbox',
  standalone: true,
  host: {
    '[attr.id]': 'combobox.panelId()',
    '[attr.role]': '"listbox"',
    '[attr.aria-busy]': 'combobox.loading() || null',
    '[attr.data-qz-combobox-listbox]': '""',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '[attr.data-qz-loading]': 'combobox.loading() ? "" : null',
  },
})
export class ComboboxListboxDirective {
  readonly combobox = inject(ComboboxDirective);
}
