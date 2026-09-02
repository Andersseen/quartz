import { Directive, booleanAttribute, input, model, output } from '@angular/core';

@Directive({
  // Button-first only (see docs/ai/STABILITY_AUDIT.md): relies on native tabindex,
  // disabled, and Enter/Space-to-click semantics — this directive doesn't even bind its
  // own keydown handler, so a non-button host had zero keyboard support at all.
  selector: 'button[qzToggle]',
  exportAs: 'qzToggle',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-state]': 'pressed() ? "on" : "off"',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle($event)',
  },
})
export class ToggleDirective {
  readonly pressed = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressedChangeCommitted = output<boolean>();

  toggle(event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    const next = !this.pressed();
    this.pressed.set(next);
    this.pressedChangeCommitted.emit(next);
  }
}
