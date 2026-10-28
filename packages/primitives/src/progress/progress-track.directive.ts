import { Directive } from '@angular/core';
@Directive({
  selector: '[qzProgressTrack]',
  standalone: true,
  host: { '[attr.data-qz-part]': '"track"' },
})
export class ProgressTrackDirective {}
