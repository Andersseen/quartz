import { Directive, inject } from '@angular/core';

let comboboxGroupId = 0;

/** Labelled group of options: `role="group"` named by a `qzComboboxGroupLabel` child. */
@Directive({
  selector: '[qzComboboxGroup]',
  exportAs: 'qzComboboxGroup',
  standalone: true,
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labelId',
  },
})
export class ComboboxGroupDirective {
  readonly labelId = `qz-combobox-group-${++comboboxGroupId}-label`;
}

/** Visible label of a `qzComboboxGroup`. Not an option: skipped by keyboard navigation and typeahead. */
@Directive({
  selector: '[qzComboboxGroupLabel]',
  exportAs: 'qzComboboxGroupLabel',
  standalone: true,
  host: { '[attr.id]': 'group.labelId' },
})
export class ComboboxGroupLabelDirective {
  protected readonly group = inject(ComboboxGroupDirective);
}

/**
 * Decorative separator between options or groups; excluded from navigation. ARIA does not allow
 * `separator` inside a listbox, so it is hidden from assistive technology (`aria-hidden`).
 */
@Directive({
  selector: '[qzComboboxSeparator]',
  exportAs: 'qzComboboxSeparator',
  standalone: true,
  host: { '[attr.role]': '"presentation"', '[attr.aria-hidden]': '"true"' },
})
export class ComboboxSeparatorDirective {}
