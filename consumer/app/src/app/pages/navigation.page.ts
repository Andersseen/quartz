import { Component, signal } from '@angular/core';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
  AvatarComponent,
  MeterDirective,
  MeterIndicatorDirective,
  MeterTrackDirective,
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuListDirective,
  NavigationMenuTriggerDirective,
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
  TabDirective,
  TabListDirective,
  TabPanelDirective,
  TabsDirective,
} from '@quartz-headless/primitives';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from '@quartz-headless/core';

@Component({
  selector: 'app-navigation-page',
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionPanelDirective,
    AccordionTriggerDirective,
    AvatarComponent,
    MeterDirective,
    MeterIndicatorDirective,
    MeterTrackDirective,
    NavigationMenuContentDirective,
    NavigationMenuDirective,
    NavigationMenuItemDirective,
    NavigationMenuLinkDirective,
    NavigationMenuListDirective,
    NavigationMenuTriggerDirective,
    ProgressDirective,
    ProgressIndicatorDirective,
    ProgressTrackDirective,
    SidebarContentDirective,
    SidebarDirective,
    SidebarPanelDirective,
    SidebarTriggerDirective,
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    TabDirective,
    TabListDirective,
    TabPanelDirective,
    TabsDirective,
  ],
  template: `
    <h1>Navigation</h1>
    <section>
      <div qzTabs [(value)]="tab">
        <div qzTabList aria-label="Sections">
          <button qzTab="one">One</button>
          <button qzTab="two">Two</button>
        </div>
        <div qzTabPanel="one">Panel one</div>
        <div qzTabPanel="two">Panel two</div>
      </div>
    </section>

    <section>
      <div qzAccordion [(value)]="section" data-testid="accordion">
        <section qzAccordionItem="a">
          <button qzAccordionTrigger>Account</button>
          <div qzAccordionPanel>Account settings</div>
        </section>
        <section qzAccordionItem="b">
          <button qzAccordionTrigger>Billing</button>
          <div qzAccordionPanel>Billing settings</div>
        </section>
      </div>
    </section>

    <section>
      <nav qzNavigationMenu aria-label="Primary" [(value)]="menuValue">
        <ul qzNavigationMenuList>
          <li qzNavigationMenuItem="products">
            <button qzNavigationMenuTrigger>Products</button>
            <ng-template qzNavigationMenuContent>
              <div><a qzNavigationMenuLink href="/forms">Browse</a></div>
            </ng-template>
          </li>
          <li qzNavigationMenuItem="docs">
            <a qzNavigationMenuLink href="/overlays">Docs</a>
          </li>
        </ul>
      </nav>
    </section>

    <section>
      <div qzSidebar [(open)]="sidebarOpen" data-testid="sidebar" breakpoint="md">
        <aside qzSidebarPanel aria-label="Sidebar"><a href="/forms">Sidebar link</a></aside>
        <div qzSidebarContent>
          <button qzSidebarTrigger data-testid="sidebar-trigger">Toggle sidebar</button>
          <p>Main content</p>
        </div>
      </div>
    </section>

    <section>
      <div qzSplitterContainer orientation="horizontal" [minSize]="20" [maxSize]="80" [step]="5">
        <div qzSplitterPanel>A</div>
        <div qzSplitterHandle aria-label="Resize panels" data-testid="handle"></div>
        <div [qzSplitterPanel]="false">B</div>
      </div>
    </section>

    <section>
      <div qzProgress [value]="40" [min]="0" [max]="100" aria-label="Download">
        <div qzProgressTrack><div qzProgressIndicator></div></div>
      </div>
      <div qzMeter [value]="72" [min]="0" [max]="100" aria-label="Storage">
        <div qzMeterTrack><div qzMeterIndicator></div></div>
      </div>
      <qz-avatar alt="Jane Doe" fallback="JD" [fallbackDelay]="0" />
    </section>
  `,
})
export class NavigationPage {
  readonly tab = signal<string | null>('one');
  readonly section = signal<string | string[] | null>('a');
  readonly menuValue = signal('');
  readonly sidebarOpen = signal(true);
}
