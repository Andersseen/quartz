import { Directive, booleanAttribute, input, model, output } from '@angular/core';

@Directive({
  selector: '[qzSwitch]',
  exportAs: 'qzSwitch',
  standalone: true,
  host: {
    type: 'button',
    '[attr.role]': '"switch"',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-state]': 'checked() ? "checked" : "unchecked"',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class SwitchDirective {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly toggled = output<boolean>();

  toggle(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    const next = !this.checked();
    this.checked.set(next);
    this.toggled.emit(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON') return;
    event.preventDefault();
    this.toggle();
  }
}
