import { Directive, inject } from '@angular/core';

let listboxGroupId = 0;

/** Labelled group of options: `role="group"` named by a `qzListboxGroupLabel` child. */
@Directive({
  selector: '[qzListboxGroup]',
  exportAs: 'qzListboxGroup',
  standalone: true,
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-labelledby]': 'labelId',
  },
})
export class ListboxGroupDirective {
  readonly labelId = `qz-listbox-group-${++listboxGroupId}-label`;
}

/** Visible label of a `qzListboxGroup`. Not an option: skipped by keyboard navigation and typeahead. */
@Directive({
  selector: '[qzListboxGroupLabel]',
  exportAs: 'qzListboxGroupLabel',
  standalone: true,
  host: { '[attr.id]': 'group.labelId' },
})
export class ListboxGroupLabelDirective {
  protected readonly group = inject(ListboxGroupDirective);
}

/** Visual separator between options or groups; excluded from navigation. */
@Directive({
  selector: '[qzListboxSeparator]',
  exportAs: 'qzListboxSeparator',
  standalone: true,
  host: { '[attr.role]': '"separator"' },
})
export class ListboxSeparatorDirective {}
