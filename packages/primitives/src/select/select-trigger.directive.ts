import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { SelectDirective } from './select.directive';

let selectTriggerId = 0;

@Directive({
  selector: '[qzSelectTrigger]',
  exportAs: 'qzSelectTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-expanded]': 'select.isOpen()',
    '[attr.aria-controls]': 'select.panelId()',
    '[attr.aria-disabled]': 'select.isDisabled() || null',
    '[attr.data-qz-open]': 'select.isOpen() ? "" : null',
    '[attr.data-qz-disabled]': 'select.isDisabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(keydown)': 'select.handleTriggerKeydown($event)',
    '(blur)': 'select.onTriggerBlur()',
  },
})
export class SelectTriggerDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly select = inject(SelectDirective);

  constructor() {
    this.select.setTriggerElement(this.elementRef.nativeElement);
  }

  ngOnInit(): void {
    const element = this.elementRef.nativeElement;
    // Keep a consumer-provided id; otherwise generate one so the popup can reference the trigger.
    if (!element.id) element.id = `qz-select-trigger-${++selectTriggerId}`;
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
