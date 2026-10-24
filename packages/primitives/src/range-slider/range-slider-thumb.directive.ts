import { Directive, ElementRef, afterNextRender, computed, inject, input } from '@angular/core';
import { resolveDirection } from '@quartz-headless/core';
import { sliderKeyAction, warnUnnamedThumb } from '../slider/slider-interaction';
import { resolveSliderStep, sliderPageStep } from '../slider/slider-value';
import { RangeSliderDirective } from './range-slider.directive';
import type { RangeSliderThumbName } from './range-slider.types';

/** One thumb of a `qzRangeSlider`: `qzRangeSliderThumb="low"` or `qzRangeSliderThumb="high"`. */
@Directive({
  selector: '[qzRangeSliderThumb]',
  exportAs: 'qzRangeSliderThumb',
  standalone: true,
  host: {
    type: 'button',
    '[attr.role]': '"slider"',
    '[attr.tabindex]': 'slider.isDisabled() ? -1 : 0',
    '[attr.data-qz-range-thumb]': 'thumb()',
    '[attr.aria-valuemin]': 'valueMin()',
    '[attr.aria-valuemax]': 'valueMax()',
    '[attr.aria-valuenow]': 'value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-orientation]': 'slider.orientation()',
    '[attr.aria-disabled]': 'slider.isDisabled() || null',
    '[attr.disabled]': 'slider.isDisabled() ? "" : null',
    '[attr.data-qz-disabled]': 'slider.isDisabled() ? "" : null',
    '[attr.data-qz-orientation]': 'slider.orientation()',
    '[attr.data-qz-dragging]': 'slider.activeThumb() === thumb() ? "" : null',
    '[style.--qz-range-thumb-percent.%]': 'percent()',
    '(keydown)': 'onKeydown($event)',
    '(click)': '$event.preventDefault()',
  },
})
export class RangeSliderThumbDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly slider = inject(RangeSliderDirective);

  readonly thumb = input.required<RangeSliderThumbName>({ alias: 'qzRangeSliderThumb' });

  protected readonly value = computed(() => this.slider.range()[this.thumb()]);
  protected readonly percent = computed(() =>
    this.thumb() === 'low' ? this.slider.lowPercent() : this.slider.highPercent(),
  );
  /** A thumb is bounded by the other one (plus `minDistance`), not just by `min`/`max`. */
  protected readonly valueMin = computed(() =>
    this.thumb() === 'low' ? this.slider.bounds().min : this.slider.highMin(),
  );
  protected readonly valueMax = computed(() =>
    this.thumb() === 'low' ? this.slider.lowMax() : this.slider.bounds().max,
  );
  protected readonly valueText = computed(
    () => this.slider.valueText()?.(this.value(), this.thumb()) ?? null,
  );

  constructor() {
    afterNextRender(() => warnUnnamedThumb(this.elementRef.nativeElement, 'qzRangeSliderThumb'));
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.slider.isDisabled()) return;
    const thumb = this.thumb();
    const action = sliderKeyAction(
      event.key,
      this.slider.orientation(),
      resolveDirection(this.elementRef.nativeElement) === 'rtl',
    );
    if (!action) return;
    const { min, max } = this.slider.bounds();
    const step = resolveSliderStep(this.slider.step());
    const page = sliderPageStep(min, max, step);
    const current = this.slider.thumbValue(thumb);

    switch (action) {
      case 'min':
        this.slider.setThumb(thumb, min);
        break;
      case 'max':
        this.slider.setThumb(thumb, max);
        break;
      case 'page-up':
        this.slider.setThumb(thumb, current + page);
        break;
      case 'page-down':
        this.slider.setThumb(thumb, current - page);
        break;
      case 'increment':
        this.slider.setThumb(thumb, current + step);
        break;
      case 'decrement':
        this.slider.setThumb(thumb, current - step);
        break;
    }
    event.preventDefault();
  }
}
