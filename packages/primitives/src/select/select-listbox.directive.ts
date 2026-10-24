import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';
import { SelectDirective } from './select.directive';

@Directive({
  selector: '[qzSelectListbox]',
  exportAs: 'qzSelectListbox',
  standalone: true,
  host: {
    '[attr.role]': '"listbox"',
    '[attr.id]': 'select.panelId()',
    '[attr.aria-multiselectable]': 'select.multiple() ? true : null',
    '[attr.tabindex]': '-1',
    '(keydown)': 'select.handleListboxKeydown($event)',
  },
})
export class SelectListboxDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly select = inject(SelectDirective);

  constructor() {
    this.select.setListboxElement(this.elementRef.nativeElement);
    // Runs after the consumer's own attribute bindings were applied, so an explicit
    // `aria-label` / `aria-labelledby` on the listbox always wins over the trigger's name.
    afterNextRender(() => this.select.nameListbox(this.elementRef.nativeElement));
  }

  ngOnDestroy(): void {
    this.select.setListboxElement(null);
  }
}
