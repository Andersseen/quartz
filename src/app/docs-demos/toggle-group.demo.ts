import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToggleGroupDirective, ToggleItemDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-toggle-group-demo',
  imports: [ToggleGroupDirective, ToggleItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle-group.demo.html',
})
export class ToggleGroupDemoComponent {
  readonly alignment = signal<string | readonly string[] | null>('left');
  readonly formats = signal<string | readonly string[] | null>(['bold']);
  readonly rtl = signal<string | readonly string[] | null>('center');
}
