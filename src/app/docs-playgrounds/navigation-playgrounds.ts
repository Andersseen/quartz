import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import {
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuListDirective,
  NavigationMenuTriggerDirective,
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
  ToolbarDirective,
  ToolbarItemDirective,
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-toolbar-playground',
  imports: [ToolbarDirective, ToolbarItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    qzToolbar
    aria-label="Formatting"
    [orientation]="orientation()"
    [disabled]="disabled()"
    [attr.dir]="rtl() ? 'rtl' : 'ltr'"
    class="flex gap-2"
  >
    <button qzToolbarItem>Bold</button><button qzToolbarItem>Italic</button
    ><button qzToolbarItem disabled>Link</button>
  </div>`,
})
export class ToolbarPlaygroundComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly rtl = input(false);
  readonly disabled = input(false);
}

@Component({
  selector: 'app-navigation-menu-playground',
  imports: [
    NavigationMenuDirective,
    NavigationMenuListDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav
    qzNavigationMenu
    aria-label="Example navigation"
    [(value)]="value"
    [orientation]="orientation()"
    [showDelay]="showDelay()"
    [hideDelay]="hideDelay()"
    [disabled]="disabled()"
    [attr.dir]="rtl() ? 'rtl' : 'ltr'"
  >
    <ul qzNavigationMenuList class="flex gap-3">
      <li qzNavigationMenuItem="products">
        <button qzNavigationMenuTrigger>Products</button
        ><ng-template qzNavigationMenuContent
          ><div class="grid gap-2 p-3">
            <a qzNavigationMenuLink href="#overview">Overview</a
            ><a qzNavigationMenuLink href="#security">Security</a>
          </div></ng-template
        >
      </li>
      <li qzNavigationMenuItem="company">
        <button qzNavigationMenuTrigger>Company</button
        ><ng-template qzNavigationMenuContent
          ><div class="p-3"><a qzNavigationMenuLink href="#about">About</a></div></ng-template
        >
      </li>
    </ul>
  </nav>`,
})
export class NavigationMenuPlaygroundComponent {
  readonly value = model('');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly showDelay = input(150);
  readonly hideDelay = input(150);
  readonly disabled = input(false);
  readonly rtl = input(false);
}

@Component({
  selector: 'app-pagination-playground',
  imports: [
    PaginationDirective,
    PaginationFirstDirective,
    PaginationPreviousDirective,
    PaginationPageDirective,
    PaginationNextDirective,
    PaginationLastDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<nav
      qzPagination
      aria-label="Search results"
      [(page)]="page"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      class="flex gap-2"
    >
      <button qzPaginationFirst>First</button><button qzPaginationPrevious>Previous</button>
      @for (number of pages(); track number) {
        <button [qzPaginationPage]="number">{{ number }}</button>
      }
      <button qzPaginationNext>Next</button><button qzPaginationLast>Last</button>
    </nav>
    <p>Page {{ page() }} of {{ pageCount() }}</p>`,
})
export class PaginationPlaygroundComponent {
  readonly page = model(2);
  readonly pageCount = input(5);
  readonly disabled = input(false);
  pages(): number[] {
    return Array.from({ length: Math.max(0, this.pageCount()) }, (_, i) => i + 1);
  }
}

@Component({
  selector: 'app-accordion-playground',
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    qzAccordion
    [type]="type()"
    [collapsible]="collapsible()"
    [orientation]="orientation()"
    [disabled]="disabled()"
    [(value)]="value"
  >
    <section qzAccordionItem="account">
      <button qzAccordionTrigger>Account</button>
      <div qzAccordionPanel>Account settings</div>
    </section>
    <section qzAccordionItem="privacy">
      <button qzAccordionTrigger>Privacy</button>
      <div qzAccordionPanel>Privacy settings</div>
    </section>
  </div>`,
})
export class AccordionPlaygroundComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('vertical');
  readonly disabled = input(false);
  readonly collapsible = input(false);
  readonly type = input<'single' | 'multiple'>('single');
  readonly value = model<string | string[] | null>('account');
}

@Component({
  selector: 'app-sidebar-playground',
  imports: [
    SidebarDirective,
    SidebarPanelDirective,
    SidebarContentDirective,
    SidebarTriggerDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
    qzSidebar
    [(open)]="open"
    [(collapsed)]="collapsed"
    [mode]="mode()"
    [breakpoint]="breakpoint()"
    [side]="side()"
    class="min-h-32 border border-white/10"
  >
    <aside qzSidebarPanel class="p-3">
      <button qzSidebarTrigger>Toggle navigation</button>
      <nav aria-label="Workspace"><a href="#home">Home</a></nav>
    </aside>
    <section qzSidebarContent class="p-3">Workspace content</section>
  </div>`,
})
export class SidebarPlaygroundComponent {
  readonly open = model(true);
  readonly collapsed = model(false);
  readonly mode = input<'push' | 'overlay'>('push');
  readonly breakpoint = input(768);
  readonly side = input<'inline-start' | 'inline-end'>('inline-start');
}
