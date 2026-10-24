import { Directive } from '@angular/core';

@Directive({
  selector: '[qzRangeSliderTrack]',
  exportAs: 'qzRangeSliderTrack',
  standalone: true,
  host: {
    '[attr.data-qz-range-slider-track]': '""',
  },
})
export class RangeSliderTrackDirective {}
