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
  CollectionStore,
  OverlayService,
  createDismissController,
  focusInitialElement,
  focusSafely,
  resolveDirection,
  type CollectionItem,
  type DismissController,
  type OverlayRef,
} from '@quartz-headless/core';
import { Subscription } from 'rxjs';
import type { NavigationMenuItemDirective } from './navigation-menu-item.directive';
import type { NavigationMenuTriggerDirective } from './navigation-menu-trigger.directive';
import {
  DEFAULT_NAVIGATION_MENU_CONFIG,
  type NavigationMenuOrientation,
} from './navigation-menu.types';

let navigationMenuId = 0;

@Directive({
  selector: '[qzNavigationMenu]',
  exportAs: 'qzNavigationMenu',
  standalone: true,
  host: {
    '[attr.role]': '"navigation"',
    '[attr.data-qz-navigation-menu]': '""',
  },
})
export class NavigationMenuDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly overlayService = inject(OverlayService);
  private readonly collection = new CollectionStore<NavigationMenuItemDirective & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'horizontal' },
    this.document,
  );
  private readonly items = signal<readonly NavigationMenuItemDirective[]>([]);
  private overlayRef: OverlayRef | null = null;
  private dismissController: DismissController | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private panel: HTMLElement | null = null;
  private panelId = signal<string | null>(null);
  private renderedItem: NavigationMenuItemDirective | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private timerGeneration = 0;
  private focusPanelValue: string | null = null;
  private destroyed = false;
  private readonly generatedId = `qz-navigation-menu-${++navigationMenuId}`;

  /** Empty string means no flyout is open; item values should be nonempty. */
  readonly value = model('');
  readonly orientation = input<NavigationMenuOrientation>(
    DEFAULT_NAVIGATION_MENU_CONFIG.orientation,
  );
  readonly showDelay = input(DEFAULT_NAVIGATION_MENU_CONFIG.showDelay);
  readonly hideDelay = input(DEFAULT_NAVIGATION_MENU_CONFIG.hideDelay);
  readonly placement = input(DEFAULT_NAVIGATION_MENU_CONFIG.placement);
  readonly offset = input(DEFAULT_NAVIGATION_MENU_CONFIG.offset);
  readonly flip = input(DEFAULT_NAVIGATION_MENU_CONFIG.flip, { transform: booleanAttribute });
  readonly flipAxis = input(DEFAULT_NAVIGATION_MENU_CONFIG.flipAxis);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activeItem = signal<NavigationMenuItemDirective | null>(null);
  readonly isOpen = computed(() => this.activeItem() !== null);

  constructor() {
    afterRenderEffect(() => {
      const value = this.value();
      const items = this.items();
      this.orientation();
      this.disabled();
      const next = value === '' ? null : (items.find((item) => item.value() === value) ?? null);
      if (next?.value() !== this.focusPanelValue) this.focusPanelValue = null;
      if (next?.itemDisabled()) {
        this.value.set('');
        return;
      }
      if (next === this.renderedItem) return;
      this.disposeOverlay();
      this.renderedItem = next;
      if (next && !this.disabled()) this.mountOverlay(next);
    });
  }

  registerItem(item: NavigationMenuItemDirective): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
    });
    this.collection.register(item as NavigationMenuItemDirective & CollectionItem);
    this.items.update((items) => [...items.filter((current) => current !== item), item]);
  }

  unregisterItem(item: NavigationMenuItemDirective): void {
    this.collection.unregister(item as NavigationMenuItemDirective & CollectionItem);
    this.items.update((items) => items.filter((current) => current !== item));
    if (this.renderedItem === item || this.value() === item.value()) {
      this.cancelTimers();
      this.disposeOverlay();
      this.renderedItem = null;
      if (!this.destroyed) this.value.set('');
    }
  }

  refreshOrder(): void {
    this.collection.refreshOrder();
  }

  setTrigger(
    item: NavigationMenuItemDirective,
    trigger: NavigationMenuTriggerDirective | null,
  ): void {
    item.setTrigger(trigger);
    this.collection.refreshOrder();
  }

  isActive(item: NavigationMenuItemDirective): boolean {
    return this.activeItem() === item;
  }

  controlsId(item: NavigationMenuItemDirective): string | null {
    return this.isActive(item) ? this.panelId() : null;
  }

  contentChanged(item: NavigationMenuItemDirective, available: boolean): void {
    if (this.renderedItem === item) {
      this.disposeOverlay();
      this.renderedItem = null;
      if (!available) this.value.set('');
    }
    this.items.update((items) => [...items]);
  }

  toggle(item: NavigationMenuItemDirective): void {
    if (this.disabled() || item.itemDisabled()) return;
    this.cancelTimers();
    this.focusPanelValue = null;
    if (this.isActive(item) || this.value() === item.value()) this.close(false);
    else this.value.set(item.value());
  }

  open(item: NavigationMenuItemDirective, focusPanel = false): void {
    if (this.disabled() || item.itemDisabled()) return;
    this.cancelTimers();
    this.focusPanelValue = focusPanel ? item.value() : null;
    this.value.set(item.value());
  }

  close(restoreFocus: boolean): void {
    this.cancelTimers();
    this.focusPanelValue = null;
    const current = this.renderedItem;
    this.value.set('');
    this.disposeOverlay();
    this.renderedItem = null;
    if (restoreFocus) focusSafely(current?.trigger()?.element() ?? null);
  }

  focusTrigger(item: NavigationMenuItemDirective): void {
    if (this.activeItem() && this.activeItem() !== item) this.close(false);
    this.collection.setActive(item.id);
  }

  handleTriggerKeydown(item: NavigationMenuItemDirective, event: KeyboardEvent): void {
    if (this.disabled() || item.itemDisabled()) return;
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
    });
    this.collection.refreshOrder();
    this.collection.setActive(item.id);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open(item, true);
      return;
    }
    this.collection.handleKeydown(event, { focus: true });
  }

  scheduleShow(item: NavigationMenuItemDirective): void {
    this.cancelTimers();
    this.focusPanelValue = null;
    if (this.disabled() || item.itemDisabled() || this.isActive(item)) return;
    const generation = this.timerGeneration;
    this.showTimer = this.setTimer(
      () => {
        this.showTimer = null;
        if (generation !== this.timerGeneration || this.destroyed) return;
        this.focusPanelValue = null;
        this.value.set(item.value());
      },
      Math.max(0, this.showDelay()),
    );
  }

  scheduleHide(): void {
    this.cancelTimers();
    const active = this.activeItem() ?? this.renderedItem;
    if (!active) return;
    const generation = this.timerGeneration;
    this.hideTimer = this.setTimer(
      () => {
        this.hideTimer = null;
        if (generation !== this.timerGeneration || this.destroyed) return;
        if (this.renderedItem === active || this.activeItem() === active) this.close(false);
      },
      Math.max(0, this.hideDelay()),
    );
  }

  cancelTimers(): void {
    this.timerGeneration++;
    this.clearShowTimer();
    this.clearHideTimer();
  }

  onPanelPointerEnter(): void {
    this.cancelTimers();
  }

  onPanelPointerLeave(): void {
    this.scheduleHide();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelTimers();
    this.disposeOverlay();
    this.collection.destroy();
    this.items.set([]);
  }

  private mountOverlay(item: NavigationMenuItemDirective): void {
    const trigger = item.trigger();
    const content = item.content();
    if (!trigger || !content || !this.document.defaultView) return;
    const overlay = this.overlayService.create(
      content,
      trigger.viewContainer(),
      trigger.element(),
      {
        placement: this.placement(),
        offset: this.offset(),
        flip: this.flip(),
        flipAxis: this.flipAxis(),
        closeOnEscape: false,
        closeOnClickOutside: false,
        closeOnScroll: false,
      },
    );
    this.overlayRef = overlay;
    this.mountedSubscription = overlay.mounted$.subscribe((panel) => {
      if (this.overlayRef !== overlay) return;
      this.panel = panel;
      const id = `${this.generatedId}-panel-${encodeURIComponent(item.value())}`;
      panel.id = id;
      const trigger = item.trigger()?.element() ?? null;
      if (trigger) {
        if (!trigger.id)
          trigger.id = `${this.generatedId}-trigger-${encodeURIComponent(item.value())}`;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', trigger.id);
      }
      this.panelId.set(id);
      this.dismissController = createDismissController({
        document: this.document,
        escape: true,
        outsidePointer: true,
        rootElements: () => [this.elementRef.nativeElement, panel],
        onDismiss: (reason, event) => {
          if (reason === 'escape') {
            event.preventDefault();
            event.stopPropagation();
          }
          this.close(reason === 'escape');
        },
      });
      panel.addEventListener('pointerenter', this.panelEnterListener);
      panel.addEventListener('pointerleave', this.panelLeaveListener);
      this.activeItem.set(item);
      if (this.focusPanelValue === item.value()) {
        this.focusPanelValue = null;
        focusInitialElement(panel);
      }
    });
    this.closedSubscription = overlay.closed$.subscribe(() => {
      if (this.overlayRef === overlay) this.close(false);
    });
    overlay.open();
  }

  private disposeOverlay(): void {
    const overlay = this.overlayRef;
    this.dismissController?.destroy();
    this.dismissController = null;
    this.panel?.removeEventListener('pointerenter', this.panelEnterListener);
    this.panel?.removeEventListener('pointerleave', this.panelLeaveListener);
    this.panel = null;
    this.panelId.set(null);
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    this.overlayRef = null;
    this.activeItem.set(null);
    overlay?.destroy();
  }

  private setTimer(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const view = this.document.defaultView;
    return (view ?? globalThis).setTimeout(callback, delay);
  }

  private clearShowTimer(): void {
    if (this.showTimer === null) return;
    (this.document.defaultView ?? globalThis).clearTimeout(this.showTimer);
    this.showTimer = null;
  }

  private clearHideTimer(): void {
    if (this.hideTimer === null) return;
    (this.document.defaultView ?? globalThis).clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  private panelEnterListener = (): void => this.onPanelPointerEnter();
  private panelLeaveListener = (): void => this.onPanelPointerLeave();
}

@Directive({
  selector: '[qzNavigationMenuList]',
  exportAs: 'qzNavigationMenuList',
  standalone: true,
  host: {
    '[attr.aria-orientation]': 'navigationMenu.orientation()',
    '[attr.data-qz-orientation]': 'navigationMenu.orientation()',
    '[attr.data-qz-navigation-menu-list]': '""',
  },
})
export class NavigationMenuListDirective {
  protected readonly navigationMenu = inject(NavigationMenuDirective);
}

@Directive({
  selector: '[qzNavigationMenuLink]',
  exportAs: 'qzNavigationMenuLink',
  standalone: true,
  host: {
    '[attr.data-qz-navigation-menu-link]': '""',
    '[attr.aria-current]': 'current() ? "page" : null',
    '(click)': 'onClick()',
  },
})
export class NavigationMenuLinkDirective {
  private readonly navigationMenu = inject(NavigationMenuDirective);
  readonly current = input(false, {
    alias: 'qzNavigationMenuLinkCurrent',
    transform: booleanAttribute,
  });

  onClick(): void {
    this.navigationMenu.close(false);
  }
}
