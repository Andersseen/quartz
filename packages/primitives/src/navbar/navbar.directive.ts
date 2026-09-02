import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  DEFAULT_BREAKPOINTS,
  ViewportService,
  createDismissController,
  createFocusRestorer,
  createFocusTrap,
  createScrollLock,
  focusInitialElement,
  type DismissController,
  type FocusRestorer,
  type FocusTrap,
} from '@quartz-headless/core';
import {
  DEFAULT_NAVBAR_CONFIG,
  type NavbarBreakpoint,
  type NavbarRevealMode,
  type NavbarScrollDirection,
} from './navbar.types';
import type { NavbarMenuDirective } from './navbar-menu.directive';
import type { NavbarTriggerDirective } from './navbar-trigger.directive';

let navbarId = 0;

@Directive({
  selector: '[qzNavbar]',
  exportAs: 'qzNavbar',
  standalone: true,
  host: {
    '[attr.data-qz-navbar]': '""',
    '[attr.data-qz-sticky]': 'sticky() ? "" : null',
    '[attr.data-qz-scrolled]': 'scrolled() ? "" : null',
    '[attr.data-qz-stuck]': 'stuck() ? "" : null',
    '[attr.data-qz-visible]': 'visible() ? "" : null',
    '[attr.data-qz-scroll-direction]': 'scrollDirection()',
    '[attr.data-qz-menu-open]': 'menuOpen() ? "" : null',
    '[attr.data-qz-responsive]': 'isDesktop() ? "desktop" : "mobile"',
    '[style.position]': 'sticky() ? "sticky" : null',
    '[style.top]': 'sticky() ? top() : null',
  },
})
export class NavbarDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly viewport = inject(ViewportService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly generatedId = `qz-navbar-${++navbarId}`;
  private readonly scrollLockController = createScrollLock(this.document);

  private readonly menu = signal<NavbarMenuDirective | null>(null);
  private triggers = new Set<NavbarTriggerDirective>();
  private dismissController: DismissController | null = null;
  private focusTrap: FocusTrap | null = null;
  private focusRestorer: FocusRestorer | null = null;
  private removeScrollListener: (() => void) | null = null;
  private frame = 0;
  private lastScrollY = 0;

  readonly menuOpen = model(false);
  readonly sticky = input(DEFAULT_NAVBAR_CONFIG.sticky, { transform: booleanAttribute });
  readonly top = input(DEFAULT_NAVBAR_CONFIG.top);
  readonly scrollThreshold = input(DEFAULT_NAVBAR_CONFIG.scrollThreshold);
  readonly directionThreshold = input(DEFAULT_NAVBAR_CONFIG.directionThreshold);
  readonly reveal = input<NavbarRevealMode>(DEFAULT_NAVBAR_CONFIG.reveal);
  readonly breakpoint = input<NavbarBreakpoint>(DEFAULT_NAVBAR_CONFIG.breakpoint);
  readonly closeMenuOnDesktop = input(DEFAULT_NAVBAR_CONFIG.closeMenuOnDesktop, {
    transform: booleanAttribute,
  });
  readonly scrollLock = input(false, { transform: booleanAttribute });
  readonly trapFocus = input(false, { transform: booleanAttribute });

  readonly scrolled = signal(false);
  // Derived from scrolled, not an independently-tracked signal: this is a threshold proxy
  // for "sticky positioning has visually engaged," not true CSS sticky-boundary detection
  // (that would need real geometry — an IntersectionObserver sentinel — which this directive
  // doesn't do). Deriving it from `scrolled` guarantees `stuck` can never be true while
  // `scrolled` is false, which a separately-tracked signal with its own threshold could
  // previously produce (a real, confusing inconsistency for consumers).
  readonly stuck = computed(() => this.sticky() && this.scrolled());
  readonly scrollDirection = signal<NavbarScrollDirection>('none');
  readonly isDesktop = computed(() => this.viewport.width() >= this.breakpointPx());
  readonly visible = computed(() => {
    if (this.reveal() === 'always') return true;
    return this.scrollDirection() !== 'down' || !this.scrolled() || this.menuOpen();
  });
  readonly menuId = computed(() => this.menu()?.id ?? `${this.generatedId}-menu`);

  constructor() {
    afterRenderEffect(() => {
      this.ensureScrollListener();
      if (this.closeMenuOnDesktop() && this.isDesktop()) this.menuOpen.set(false);
      this.syncMenuBehavior();
      this.updateTriggers();
    });
  }

  registerMenu(menu: NavbarMenuDirective): void {
    this.menu.set(menu);
    this.updateTriggers();
  }

  unregisterMenu(menu: NavbarMenuDirective): void {
    if (this.menu() === menu) {
      this.menu.set(null);
      this.teardownMenuBehavior();
      this.updateTriggers();
    }
  }

  registerTrigger(trigger: NavbarTriggerDirective): void {
    this.triggers.add(trigger);
    trigger.setControlledMenuId(this.menuId());
  }

  unregisterTrigger(trigger: NavbarTriggerDirective): void {
    this.triggers.delete(trigger);
  }

  openMenu(): void {
    this.menuOpen.set(true);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  handleMenuKeydown(event: KeyboardEvent): void {
    this.focusTrap?.handleKeydown(event);
  }

  ngOnDestroy(): void {
    this.teardownMenuBehavior();
    this.removeScrollListener?.();
    const view = this.document.defaultView;
    if (view && this.frame) view.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private breakpointPx(): number {
    const breakpoint = this.breakpoint();
    return typeof breakpoint === 'number' ? breakpoint : DEFAULT_BREAKPOINTS[breakpoint];
  }

  private ensureScrollListener(): void {
    if (this.removeScrollListener || !this.document.defaultView) return;
    const view = this.document.defaultView;
    const target = findScrollParent(this.elementRef.nativeElement) ?? view;
    this.lastScrollY = getScrollY(target);
    this.updateScrollState(this.lastScrollY);
    const onScroll = (): void => {
      if (this.frame) return;
      this.frame = view.requestAnimationFrame(() => {
        this.frame = 0;
        this.updateScrollState(getScrollY(target));
      });
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    this.removeScrollListener = () => target.removeEventListener('scroll', onScroll);
  }

  private updateScrollState(scrollY: number): void {
    const threshold = Math.max(0, this.scrollThreshold());
    const directionThreshold = Math.max(0, this.directionThreshold());
    const nextScrolled = scrollY > threshold;
    const delta = scrollY - this.lastScrollY;
    const nextDirection =
      Math.abs(delta) < directionThreshold ? this.scrollDirection() : delta > 0 ? 'down' : 'up';

    if (this.scrolled() !== nextScrolled) this.scrolled.set(nextScrolled);
    if (this.scrollDirection() !== nextDirection) this.scrollDirection.set(nextDirection);
    this.lastScrollY = scrollY;
  }

  private syncMenuBehavior(): void {
    if (!this.menuOpen() || !this.document.defaultView) {
      this.teardownMenuBehavior();
      return;
    }

    const menuEl = this.menu()?.element() ?? null;
    if (!menuEl) return;

    if (!this.dismissController) {
      this.dismissController = createDismissController({
        document: this.document,
        escape: true,
        outsidePointer: true,
        rootElements: () => [this.elementRef.nativeElement, menuEl],
        excludeElements: () => [...this.triggers].map((trigger) => trigger.element()),
        onDismiss: () => this.closeMenu(),
      });
    }

    if (this.scrollLock() && !this.scrollLockController.locked) this.scrollLockController.lock();

    if (!this.focusRestorer) {
      this.focusRestorer = createFocusRestorer(this.document);
      focusInitialElement(menuEl);
    }

    if (this.trapFocus() && !this.focusTrap) {
      this.focusTrap = createFocusTrap(menuEl, this.document);
    }
    if (!this.trapFocus()) {
      this.focusTrap?.destroy();
      this.focusTrap = null;
    }
  }

  private teardownMenuBehavior(): void {
    this.dismissController?.destroy();
    this.dismissController = null;
    this.focusTrap?.destroy();
    this.focusTrap = null;
    this.scrollLockController.unlock();
    this.focusRestorer?.restore();
    this.focusRestorer = null;
  }

  private updateTriggers(): void {
    for (const trigger of this.triggers) trigger.setControlledMenuId(this.menuId());
  }
}

function getScrollY(target: Window | HTMLElement): number {
  return 'scrollY' in target ? target.scrollY : target.scrollTop;
}

function findScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    const view = parent.ownerDocument.defaultView;
    if (!view) return null;
    const { overflowY } = view.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
