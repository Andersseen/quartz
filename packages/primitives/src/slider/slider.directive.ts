import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { DEFAULT_SLIDER_CONFIG, type SliderOrientation } from './slider.types';
import { pointerPercent } from './slider-interaction';
import {
  normalizeSliderValue,
  resolveSliderBounds,
  resolveSliderStep,
  sliderPercent,
  valueFromPercent,
} from './slider-value';

/**
 * Single-thumb slider root. `value` is the model; `valueChangeCommitted` fires once per **user**
 * change (each key step, and each distinct value reached while dragging). Programmatic writes to
 * `value` are silent. During a drag the pointer position always wins: an external write applies
 * immediately but the next `pointermove` of the active gesture overrides it.
 */
@Directive({
  selector: '[qzSlider]',
  exportAs: 'qzSlider',
  standalone: true,
  host: {
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-qz-dragging]': 'dragging() ? "" : null',
    '[style.--qz-slider-percent.%]': 'percent()',
    '[style.--qz-slider-value]': 'currentValue()',
    '[style.touch-action]': '"none"',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '(lostpointercapture)': 'onPointerEnd($event)',
  },
})
export class SliderDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private pointerId: number | null = null;

  readonly value = model(DEFAULT_SLIDER_CONFIG.min);
  readonly min = input(DEFAULT_SLIDER_CONFIG.min);
  readonly max = input(DEFAULT_SLIDER_CONFIG.max);
  readonly step = input(DEFAULT_SLIDER_CONFIG.step);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<SliderOrientation>(DEFAULT_SLIDER_CONFIG.orientation);
  readonly valueText = input<((value: number) => string) | null>(null);
  readonly dragging = model(false);
  /** Emits the new value once per user change (keyboard step, or a new value reached by pointer). */
  readonly valueChangeCommitted = output<number>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  /** Repaired bounds: swapped or non-finite `min`/`max` inputs are normalized here. */
  readonly bounds = computed(() => resolveSliderBounds(this.min(), this.max()));
  readonly currentValue = computed(() =>
    normalizeSliderValue(this.value(), this.min(), this.max(), this.step()),
  );
  readonly percent = computed(() => sliderPercent(this.currentValue(), this.min(), this.max()));
  readonly ariaValueText = computed(() => this.valueText()?.(this.currentValue()) ?? null);

  constructor() {
    // Disabling mid-gesture cancels it; a cancelled drag must never leave `dragging` active.
    effect(() => {
      if (this.isDisabled()) this.endGesture();
    });
  }

  /** User command: normalize, write the model and emit when the effective value changed. */
  setValue(value: number): void {
    if (this.isDisabled()) return;
    const previous = this.currentValue();
    const next = normalizeSliderValue(value, this.min(), this.max(), this.step());
    if (this.value() !== next) this.value.set(next);
    if (next !== previous) this.valueChangeCommitted.emit(next);
  }

  increment(multiplier = 1): void {
    this.setValue(this.currentValue() + resolveSliderStep(this.step()) * multiplier);
  }

  decrement(multiplier = 1): void {
    this.setValue(this.currentValue() - resolveSliderStep(this.step()) * multiplier);
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isDisabled() || !this.document.defaultView) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (this.pointerId !== null) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.dragging.set(true);
    this.elementRef.nativeElement.setPointerCapture?.(event.pointerId);
    this.focusThumb();
    this.updateFromPointer(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.isDisabled() || this.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.updateFromPointer(event);
  }

  onPointerEnd(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.endGesture();
  }

  ngOnDestroy(): void {
    this.endGesture();
  }

  private endGesture(): void {
    const id = this.pointerId;
    if (id === null) return;
    this.pointerId = null;
    const host = this.elementRef.nativeElement;
    if (host.hasPointerCapture?.(id)) host.releasePointerCapture?.(id);
    this.dragging.set(false);
  }

  private focusThumb(): void {
    this.elementRef.nativeElement.querySelector<HTMLElement>('[role="slider"]')?.focus({
      preventScroll: true,
    });
  }

  private updateFromPointer(event: PointerEvent): void {
    const percent = pointerPercent(this.elementRef.nativeElement, event, this.orientation());
    if (percent === null) return;
    this.setValue(valueFromPercent(percent, this.min(), this.max(), this.step()));
  }
}
