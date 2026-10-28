import { Directive, inject } from '@angular/core';
import { MeterDirective } from './meter.directive';
@Directive({
  selector: '[qzMeterIndicator]',
  standalone: true,
  host: { '[attr.data-qz-part]': '"indicator"', '[style.width.%]': 'meter.percentage()' },
})
export class MeterIndicatorDirective {
  protected readonly meter = inject(MeterDirective);
}
