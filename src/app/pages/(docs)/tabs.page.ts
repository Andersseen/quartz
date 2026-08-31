import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET, MANUAL_SNIPPET } from './tabs.snippets';

@Component({
  selector: 'app-tabs-page',
  imports: [
    TabsDirective,
    TabListDirective,
    TabDirective,
    TabPanelDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.page.html',
})
export default class TabsPage {
  readonly tab = signal<string | null>('account');
  readonly verticalTab = signal<string | null>('preview');
  readonly rtlTab = signal<string | null>('one');
  readonly basicCode = BASIC_SNIPPET;
  readonly manualCode = MANUAL_SNIPPET;
}
