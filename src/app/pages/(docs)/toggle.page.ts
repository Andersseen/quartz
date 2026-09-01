import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToggleDirective } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './toggle.snippets';

@Component({
  selector: 'app-toggle-page',
  imports: [ToggleDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle.page.html',
})
export default class TogglePage {
  readonly bold = signal(false);
  readonly code = BASIC_SNIPPET;
}
