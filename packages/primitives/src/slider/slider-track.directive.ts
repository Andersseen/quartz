import { Directive } from '@angular/core';

@Directive({
  selector: '[qzSliderTrack]',
  exportAs: 'qzSliderTrack',
  standalone: true,
  host: {
    '[attr.data-qz-slider-track]': '""',
  },
})
export class SliderTrackDirective {}
