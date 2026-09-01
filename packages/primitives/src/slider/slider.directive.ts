import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { resolveDirection } from '@quartz-headless/core';
import { DEFAULT_SLIDER_CONFIG, type SliderOrientation } from './slider.types';
import { normalizeSliderValue, sliderPercent, valueFromPercent } from './slider-value';

@Directive({
  selector: '[qzSlider]',
  exportAs: 'qzSlider',
  standalone: true,
  host: {
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-dragging]': 'dragging() ? "" : null',
    '[style.--qz-slider-percent.%]': 'percent()',
    '[style.--qz-slider-value]': 'currentValue()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
  },
})
export class SliderDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private pointerId: number | null = null;

  readonly value = model(DEFAULT_SLIDER_CONFIG.min);
  readonly min = input(DEFAULT_SLIDER_CONFIG.min);
  readonly max = input(DEFAULT_SLIDER_CONFIG.max);
  readonly step = input(DEFAULT_SLIDER_CONFIG.step);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<SliderOrientation>(DEFAULT_SLIDER_CONFIG.orientation);
  readonly valueText = input<((value: number) => string) | null>(null);
  readonly dragging = model(false);

  readonly currentValue = computed(() =>
    normalizeSliderValue(this.value(), this.min(), this.max(), this.step()),
  );
  readonly percent = computed(() => sliderPercent(this.currentValue(), this.min(), this.max()));
  readonly ariaValueText = computed(() => this.valueText()?.(this.currentValue()) ?? null);

  setValue(value: number): void {
    if (this.disabled()) return;
    this.value.set(normalizeSliderValue(value, this.min(), this.max(), this.step()));
  }

  increment(multiplier = 1): void {
    this.setValue(this.currentValue() + this.step() * multiplier);
  }

  decrement(multiplier = 1): void {
    this.setValue(this.currentValue() - this.step() * multiplier);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.disabled() || !this.document.defaultView) return;
    event.preventDefault();
    this.pointerId = event.pointerId;
    this.dragging.set(true);
    this.elementRef.nativeElement.setPointerCapture?.(event.pointerId);
    this.updateFromPointer(event);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.disabled() || this.pointerId !== event.pointerId) return;
    event.preventDefault();
    this.updateFromPointer(event);
  }

  onPointerEnd(event: PointerEvent): void {
    if (this.pointerId !== event.pointerId) return;
    this.elementRef.nativeElement.releasePointerCapture?.(event.pointerId);
    this.pointerId = null;
    this.dragging.set(false);
  }

  ngOnDestroy(): void {
    if (this.pointerId !== null) {
      this.elementRef.nativeElement.releasePointerCapture?.(this.pointerId);
      this.pointerId = null;
    }
    this.dragging.set(false);
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const percent =
      this.orientation() === 'vertical'
        ? ((rect.bottom - event.clientY) / rect.height) * 100
        : this.horizontalPointerPercent(event.clientX, rect);
    this.setValue(
      valueFromPercent(Math.min(100, Math.max(0, percent)), this.min(), this.max(), this.step()),
    );
  }

  private horizontalPointerPercent(clientX: number, rect: DOMRect): number {
    const physical = ((clientX - rect.left) / rect.width) * 100;
    return resolveDirection(this.elementRef.nativeElement) === 'rtl' ? 100 - physical : physical;
  }
}
