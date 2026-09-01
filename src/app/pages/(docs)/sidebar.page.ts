import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SIDEBAR_SNIPPET, RESPONSIVE_SIDEBAR_SNIPPET } from './sidebar.snippets';

@Component({
  selector: 'app-sidebar-page',
  imports: [
    SidebarDirective,
    SidebarPanelDirective,
    SidebarContentDirective,
    SidebarTriggerDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.page.html',
})
export default class SidebarPage {
  readonly open = signal(true);
  readonly collapsed = signal(false);
  readonly overlayOpen = signal(false);
  readonly sidebarItems = ['Overview', 'Projects', 'Deployments', 'Settings'];
  readonly basicCode = BASIC_SIDEBAR_SNIPPET;
  readonly responsiveCode = RESPONSIVE_SIDEBAR_SNIPPET;
}
