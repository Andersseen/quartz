import { Directive, booleanAttribute, computed, input, model, output, signal } from '@angular/core';

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
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-qz-state]': 'pressed() ? "on" : "off"',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '(click)': 'toggle($event)',
  },
})
export class ToggleDirective {
  readonly pressed = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Emits once per user activation (click, Enter, Space). Programmatic `pressed` writes are silent. */
  readonly pressedChangeCommitted = output<boolean>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  toggle(event?: Event): void {
    if (this.isDisabled()) return;
    event?.preventDefault();
    const next = !this.pressed();
    this.pressed.set(next);
    this.pressedChangeCommitted.emit(next);
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }
}
