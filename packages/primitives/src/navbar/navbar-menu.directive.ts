import { Directive, ElementRef, OnDestroy, OnInit, inject } from '@angular/core';
import { QzIdGenerator } from '@quartz-headless/core';
import { NavbarDirective } from './navbar.directive';

@Directive({
  selector: '[qzNavbarMenu]',
  exportAs: 'qzNavbarMenu',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.data-qz-navbar-menu]': '""',
    '[attr.data-qz-open]': 'navbar.menuOpen() ? "" : null',
    '[attr.aria-hidden]': 'navbar.menuOpen() ? null : "true"',
    '[style.display]': 'navbar.menuOpen() ? null : "none"',
    '(keydown)': 'navbar.handleMenuKeydown($event)',
  },
})
export class NavbarMenuDirective implements OnInit, OnDestroy {
  private readonly ids = inject(QzIdGenerator);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly navbar = inject(NavbarDirective);

  readonly id = this.ids.next('qz-navbar-menu');

  element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.navbar.registerMenu(this);
  }

  ngOnDestroy(): void {
    this.navbar.unregisterMenu(this);
  }
}
