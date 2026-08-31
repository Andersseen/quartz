import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SwitchDirective } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './switch.snippets';

@Component({
  selector: 'app-switch-page',
  imports: [SwitchDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './switch.page.html',
})
export default class SwitchPage {
  readonly enabled = signal(false);
  readonly controlled = signal(true);
  readonly code = BASIC_SNIPPET;
}
