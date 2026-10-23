import { Directive, booleanAttribute, computed, input, model, output, signal } from '@angular/core';

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
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.disabled]': 'isDisabled() ? "" : null',
    '[attr.data-qz-state]': 'checked() ? "checked" : "unchecked"',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
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

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  toggle(event?: Event): void {
    if (this.isDisabled()) return;
    event?.preventDefault();
    const next = !this.checked();
    this.checked.set(next);
    this.checkedChangeCommitted.emit(next);
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target as HTMLElement | null;
    if (target?.tagName === 'BUTTON') return;
    event.preventDefault();
    this.toggle();
  }
}
