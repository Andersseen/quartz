import { Directive, inject } from '@angular/core';
import { ProgressDirective } from './progress.directive';
@Directive({
  selector: '[qzProgressIndicator]',
  standalone: true,
  host: {
    '[attr.data-qz-part]': '"indicator"',
    '[attr.data-qz-state]': 'progress.indeterminate() ? "indeterminate" : "determinate"',
    '[style.--qz-progress-percent.%]': 'progress.percentage()',
    '[style.width.%]': 'progress.indeterminate() ? null : progress.percentage()',
  },
})
export class ProgressIndicatorDirective {
  protected readonly progress = inject(ProgressDirective);
}
