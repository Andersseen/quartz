import { Directive } from '@angular/core';

@Directive({
  selector: '[qzSliderRange]',
  exportAs: 'qzSliderRange',
  standalone: true,
  host: {
    '[attr.data-qz-slider-range]': '""',
  },
})
export class SliderRangeDirective {}
