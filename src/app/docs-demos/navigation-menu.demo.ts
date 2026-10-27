import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuListDirective,
  NavigationMenuTriggerDirective,
  NavigationMenuContentDirective,
  NavigationMenuLinkDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-navigation-menu-demo',
  imports: [
    NavigationMenuDirective,
    NavigationMenuListDirective,
    NavigationMenuItemDirective,
    NavigationMenuTriggerDirective,
    NavigationMenuContentDirective,
    NavigationMenuLinkDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="qz-demo-card">
    <h3>Product navigation</h3>
    <nav
      qzNavigationMenu
      aria-label="Product navigation"
      [(value)]="value"
      [orientation]="orientation()"
      [showDelay]="showDelay()"
      [hideDelay]="hideDelay()"
      [disabled]="disabled()"
      [attr.dir]="rtl() ? 'rtl' : 'ltr'"
    >
      <ul qzNavigationMenuList class="flex gap-2">
        <li qzNavigationMenuItem="platform">
          <button qzNavigationMenuTrigger>Platform</button
          ><ng-template qzNavigationMenuContent
            ><div class="grid gap-2 p-4">
              <a qzNavigationMenuLink href="#overview">Overview</a
              ><a qzNavigationMenuLink href="#security">Security</a>
            </div></ng-template
          >
        </li>
        <li qzNavigationMenuItem="company">
          <button qzNavigationMenuTrigger>Company</button
          ><ng-template qzNavigationMenuContent
            ><div class="p-4"><a qzNavigationMenuLink href="#about">About us</a></div></ng-template
          >
        </li>
        <li qzNavigationMenuItem="disabled" [qzNavigationMenuItemDisabled]="true">
          <button qzNavigationMenuTrigger>Unavailable</button>
        </li>
      </ul>
    </nav>
    <div class="mt-3 flex gap-2">
      <button type="button" (click)="toggleOrientation()">Toggle orientation</button
      ><button type="button" (click)="rtl.update(v => !v)">Toggle RTL</button
      ><button type="button" (click)="disabled.update(v => !v)">Toggle disabled</button>
    </div>
  </section>`,
})
export class NavigationMenuDemoComponent {
  readonly value = signal('');
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly rtl = signal(false);
  readonly disabled = signal(false);
  readonly showDelay = signal(150);
  readonly hideDelay = signal(150);
  toggleOrientation(): void {
    this.orientation.update((value) => (value === 'horizontal' ? 'vertical' : 'horizontal'));
  }
}
