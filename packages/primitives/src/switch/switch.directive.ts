import { Directive, booleanAttribute, input, model, output } from '@angular/core';

@Directive({
  // Button-first only (see docs/ai/STABILITY_AUDIT.md): relies on native tabindex,
  // disabled, and Enter/Space-to-click semantics. A bare attribute selector would compile
  // on any element while only half-supporting it (no tabindex, no full keyboard handling).
  selector: 'button[qzSwitch]',
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
  // Named to match the <model>ChangeCommitted convention used by Checkbox
  // (checkedChangeCommitted) and Toggle (pressedChangeCommitted) — was `toggled`.
  readonly checkedChangeCommitted = output<boolean>();

  toggle(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    const next = !this.checked();
    this.checked.set(next);
    this.checkedChangeCommitted.emit(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON') return;
    event.preventDefault();
    this.toggle();
  }
}
