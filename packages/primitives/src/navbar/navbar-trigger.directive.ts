import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NavbarDirective } from './navbar.directive';

@Directive({
  selector: '[qzNavbarTrigger]',
  exportAs: 'qzNavbarTrigger',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'navbar.menuOpen()',
    '[attr.aria-controls]': 'menuId()',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.data-qz-open]': 'navbar.menuOpen() ? "" : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(click)': 'toggle($event)',
  },
})
export class NavbarTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly navbar = inject(NavbarDirective);
  private readonly controlledMenuId = signal<string | null>(null);

  readonly disabled = input(false, {
    alias: 'qzNavbarTriggerDisabled',
    transform: booleanAttribute,
  });
  readonly menuId = computed(() => this.controlledMenuId());

  constructor() {
    this.navbar.registerTrigger(this);
  }

  element(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  setControlledMenuId(id: string | null): void {
    this.controlledMenuId.set(id);
  }

  toggle(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.navbar.toggleMenu();
  }

  ngOnDestroy(): void {
    this.navbar.unregisterTrigger(this);
  }
}
