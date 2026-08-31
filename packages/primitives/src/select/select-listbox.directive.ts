import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { SelectDirective } from './select.directive';

@Directive({
  selector: '[qzSelectListbox]',
  exportAs: 'qzSelectListbox',
  standalone: true,
  host: {
    '[attr.role]': '"listbox"',
    '[attr.id]': 'select.panelId()',
    '[attr.tabindex]': '-1',
    '(keydown)': 'select.handleListboxKeydown($event)',
  },
})
export class SelectListboxDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly select = inject(SelectDirective);

  constructor() {
    this.select.setListboxElement(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.select.setListboxElement(null);
  }
}
