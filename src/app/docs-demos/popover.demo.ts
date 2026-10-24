import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { PopoverDirective, PopoverTriggerDirective } from '@quartz-headless/primitives';
import type { OverlayPlacement } from '@quartz-headless/core';

@Component({
  selector: 'app-popover-demo',
  imports: [PopoverDirective, PopoverTriggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './popover.demo.html',
})
export class PopoverDemoComponent {
  readonly open = signal(false);
  readonly placement: OverlayPlacement = 'bottom-start';
}
