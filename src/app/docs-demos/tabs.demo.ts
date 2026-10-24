import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-tabs-demo',
  imports: [TabsDirective, TabListDirective, TabDirective, TabPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tabs.demo.html',
})
export class TabsDemoComponent {
  readonly tab = signal<string | null>('account');
  readonly verticalTab = signal<string | null>('preview');
  readonly rtlTab = signal<string | null>('one');
}
