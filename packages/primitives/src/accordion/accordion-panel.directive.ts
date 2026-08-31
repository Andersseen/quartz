import { Directive, inject } from '@angular/core';
import { AccordionItemDirective } from './accordion-item.directive';

@Directive({
  selector: '[qzAccordionPanel]',
  exportAs: 'qzAccordionPanel',
  standalone: true,
  host: {
    '[attr.id]': 'item.panelId',
    '[attr.role]': 'item.useRegion() ? "region" : null',
    '[attr.aria-labelledby]': 'item.id',
    '[attr.hidden]': 'item.open() ? null : ""',
    '[attr.data-qz-state]': 'item.open() ? "open" : "closed"',
  },
})
export class AccordionPanelDirective {
  protected readonly item = inject(AccordionItemDirective);
}
