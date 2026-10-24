import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';
import { resolveDirection } from '@quartz-headless/core';
import { SliderDirective } from './slider.directive';
import { sliderKeyAction, warnUnnamedThumb } from './slider-interaction';
import { sliderPageStep } from './slider-value';

@Directive({
  selector: '[qzSliderThumb]',
  exportAs: 'qzSliderThumb',
  standalone: true,
  host: {
    type: 'button',
    '[attr.role]': '"slider"',
    '[attr.tabindex]': 'slider.isDisabled() ? -1 : 0',
    '[attr.aria-valuemin]': 'slider.bounds().min',
    '[attr.aria-valuemax]': 'slider.bounds().max',
    '[attr.aria-valuenow]': 'slider.currentValue()',
    '[attr.aria-valuetext]': 'slider.ariaValueText()',
    '[attr.aria-orientation]': 'slider.orientation()',
    '[attr.aria-disabled]': 'slider.isDisabled() || null',
    '[attr.disabled]': 'slider.isDisabled() ? "" : null',
    '[attr.data-qz-disabled]': 'slider.isDisabled() ? "" : null',
    '[attr.data-qz-orientation]': 'slider.orientation()',
    '(keydown)': 'onKeydown($event)',
    '(click)': '$event.preventDefault()',
  },
})
export class SliderThumbDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly slider = inject(SliderDirective);

  constructor() {
    afterNextRender(() => warnUnnamedThumb(this.elementRef.nativeElement, 'qzSliderThumb'));
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.slider.isDisabled()) return;
    const action = sliderKeyAction(
      event.key,
      this.slider.orientation(),
      resolveDirection(this.elementRef.nativeElement) === 'rtl',
    );
    if (!action) return;
    const page = sliderPageStep(this.slider.min(), this.slider.max(), this.slider.step());

    switch (action) {
      case 'min':
        this.slider.setValue(this.slider.bounds().min);
        break;
      case 'max':
        this.slider.setValue(this.slider.bounds().max);
        break;
      case 'page-up':
        this.slider.setValue(this.slider.currentValue() + page);
        break;
      case 'page-down':
        this.slider.setValue(this.slider.currentValue() - page);
        break;
      case 'increment':
        this.slider.increment();
        break;
      case 'decrement':
        this.slider.decrement();
        break;
    }
    event.preventDefault();
  }
}
