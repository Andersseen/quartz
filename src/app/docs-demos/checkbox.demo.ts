import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CheckboxDirective, type CheckboxState } from '@quartz-headless/primitives';

@Component({
  selector: 'app-checkbox-demo',
  imports: [CheckboxDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.demo.html',
})
export class CheckboxDemoComponent {
  readonly accepted = signal(false);
  readonly selectAll = signal<CheckboxState>('indeterminate');
}
