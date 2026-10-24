import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SwitchDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-switch-demo',
  imports: [SwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './switch.demo.html',
})
export class SwitchDemoComponent {
  readonly enabled = signal(false);
  readonly controlled = signal(true);
}
