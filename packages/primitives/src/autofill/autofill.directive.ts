import { Directive, ElementRef, computed, inject, input, output, signal } from '@angular/core';

/** Detects supported browser autofill CSS animation transitions; this is best-effort. */
@Directive({
  selector: 'input[qzAutofill], textarea[qzAutofill]',
  exportAs: 'qzAutofill',
  standalone: true,
  host: {
    '[attr.data-autofilled]': 'autofilled() ? "" : null',
    '(animationstart)': 'onAnimationStart($event)',
    '(animationend)': 'onAnimationEnd($event)',
    '(input)': 'onNativeInput()',
  },
})
export class AutofillDirective {
  readonly startAnimationName = input('qz-autofill-start');
  readonly cancelAnimationName = input('qz-autofill-cancel');
  readonly autofilledChange = output<boolean>();

  readonly #autofilled = signal(false);
  readonly autofilled = computed(() => this.#autofilled());
  private readonly host = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>).nativeElement;
  #lastValue = this.host.value;

  onAnimationStart(event: Event): void {
    const animationName = (event as AnimationEvent).animationName;
    if (animationName === this.startAnimationName()) {
      this.setAutofilled(true);
      this.syncAutofilledValue();
    } else if (animationName === this.cancelAnimationName()) this.setAutofilled(false);
  }

  onAnimationEnd(event: Event): void {
    if ((event as AnimationEvent).animationName === this.cancelAnimationName())
      this.setAutofilled(false);
  }

  onNativeInput(): void {
    this.#lastValue = this.host.value;
  }

  private syncAutofilledValue(): void {
    const value = this.host.value;
    if (value === this.#lastValue) return;
    this.#lastValue = value;
    // Some browsers change the native value without dispatching input. Only a detected
    // autofill transition causes this event, so ordinary programmatic writes stay silent.
    this.host.dispatchEvent(new Event('input', { bubbles: true }));
  }

  private setAutofilled(value: boolean): void {
    if (this.#autofilled() === value) return;
    this.#autofilled.set(value);
    this.autofilledChange.emit(value);
  }
}
