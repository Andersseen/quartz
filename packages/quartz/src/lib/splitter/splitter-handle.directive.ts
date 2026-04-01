import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[qzSplitterHandle]',
  host: {
    '[class.qz-splitter-handle]': 'true',
    '[attr.role]': '"separator"',
    '[attr.aria-label]': '"Resize panels"',
    '[attr.tabindex]': '0',
    '[style.flex-shrink]': '0',
  }
})
export class SplitterHandleDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
}
