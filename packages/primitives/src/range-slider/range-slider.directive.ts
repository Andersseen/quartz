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
import { pointerPercent } from '../slider/slider-interaction';
import {
  resolveSliderBounds,
  sliderPercent,
  snapSliderValue,
  valueFromPercent,
} from '../slider/slider-value';
import {
  DEFAULT_RANGE_SLIDER_CONFIG,
  type RangeSliderOrientation,
  type RangeSliderThumbName,
  type RangeSliderValue,
} from './range-slider.types';

/**
 * Two-thumb slider root. The model is two signals, `low` and `high` (two-way bindable as
 * `[(low)]` / `[(high)]`); the canonical combined value is `{ low, high }`.
 *
 * Invariants (applied to whatever is written to the models): both values are snapped to the step
 * grid within `min..max`, and `high - low >= minDistance` with `low <= high`. When an external
 * write breaks them, `high` wins and `low` is pulled back (or `high` pushed up at `min`).
 * A user action moves only the thumb it targets, clamped against the other; it never moves both.
 *
 * `valueChangeCommitted` fires once per **user** change. Programmatic writes are silent.
 */
@Directive({
  selector: '[qzRangeSlider]',
  exportAs: 'qzRangeSlider',
  standalone: true,
  host: {
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '[attr.data-qz-dragging]': 'dragging() ? "" : null',
    '[style.--qz-range-low-percent.%]': 'lowPercent()',
    '[style.--qz-range-high-percent.%]': 'highPercent()',
    '[style.--qz-range-size-percent.%]': 'highPercent() - lowPercent()',
    '[style.--qz-range-low]': 'range().low',
    '[style.--qz-range-high]': 'range().high',
    '[style.touch-action]': '"none"',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerEnd($event)',
    '(pointercancel)': 'onPointerEnd($event)',
    '(lostpointercapture)': 'onPointerEnd($event)',
  },
})
export class RangeSliderDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private pointerId: number | null = null;

  readonly low = model(DEFAULT_RANGE_SLIDER_CONFIG.min);
  readonly high = model(DEFAULT_RANGE_SLIDER_CONFIG.max);
  readonly min = input(DEFAULT_RANGE_SLIDER_CONFIG.min);
  readonly max = input(DEFAULT_RANGE_SLIDER_CONFIG.max);
  readonly step = input(DEFAULT_RANGE_SLIDER_CONFIG.step);
  readonly minDistance = input(DEFAULT_RANGE_SLIDER_CONFIG.minDistance);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<RangeSliderOrientation>(DEFAULT_RANGE_SLIDER_CONFIG.orientation);
  readonly valueText = input<((value: number, thumb: RangeSliderThumbName) => string) | null>(null);
  readonly dragging = model(false);
  /** Thumb being dragged by the active pointer gesture, or `null`. */
  readonly activeThumb = signal<RangeSliderThumbName | null>(null);
  /** Emits the new `{ low, high }` once per user change. */
  readonly valueChangeCommitted = output<RangeSliderValue>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  readonly bounds = computed(() => resolveSliderBounds(this.min(), this.max()));
  /** `minDistance` repaired to `0..(max - min)`. */
  readonly distance = computed(() => {
    const { min, max } = this.bounds();
    const value = this.minDistance();
    return Number.isFinite(value) ? Math.min(max - min, Math.max(0, value)) : 0;
  });

  /** Effective, constraint-satisfying values. */
  readonly range = computed<RangeSliderValue>(() => {
    const { min, max } = this.bounds();
    const step = this.step();
    const distance = this.distance();
    const tolerance = 1e-9 * Math.max(1, max - min);
    let high = snapSliderValue(this.high(), min, max, step);
    let low = snapSliderValue(this.low(), min, max, step);
    if (high - low < distance - tolerance) {
      low = snapSliderValue(high - distance, min, max, step, 'floor');
      if (high - low < distance - tolerance) {
        high = snapSliderValue(low + distance, min, max, step, 'ceil');
      }
    }
    return { low, high };
  });

  /** Highest value the low thumb may take (`high - minDistance`, on the step grid). */
  readonly lowMax = computed(() => this.#limit('low'));
  /** Lowest value the high thumb may take (`low + minDistance`, on the step grid). */
  readonly highMin = computed(() => this.#limit('high'));
  readonly lowPercent = computed(() => sliderPercent(this.range().low, this.min(), this.max()));
  readonly highPercent = computed(() => sliderPercent(this.range().high, this.min(), this.max()));

  constructor() {
    effect(() => {
      if (this.isDisabled()) this.endGesture();
    });
  }

  /** User command for one thumb: clamps against the other thumb, writes its model, emits on change. */
  setThumb(thumb: RangeSliderThumbName, value: number): void {
    if (this.isDisabled()) return;
    const { min, max } = this.bounds();
    const current = this.range();
    const snapped = snapSliderValue(value, min, max, this.step());
    const next =
      thumb === 'low' ? Math.min(snapped, this.lowMax()) : Math.max(snapped, this.highMin());
    // Persist the repaired pair so no hidden out-of-range raw value outlives a user action.
    if (this.low() !== (thumb === 'low' ? next : current.low)) {
      this.low.set(thumb === 'low' ? next : current.low);
    }
    if (this.high() !== (thumb === 'high' ? next : current.high)) {
      this.high.set(thumb === 'high' ? next : current.high);
    }
    if (next !== current[thumb]) {
      this.valueChangeCommitted.emit(this.range());
    }
  }

  /** Thumb value after a key step; used by the thumb directive. */
  thumbValue(thumb: RangeSliderThumbName): number {
    return this.range()[thumb];
  }

  /** Adapter hook for `@quartz-headless/primitives/forms`: silent, `null` resets to the full range. */
  writeFormValue(value: RangeSliderValue | null | undefined): void {
    const { min, max } = this.bounds();
    const next = value ?? { low: min, high: max };
    if (typeof next.low !== 'number' || typeof next.high !== 'number') return;
    this.low.set(next.low);
    this.high.set(next.high);
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.isDisabled() || !this.document.defaultView) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (this.pointerId !== null) return;
    const percent = pointerPercent(this.elementRef.nativeElement, event, this.orientation());
    if (percent === null) return;
    event.preventDefault();
    const { min, max } = this.bounds();
    const pointerValue = min + (max - min) * (percent / 100);
    const thumb = this.thumbFromTarget(event.target) ?? this.nearestThumb(pointerValue);
    this.pointerId = event.pointerId;
    this.activeThumb.set(thumb);
    this.dragging.set(true);
    this.elementRef.nativeElement.setPointerCapture?.(event.pointerId);
    this.thumbElement(thumb)?.focus({ preventScroll: true });
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

  /**
   * Nearest thumb to the pointer value. Ties: `low` wins, except when the thumbs coincide, where
   * the side the pointer is on decides (a coincident pair at `max` can only be dragged by `low`).
   */
  private nearestThumb(pointerValue: number): RangeSliderThumbName {
    const { low, high } = this.range();
    if (low === high) {
      if (pointerValue < low) return 'low';
      if (pointerValue > high) return 'high';
      return low >= this.bounds().max ? 'low' : 'high';
    }
    return Math.abs(pointerValue - high) < Math.abs(pointerValue - low) ? 'high' : 'low';
  }

  private thumbFromTarget(target: EventTarget | null): RangeSliderThumbName | null {
    const host = this.elementRef.nativeElement;
    const name = (target as Element | null)
      ?.closest?.('[data-qz-range-thumb]')
      ?.getAttribute('data-qz-range-thumb');
    if (name !== 'low' && name !== 'high') return null;
    return host.contains(target as Node) ? name : null;
  }

  private thumbElement(thumb: RangeSliderThumbName): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>(
      `[data-qz-range-thumb="${thumb}"]`,
    );
  }

  private endGesture(): void {
    const id = this.pointerId;
    if (id === null) return;
    this.pointerId = null;
    const host = this.elementRef.nativeElement;
    if (host.hasPointerCapture?.(id)) host.releasePointerCapture?.(id);
    this.activeThumb.set(null);
    this.dragging.set(false);
  }

  private updateFromPointer(event: PointerEvent): void {
    const thumb = this.activeThumb();
    if (!thumb) return;
    const percent = pointerPercent(this.elementRef.nativeElement, event, this.orientation());
    if (percent === null) return;
    const { min, max } = this.bounds();
    this.setThumb(thumb, valueFromPercent(percent, min, max, this.step()));
  }

  #limit(thumb: RangeSliderThumbName): number {
    const { min, max } = this.bounds();
    const { low, high } = this.range();
    return thumb === 'low'
      ? snapSliderValue(high - this.distance(), min, max, this.step(), 'floor')
      : snapSliderValue(low + this.distance(), min, max, this.step(), 'ceil');
  }
}
