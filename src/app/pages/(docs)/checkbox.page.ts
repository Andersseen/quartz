import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CheckboxDirective, type CheckboxState } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET, INDETERMINATE_SNIPPET } from './checkbox.snippets';

@Component({
  selector: 'app-checkbox-page',
  imports: [CheckboxDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkbox.page.html',
})
export default class CheckboxPage {
  readonly accepted = signal(false);
  readonly selectAll = signal<CheckboxState>('indeterminate');
  readonly basicCode = BASIC_SNIPPET;
  readonly indeterminateCode = INDETERMINATE_SNIPPET;
}
