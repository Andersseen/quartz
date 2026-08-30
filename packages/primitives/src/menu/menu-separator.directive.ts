import { Directive } from '@angular/core';

@Directive({
  selector: '[qzMenuSeparator]',
  standalone: true,
  host: {
    '[attr.role]': '"separator"',
    '[attr.aria-orientation]': '"horizontal"',
  },
})
export class MenuSeparatorDirective {}
