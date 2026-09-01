import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  NavbarDirective,
  NavbarMenuDirective,
  NavbarTriggerDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { NAVBAR_SNIPPET } from './navbar.snippets';

@Component({
  selector: 'app-navbar-page',
  imports: [
    NavbarDirective,
    NavbarTriggerDirective,
    NavbarMenuDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.page.html',
})
export default class NavbarPage {
  readonly navbarRows = [
    {
      title: 'Production deploy',
      status: 'healthy',
      body: 'Madrid and Frankfurt edges are serving the latest application shell.',
    },
    {
      title: 'Team activity',
      status: 'live',
      body: 'Reviewers, designers and engineers are moving through the same workspace.',
    },
    {
      title: 'Usage guardrails',
      status: 'review',
      body: 'Billing limits, access groups and release approvals are ready for review.',
    },
    {
      title: 'Release queue',
      status: 'pending',
      body: 'The mobile drawer carries the same destinations as the desktop bar.',
    },
    {
      title: 'Audit trail',
      status: 'synced',
      body: 'Recent navigation changes are linked to the active deployment.',
    },
  ];
  readonly code = NAVBAR_SNIPPET;
}
