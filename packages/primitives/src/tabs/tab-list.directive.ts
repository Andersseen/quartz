import { Directive, inject } from '@angular/core';
import { TabsDirective } from './tabs.directive';

@Directive({
  selector: '[qzTabList]',
  exportAs: 'qzTabList',
  standalone: true,
  host: {
    '[attr.role]': '"tablist"',
    '[attr.aria-orientation]': 'tabs.orientation()',
    '[attr.data-qz-orientation]': 'tabs.orientation()',
    '(keydown)': 'tabs.handleListKeydown($event)',
  },
})
export class TabListDirective {
  protected readonly tabs = inject(TabsDirective);
}
