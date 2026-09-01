import { Directive, ElementRef, inject } from '@angular/core';
import { resolveDirection } from '@quartz-headless/core';
import { SliderDirective } from './slider.directive';

@Directive({
  selector: '[qzSliderThumb]',
  exportAs: 'qzSliderThumb',
  standalone: true,
  host: {
    type: 'button',
    '[attr.role]': '"slider"',
    '[attr.tabindex]': 'slider.disabled() ? -1 : 0',
    '[attr.aria-valuemin]': 'slider.min()',
    '[attr.aria-valuemax]': 'slider.max()',
    '[attr.aria-valuenow]': 'slider.currentValue()',
    '[attr.aria-valuetext]': 'slider.ariaValueText()',
    '[attr.aria-orientation]': 'slider.orientation()',
    '[attr.aria-disabled]': 'slider.disabled() || null',
    '[attr.disabled]': 'slider.disabled() ? "" : null',
    '[attr.data-qz-disabled]': 'slider.disabled() ? "" : null',
    '[attr.data-qz-orientation]': 'slider.orientation()',
    '(keydown)': 'onKeydown($event)',
    '(click)': '$event.preventDefault()',
  },
})
export class SliderThumbDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly slider = inject(SliderDirective);

  onKeydown(event: KeyboardEvent): void {
    if (this.slider.disabled()) return;
    const page = Math.max(this.slider.step(), (this.slider.max() - this.slider.min()) / 10);
    const horizontal = this.slider.orientation() === 'horizontal';
    const rtl = resolveDirection(this.elementRef.nativeElement) === 'rtl';
    let handled = true;

    switch (event.key) {
      case 'Home':
        this.slider.setValue(this.slider.min());
        break;
      case 'End':
        this.slider.setValue(this.slider.max());
        break;
      case 'PageUp':
        this.slider.setValue(this.slider.currentValue() + page);
        break;
      case 'PageDown':
        this.slider.setValue(this.slider.currentValue() - page);
        break;
      case 'ArrowUp':
        this.slider.increment();
        break;
      case 'ArrowDown':
        this.slider.decrement();
        break;
      case 'ArrowRight':
        horizontal && rtl ? this.slider.decrement() : this.slider.increment();
        break;
      case 'ArrowLeft':
        horizontal && rtl ? this.slider.increment() : this.slider.decrement();
        break;
      default:
        handled = false;
    }

    if (handled) event.preventDefault();
  }
}
