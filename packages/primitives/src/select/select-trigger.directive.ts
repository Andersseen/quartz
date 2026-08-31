import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { SelectDirective } from './select.directive';

@Directive({
  selector: '[qzSelectTrigger]',
  exportAs: 'qzSelectTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-expanded]': 'select.isOpen()',
    '[attr.aria-controls]': 'select.panelId()',
    '[attr.aria-disabled]': 'select.disabled() || null',
    '[attr.data-qz-open]': 'select.isOpen() ? "" : null',
    '[attr.data-qz-disabled]': 'select.disabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'select.handleTriggerKeydown($event)',
  },
})
export class SelectTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly select = inject(SelectDirective);

  constructor() {
    this.select.setTriggerElement(this.elementRef.nativeElement);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    if (this.select.isOpen()) this.select.closePopup('programmatic');
    else this.select.openPopup('pointer');
  }

  ngOnDestroy(): void {
    this.select.setTriggerElement(null);
  }
}
