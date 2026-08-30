import { Directive } from '@angular/core';

@Directive({
  selector: '[qzPopover]',
  exportAs: 'qzPopover',
  standalone: true,
  host: {
    '[attr.data-qz-popover]': '""',
  },
})
export class PopoverDirective {}
