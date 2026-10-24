import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-sidebar-demo',
  imports: [
    SidebarDirective,
    SidebarPanelDirective,
    SidebarContentDirective,
    SidebarTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.demo.html',
})
export class SidebarDemoComponent {
  readonly open = signal(true);
  readonly collapsed = signal(false);
  readonly overlayOpen = signal(false);
  readonly sidebarItems = ['Overview', 'Projects', 'Deployments', 'Settings'];
}
