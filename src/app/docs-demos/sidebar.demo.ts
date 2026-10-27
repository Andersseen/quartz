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
  readonly desktopMode = signal<'push' | 'overlay'>('push');
  readonly breakpoint = signal(768);
  readonly side = signal<'inline-start' | 'inline-end'>('inline-start');
  readonly sidebarItems = ['Overview', 'Projects', 'Deployments', 'Settings'];
}
