import { Directive } from '@angular/core';

/** The selected span between the thumbs. Position it with `--qz-range-low-percent` / `--qz-range-size-percent`. */
@Directive({
  selector: '[qzRangeSliderRange]',
  exportAs: 'qzRangeSliderRange',
  standalone: true,
  host: {
    '[attr.data-qz-range-slider-range]': '""',
  },
})
export class RangeSliderRangeDirective {}
