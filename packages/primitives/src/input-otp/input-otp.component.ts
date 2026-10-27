import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';

export interface InputOtpSlot {
  index: number;
  value: string;
  active: boolean;
  filled: boolean;
}

@Component({
  selector: 'qz-input-otp',
  exportAs: 'qzInputOtp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      #input
      class="qz-otp-input"
      type="text"
      [value]="value()"
      [attr.inputmode]="inputMode()"
      autocomplete="one-time-code"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="labelledBy() || null"
      [disabled]="isDisabled()"
      [readOnly]="readonly()"
      (input)="onInput($event)"
      (paste)="onPaste($event)"
      (compositionstart)="composing.set(true)"
      (compositionend)="onCompositionEnd($event)"
      (keyup)="updateActive($event)"
      (click)="updateActive($event)"
    />
    <span class="qz-otp-slots" aria-hidden="true">
      @for (slot of slots(); track slot.index) {
        <span
          class="qz-otp-slot"
          [attr.data-active]="slot.active ? '' : null"
          [attr.data-filled]="slot.filled ? '' : null"
          [attr.data-index]="slot.index"
          >{{ slot.value }}</span
        >
      }
    </span>
  `,
  host: {
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-readonly]': 'readonly() ? "" : null',
    '[attr.data-complete]': 'isComplete() ? "" : null',
  },
})
export class InputOtpComponent {
  readonly length = input(6);
  readonly pattern = input<RegExp>(/^\d$/);
  readonly inputMode = input<'text' | 'numeric' | 'decimal' | 'tel' | 'search' | 'email' | 'url'>(
    'numeric',
  );
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input('One-time code');
  readonly labelledBy = input('');
  readonly value = model('');
  readonly valueChangeCommitted = output<string>();
  readonly completed = output<string>();
  readonly composing = signal(false);
  readonly activeSlot = signal(0);
  readonly #formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());
  readonly isComplete = computed(() => this.value().length === this.slotCount());
  readonly slots = computed<InputOtpSlot[]>(() =>
    Array.from({ length: this.slotCount() }, (_, index) => ({
      index,
      value: Array.from(this.value())[index] ?? '',
      active: this.activeSlot() === index,
      filled: index < Array.from(this.value()).length,
    })),
  );

  #lastCompleted: string | null = null;

  constructor() {
    effect(() => {
      const current = this.value();
      const count = this.slotCount();
      if (!this.composing() && Array.from(current).length > count) {
        this.value.set(Array.from(current).slice(0, count).join(''));
      }
      if (!this.isComplete()) this.#lastCompleted = null;
    });
  }

  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  onInput(event: Event): void {
    if (this.composing() || this.isDisabled() || this.readonly()) return;
    const input = event.target as HTMLInputElement;
    this.commit(input.value, input);
  }

  onPaste(event: ClipboardEvent): void {
    if (this.composing() || this.isDisabled() || this.readonly()) return;
    const text = event.clipboardData?.getData('text');
    if (text == null) return;
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    const raw = input.value.slice(0, start) + text + input.value.slice(end);
    input.value = raw;
    const caret = start + text.length;
    input.setSelectionRange(caret, caret);
    this.commit(raw, input);
  }

  onCompositionEnd(event: CompositionEvent): void {
    this.composing.set(false);
    if (this.isDisabled() || this.readonly()) return;
    const input = event.target as HTMLInputElement;
    this.commit(input.value, input);
  }

  updateActive(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.activeSlot.set(Math.min(input.selectionStart ?? 0, this.slotCount() - 1));
  }

  private slotCount(): number {
    return Math.max(1, Math.floor(this.length()));
  }

  private commit(raw: string, input: HTMLInputElement): void {
    const count = this.slotCount();
    const selection = input.selectionStart ?? raw.length;
    const prefix = Array.from(raw.slice(0, selection)).filter((char) => this.accepts(char)).length;
    const next = Array.from(raw)
      .filter((char) => this.accepts(char))
      .slice(0, count)
      .join('');
    input.value = next;
    const caret = Math.min(prefix, next.length);
    input.setSelectionRange(caret, caret);
    this.activeSlot.set(Math.min(caret, count - 1));
    if (next !== this.value()) {
      this.value.set(next);
      this.valueChangeCommitted.emit(next);
    }
    if (next.length === count) {
      if (this.#lastCompleted !== next) this.completed.emit(next);
      this.#lastCompleted = next;
    } else this.#lastCompleted = null;
  }

  private accepts(char: string): boolean {
    const pattern = this.pattern();
    pattern.lastIndex = 0;
    return pattern.test(char);
  }
}
