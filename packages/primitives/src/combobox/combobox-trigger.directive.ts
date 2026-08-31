import { Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';
import { ComboboxDirective } from './combobox.directive';

@Directive({
  selector: '[qzComboboxTrigger]',
  exportAs: 'qzComboboxTrigger',
  standalone: true,
  host: {
    '[attr.tabindex]': '-1',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-controls]': 'combobox.panelId()',
    '[attr.aria-expanded]': 'combobox.isOpen()',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '(click)': 'onClick($event)',
  },
})
export class ComboboxTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly combobox = inject(ComboboxDirective);
  readonly ariaLabel = input('Toggle suggestions');

  constructor() {
    this.combobox.setTriggerElement(this.elementRef.nativeElement);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.combobox.togglePopup();
  }

  ngOnDestroy(): void {
    this.combobox.setTriggerElement(null);
  }
}
