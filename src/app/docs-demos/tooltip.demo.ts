import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TooltipDirective, type TooltipPlacement } from '@quartz-headless/primitives';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-tooltip-demo',
  imports: [TooltipDirective, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooltip.demo.html',
})
export class TooltipDemoComponent {
  readonly placements: { label: string; value: TooltipPlacement }[] = [
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ];
}
