import { Directive, ElementRef, OnDestroy, effect, inject } from '@angular/core';
import { ComboboxDirective } from './combobox.directive';

@Directive({
  selector: 'input[qzComboboxInput]',
  exportAs: 'qzComboboxInput',
  standalone: true,
  host: {
    '[attr.role]': '"combobox"',
    '[attr.aria-expanded]': 'combobox.isOpen()',
    '[attr.aria-controls]': 'combobox.panelId()',
    '[attr.aria-activedescendant]': 'combobox.activeId()',
    '[attr.aria-autocomplete]': 'combobox.autocomplete()',
    '[attr.aria-disabled]': 'combobox.disabled() || null',
    '[attr.data-qz-open]': 'combobox.isOpen() ? "" : null',
    '[attr.data-qz-disabled]': 'combobox.disabled() ? "" : null',
    '(input)': 'onInput($event)',
    '(focus)': 'onFocus()',
    '(keydown)': 'onKeydown($event)',
    '(compositionstart)': 'onCompositionStart()',
    '(compositionend)': 'onCompositionEnd($event)',
  },
})
export class ComboboxInputDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);
  readonly combobox = inject(ComboboxDirective);

  constructor() {
    this.combobox.setInputElement(this.elementRef.nativeElement);
    effect(() => {
      const value = this.combobox.inputValue();
      if (this.elementRef.nativeElement.value !== value) {
        this.elementRef.nativeElement.value = value;
      }
    });
  }

  onInput(event: Event): void {
    this.combobox.handleInput((event.target as HTMLInputElement).value);
  }

  onFocus(): void {
    this.combobox.handleFocus();
  }

  onKeydown(event: KeyboardEvent): void {
    this.combobox.handleKeydown(event);
  }

  onCompositionStart(): void {
    this.combobox.startComposition();
  }

  onCompositionEnd(event: CompositionEvent): void {
    this.combobox.endComposition((event.target as HTMLInputElement).value);
  }

  ngOnDestroy(): void {
    this.combobox.setInputElement(null);
  }
}
