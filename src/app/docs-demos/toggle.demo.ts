import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToggleDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-toggle-demo',
  imports: [ToggleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle.demo.html',
})
export class ToggleDemoComponent {
  readonly bold = signal(false);
}
