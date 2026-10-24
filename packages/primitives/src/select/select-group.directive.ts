import { Directive, inject } from '@angular/core';

let selectGroupId = 0;

/** Labelled group of options: `role="group"` named by a `qzSelectGroupLabel` child. */
@Directive({
  selector: '[qzSelectGroup]',
  exportAs: 'qzSelectGroup',
  standalone: true,
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labelId',
  },
})
export class SelectGroupDirective {
  readonly labelId = `qz-select-group-${++selectGroupId}-label`;
}

/** Visible label of a `qzSelectGroup`. Not an option: skipped by keyboard navigation and typeahead. */
@Directive({
  selector: '[qzSelectGroupLabel]',
  exportAs: 'qzSelectGroupLabel',
  standalone: true,
  host: { '[attr.id]': 'group.labelId' },
})
export class SelectGroupLabelDirective {
  protected readonly group = inject(SelectGroupDirective);
}

/**
 * Decorative separator between options or groups; excluded from navigation. ARIA does not allow
 * `separator` inside a listbox, so it is hidden from assistive technology (`aria-hidden`).
 */
@Directive({
  selector: '[qzSelectSeparator]',
  exportAs: 'qzSelectSeparator',
  standalone: true,
  host: { '[attr.role]': '"presentation"', '[attr.aria-hidden]': '"true"' },
})
export class SelectSeparatorDirective {}
