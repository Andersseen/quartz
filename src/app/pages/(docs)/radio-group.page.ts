import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RadioDirective, RadioGroupDirective } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './radio-group.snippets';

@Component({
  selector: 'app-radio-group-page',
  imports: [RadioGroupDirective, RadioDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './radio-group.page.html',
})
export default class RadioGroupPage {
  readonly plan = signal('pro');
  readonly density = signal('compact');
  readonly rtlValue = signal('center');
  readonly code = BASIC_SNIPPET;
}
