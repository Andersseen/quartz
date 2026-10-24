import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StepDirective,
  StepPanelDirective,
  StepTriggerDirective,
  StepperDirective,
  StepperNextDirective,
  StepperPreviousDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-stepper-demo',
  imports: [
    StepperDirective,
    StepDirective,
    StepTriggerDirective,
    StepPanelDirective,
    StepperNextDirective,
    StepperPreviousDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.demo.html',
})
export class StepperDemoComponent {
  readonly step = signal<string | null>('account');
  readonly verticalStep = signal<string | null>('plan');
  readonly accountDone = signal(false);
  readonly profileDone = signal(false);
}
