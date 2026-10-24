import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RadioDirective, RadioGroupDirective } from '@quartz-headless/primitives';

@Component({
  selector: 'app-radio-group-demo',
  imports: [RadioGroupDirective, RadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-group.demo.html',
})
export class RadioGroupDemoComponent {
  readonly plan = signal('pro');
  readonly density = signal('compact');
  readonly rtlValue = signal('center');
}
