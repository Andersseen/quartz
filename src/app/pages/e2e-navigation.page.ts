import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuTriggerDirective,
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
  ToolbarDirective,
  ToolbarItemDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-e2e-navigation',
  imports: [
    ToolbarDirective,
    ToolbarItemDirective,
    NavigationMenuDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
    PaginationDirective,
    PaginationFirstDirective,
    PaginationPreviousDirective,
    PaginationNextDirective,
    PaginationLastDirective,
    PaginationPageDirective,
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
    SidebarDirective,
    SidebarPanelDirective,
    SidebarContentDirective,
    SidebarTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
  template: `
    <main id="app" data-ready style="padding: 20px; min-height: 1400px">
      <h1>Navigation and roving focus fixtures</h1>
      <p id="toolbar-activations">{{ toolbarActivations() }}</p>
      <button id="toolbar-reorder" type="button" (click)="reorderToolbar()">Reorder</button>
      <button
        id="toolbar-dir-toggle"
        type="button"
        (click)="toolbarDir.set(toolbarDir() === 'ltr' ? 'rtl' : 'ltr')"
      >
        Toggle toolbar direction
      </button>
      <div
        id="toolbar-horizontal"
        qzToolbar
        aria-label="Horizontal tools"
        [attr.dir]="toolbarDir()"
      >
        @for (item of toolbarItems(); track item.id) {
          <button
            [id]="item.id"
            qzToolbarItem
            [qzToolbarItemDisabled]="item.disabled"
            (click)="activateToolbar()"
          >
            {{ item.label }}
          </button>
        }
      </div>
      <div id="toolbar-vertical" qzToolbar aria-label="Vertical tools" orientation="vertical">
        <button id="vertical-one" qzToolbarItem>Vertical one</button>
        <button id="vertical-two" qzToolbarItem>Vertical two</button>
      </div>
      <div id="toolbar-mixed" qzToolbar aria-label="Search tools">
        <input id="toolbar-search" qzToolbarItem aria-label="Search tools input" />
        <button id="toolbar-submit" qzToolbarItem>Submit search</button>
      </div>

      <nav
        id="navigation-menu"
        qzNavigationMenu
        aria-label="Main navigation"
        [(value)]="navigationValue"
        [orientation]="navigationOrientation()"
        [showDelay]="showDelay()"
        [hideDelay]="hideDelay()"
        [placement]="placement()"
        [attr.dir]="navigationDir()"
      >
        <ul>
          <li qzNavigationMenuItem="products" [qzNavigationMenuItemDisabled]="disableProducts()">
            <button id="nav-products" qzNavigationMenuTrigger>Products</button>
            <ng-template qzNavigationMenuContent>
              <div id="products-panel">
                <a id="products-link" href="#products" qzNavigationMenuLink>Product overview</a>
              </div>
            </ng-template>
          </li>
          <li qzNavigationMenuItem="company">
            <button id="nav-company" qzNavigationMenuTrigger>Company</button>
            <ng-template qzNavigationMenuContent>
              <div id="company-panel">
                <a
                  id="company-link"
                  href="#company"
                  qzNavigationMenuLink
                  [qzNavigationMenuLinkCurrent]="true"
                  >Company page</a
                >
              </div>
            </ng-template>
          </li>
          <li qzNavigationMenuItem="disabled" qzNavigationMenuItemDisabled>
            <button id="nav-disabled" qzNavigationMenuTrigger>Disabled trigger</button>
            <ng-template qzNavigationMenuContent><div>Disabled panel</div></ng-template>
          </li>
        </ul>
      </nav>
      <button id="outside-navigation" type="button">Outside navigation</button>
      <button
        id="navigation-rtl"
        type="button"
        (click)="navigationDir.set(navigationDir() === 'ltr' ? 'rtl' : 'ltr')"
      >
        Toggle navigation direction
      </button>
      <button
        id="navigation-vertical"
        type="button"
        (click)="
          navigationOrientation.set(
            navigationOrientation() === 'horizontal' ? 'vertical' : 'horizontal'
          )
        "
      >
        Toggle navigation orientation
      </button>
      <button id="navigation-delay" type="button" (click)="showDelay.set(300); hideDelay.set(200)">
        Use delayed hover
      </button>
      <button
        id="navigation-disable"
        type="button"
        (click)="disableProducts.set(!disableProducts())"
      >
        Toggle Products disabled
      </button>

      <form id="pagination-form" (submit)="submitted.set(true)">
        <nav
          id="pagination"
          qzPagination
          aria-label="Search results"
          [(page)]="page"
          [pageCount]="pageCount()"
          [disabled]="paginationDisabled()"
        >
          <button qzPaginationFirst>First</button>
          <button qzPaginationPrevious>Previous</button>
          @for (number of pageNumbers(); track number) {
            <button [qzPaginationPage]="number">{{ number }}</button>
          }
          <button qzPaginationNext>Next</button>
          <button qzPaginationLast>Last</button>
        </nav>
        <span id="page-value">{{ page() }}</span>
        <span id="page-count">{{ pageCount() }}</span>
        <span id="form-submitted">{{ submitted() }}</span>
      </form>
      <button id="page-count-decrease" type="button" (click)="decreasePageCount()">
        Decrease pages
      </button>
      <button id="page-count-increase" type="button" (click)="pageCount.set(pageCount() + 1)">
        Increase pages
      </button>
      <button
        id="pagination-disable"
        type="button"
        (click)="paginationDisabled.set(!paginationDisabled())"
      >
        Toggle pagination disabled
      </button>

      <div
        id="accordion"
        qzAccordion
        [(value)]="accordionValue"
        [orientation]="accordionOrientation()"
        [disabled]="accordionDisabled()"
        [collapsible]="false"
        [attr.dir]="accordionDir()"
      >
        <section qzAccordionItem="account">
          <h2><button id="accordion-account" qzAccordionTrigger>Account</button></h2>
          <div qzAccordionPanel><a href="#profile">Profile</a></div>
        </section>
        <section qzAccordionItem="privacy">
          <h2><button id="accordion-privacy" qzAccordionTrigger>Privacy</button></h2>
          <div qzAccordionPanel>Privacy settings</div>
        </section>
      </div>
      <button
        id="accordion-horizontal"
        type="button"
        (click)="
          accordionOrientation.set(
            accordionOrientation() === 'vertical' ? 'horizontal' : 'vertical'
          )
        "
      >
        Toggle accordion orientation
      </button>
      <button
        id="accordion-rtl"
        type="button"
        (click)="accordionDir.set(accordionDir() === 'ltr' ? 'rtl' : 'ltr')"
      >
        Toggle accordion direction
      </button>
      <button
        id="accordion-disabled"
        type="button"
        (click)="accordionDisabled.set(!accordionDisabled())"
      >
        Toggle accordion disabled
      </button>

      <div
        id="sidebar"
        qzSidebar
        [(open)]="sidebarOpen"
        [(collapsed)]="sidebarCollapsed"
        desktopMode="push"
        mobileMode="overlay"
        [breakpoint]="600"
        [focusMode]="sidebarFocusMode()"
        [scrollLock]="true"
        [side]="sidebarSide()"
      >
        <aside qzSidebarPanel aria-label="Application navigation">
          <a id="sidebar-home" href="#home">Home</a>
          <a id="sidebar-settings" href="#settings">Settings</a>
        </aside>
        <div qzSidebarContent>
          <button id="sidebar-trigger" qzSidebarTrigger>Toggle sidebar</button>
          <button
            id="sidebar-collapse"
            type="button"
            (click)="sidebarCollapsed.set(!sidebarCollapsed())"
          >
            Toggle collapsed rail
          </button>
          <button
            id="sidebar-side"
            type="button"
            (click)="
              sidebarSide.set(sidebarSide() === 'inline-start' ? 'inline-end' : 'inline-start')
            "
          >
            Toggle sidebar side
          </button>
          <button
            id="sidebar-focus-mode"
            type="button"
            (click)="sidebarFocusMode.set(sidebarFocusMode() === 'trap' ? 'none' : 'trap')"
          >
            Toggle sidebar focus trap
          </button>
        </div>
      </div>
      <button id="sidebar-breakpoint" type="button">Breakpoint target</button>
    </main>
  `,
})
export default class E2eNavigationPage {
  readonly toolbarActivations = signal(0);
  readonly toolbarDir = signal<'ltr' | 'rtl'>('ltr');
  readonly toolbarItems = signal([
    { id: 'toolbar-one', label: 'One', disabled: false },
    { id: 'toolbar-disabled', label: 'Disabled tool', disabled: true },
    { id: 'toolbar-three', label: 'Three', disabled: false },
  ]);
  readonly navigationValue = signal('');
  readonly navigationOrientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly navigationDir = signal<'ltr' | 'rtl'>('ltr');
  readonly showDelay = signal(120);
  readonly hideDelay = signal(150);
  readonly placement = signal<'bottom-start' | 'bottom-end'>('bottom-start');
  readonly disableProducts = signal(false);
  readonly page = signal(2);
  readonly pageCount = signal(3);
  readonly paginationDisabled = signal(false);
  readonly submitted = signal(false);
  readonly accordionValue = signal<string | null>('account');
  readonly accordionOrientation = signal<'horizontal' | 'vertical'>('vertical');
  readonly accordionDir = signal<'ltr' | 'rtl'>('ltr');
  readonly accordionDisabled = signal(false);
  readonly sidebarOpen = signal(true);
  readonly sidebarCollapsed = signal(false);
  readonly sidebarFocusMode = signal<'none' | 'initial' | 'trap'>('none');
  readonly sidebarSide = signal<'inline-start' | 'inline-end'>('inline-start');

  pageNumbers = () => Array.from({ length: this.pageCount() }, (_, index) => index + 1);

  reorderToolbar(): void {
    this.toolbarItems.update((items) => [items[2], items[1], items[0]]);
  }

  activateToolbar(): void {
    this.toolbarActivations.update((value) => value + 1);
  }

  decreasePageCount(): void {
    this.pageCount.update((count) => Math.max(0, count - 1));
  }
}
