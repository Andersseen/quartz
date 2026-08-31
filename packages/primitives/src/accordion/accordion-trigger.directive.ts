import { Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { AccordionItemDirective } from './accordion-item.directive';

@Directive({
  selector: '[qzAccordionTrigger]',
  exportAs: 'qzAccordionTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.id]': 'item.id',
    '[attr.aria-expanded]': 'item.open()',
    '[attr.aria-controls]': 'item.panelId',
    '[attr.aria-disabled]': 'item.itemDisabled() || null',
    '[attr.tabindex]': 'item.itemDisabled() ? -1 : item.activeTabIndex()',
    '[attr.disabled]': 'item.itemDisabled() ? "" : null',
    '[attr.data-qz-state]': 'item.open() ? "open" : "closed"',
    '[attr.data-qz-disabled]': 'item.itemDisabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class AccordionTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly item = inject(AccordionItemDirective);

  constructor() {
    this.item.setTriggerElement(this.elementRef.nativeElement);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.item.toggle();
  }

  onFocus(): void {
    this.item.setActive();
  }

  onKeydown(event: KeyboardEvent): void {
    this.item.handleKeydown(event);
  }

  ngOnDestroy(): void {
    this.item.setTriggerElement(null);
  }
}
