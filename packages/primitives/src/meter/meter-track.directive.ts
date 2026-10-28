import { Directive } from '@angular/core';
@Directive({
  selector: '[qzMeterTrack]',
  standalone: true,
  host: { '[attr.data-qz-part]': '"track"' },
})
export class MeterTrackDirective {}
