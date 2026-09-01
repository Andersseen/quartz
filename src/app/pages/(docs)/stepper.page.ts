import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  StepDirective,
  StepPanelDirective,
  StepTriggerDirective,
  StepperDirective,
  StepperNextDirective,
  StepperPreviousDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { STEPPER_SNIPPET } from './stepper.snippets';

@Component({
  selector: 'app-stepper-page',
  imports: [
    StepperDirective,
    StepDirective,
    StepTriggerDirective,
    StepPanelDirective,
    StepperNextDirective,
    StepperPreviousDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stepper.page.html',
})
export default class StepperPage {
  readonly step = signal<string | null>('account');
  readonly verticalStep = signal<string | null>('plan');
  readonly accountDone = signal(false);
  readonly profileDone = signal(false);
  readonly code = STEPPER_SNIPPET;
}
