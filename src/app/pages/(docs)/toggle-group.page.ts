import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ToggleGroupDirective, ToggleItemDirective } from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './toggle-group.snippets';

@Component({
  selector: 'app-toggle-group-page',
  imports: [ToggleGroupDirective, ToggleItemDirective, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toggle-group.page.html',
})
export default class ToggleGroupPage {
  readonly alignment = signal<string | readonly string[] | null>('left');
  readonly formats = signal<string | readonly string[] | null>(['bold']);
  readonly rtl = signal<string | readonly string[] | null>('center');
  readonly code = BASIC_SNIPPET;
}
