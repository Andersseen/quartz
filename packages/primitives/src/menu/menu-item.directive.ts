import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  OverlayRef,
  OverlayService,
  createFocusRestorer,
  focusSafely,
  inlineToPhysical,
  resolveDirection,
  type FocusRestorer,
} from '@quartz-headless/core';
import { MenuService } from './menu.service';
import { DEFAULT_MENU_CONFIG, type MenuCollectionEntry } from './menu.types';
import { QZ_MENU_SERVICE_PROPERTY } from './menu.directive';

let menuItemId = 0;

@Directive({
  selector: '[qzMenuItem]',
  exportAs: 'qzMenuItem',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"menuitem"',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-haspopup]': 'hasSubmenu() ? "menu" : null',
    '[attr.aria-expanded]': 'hasSubmenu() ? isSubmenuOpen() : null',
    '[attr.aria-controls]': 'isSubmenuOpen() ? submenuPanelId() : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-highlighted]': 'highlighted() ? "" : null',
    '[attr.data-qz-open]': 'isSubmenuOpen() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
    '(pointerenter)': 'onPointerEnter()',
    '(pointerleave)': 'onPointerLeave()',
  },
})
export class MenuItemDirective implements OnInit, OnDestroy, MenuCollectionEntry {
  protected readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly menuService = inject(MenuService);
  protected readonly overlayService = inject(OverlayService);
  protected readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly document = inject(DOCUMENT);
  private overlayRef: OverlayRef | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private childMenuService: MenuService | null = null;
  private focusRestorer: FocusRestorer | null = null;
  private openTimer: number | null = null;

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly submenu = input<TemplateRef<unknown> | null>(null);
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  readonly selected = output<void>();

  readonly id = `qz-menu-item-${++menuItemId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly #isSubmenuOpen = signal(false);
  readonly #submenuPanelId = signal<string | null>(null);
  readonly isSubmenuOpen = this.#isSubmenuOpen.asReadonly();
  readonly submenuPanelId = this.#submenuPanelId.asReadonly();
  readonly highlighted = computed(() => this.menuService.activeId() === this.id);
  readonly tabIndex = computed(() =>
    this.disabled() ? -1 : this.menuService.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.menuService.register(this);
  }

  ngOnDestroy(): void {
    this.clearOpenTimer();
    this.closeSubmenu(false);
    this.menuService.unregister(this);
  }

  hasSubmenu(): boolean {
    return this.submenu() !== null;
  }

  activate(): void {
    if (this.disabled()) return;
    if (this.hasSubmenu()) {
      this.openSubmenu({ focusFirst: true });
      return;
    }
    this.selected.emit();
    if (this.closeOnSelect()) this.menuService.closeAll(true);
  }

  openSubmenu(options: { focusFirst?: boolean } = {}): void {
    const template = this.submenu();
    if (!template || this.disabled() || this.isSubmenuOpen()) return;
    this.menuService.requestOpenSubmenu(
      this.id,
      () => this.openSubmenuOverlay(template, options),
      () => this.closeSubmenu(false),
    );
  }

  closeSubmenu(restoreFocus = true): void {
    this.clearOpenTimer();
    if (!this.isSubmenuOpen() && !this.overlayRef) return;
    const overlay = this.overlayRef;
    const panel = overlay
      ? (this.document.getElementById(this.#submenuPanelId() ?? '') as HTMLElement | null)
      : null;
    this.childMenuService?.closeOpenSubmenu();
    if (panel) this.menuService.unregisterPanel(panel);
    this.childMenuService?.unregisterLevelClose(this.closeFromChild);
    this.childMenuService = null;
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    this.overlayRef = null;
    this.#isSubmenuOpen.set(false);
    this.#submenuPanelId.set(null);
    overlay?.destroy();
    if (restoreFocus) this.focusRestorer?.restore() ?? focusSafely(this.elementRef.nativeElement);
    this.focusRestorer = null;
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuService.setActive(this.id, { focus: true });
    this.activate();
  }

  onFocus(): void {
    if (!this.disabled()) this.menuService.setActive(this.id);
  }

  onPointerEnter(): void {
    if (!this.hasSubmenu() || this.disabled()) return;
    this.menuService.setActive(this.id);
    this.clearOpenTimer();
    const view = this.document.defaultView;
    if (!view) return;
    this.openTimer = view.setTimeout(() => {
      this.openTimer = null;
      this.openSubmenu({ focusFirst: false });
    }, this.menuService.config().submenuOpenDelayMs ?? DEFAULT_MENU_CONFIG.submenuOpenDelayMs);
  }

  onPointerLeave(): void {
    this.clearOpenTimer();
  }

  protected emitSelection(): void {
    this.selected.emit();
  }

  private openSubmenuOverlay(
    template: TemplateRef<unknown>,
    options: { focusFirst?: boolean },
  ): void {
    if (!this.document.defaultView) return;
    const side = inlineToPhysical(resolveDirection(this.elementRef.nativeElement), 'inline-end');
    this.focusRestorer = createFocusRestorer(this.document);
    this.overlayRef = this.overlayService.create(
      template,
      this.viewContainerRef,
      this.elementRef.nativeElement,
      {
        placement: `${side}-start`,
        offset: 4,
        flip: true,
        flipAxis: 'main',
        closeOnClickOutside: false,
        closeOnEscape: false,
        closeOnScroll: false,
        matchAnchorWidth: false,
      },
    );
    this.mountedSubscription = this.overlayRef.mounted$.subscribe((panel) => {
      const id = panel.id || `qz-menu-panel-${++menuItemId}`;
      panel.id = id;
      this.#submenuPanelId.set(id);
      this.childMenuService = getMenuService(panel);
      this.childMenuService?.registerLevelClose(this.closeFromChild);
      this.menuService.registerPanel(panel);
      if (options.focusFirst) {
        this.childMenuService?.focusFirst();
        queueFrame(this.document, () => this.childMenuService?.focusFirst());
      }
    });
    this.closedSubscription = this.overlayRef.closed$.subscribe(() => this.closeSubmenu(false));
    this.overlayRef.open();
    this.#isSubmenuOpen.set(true);
  }

  private readonly closeFromChild = (restoreFocus: boolean): void => {
    this.closeSubmenu(restoreFocus);
  };

  private clearOpenTimer(): void {
    if (this.openTimer !== null) {
      this.document.defaultView?.clearTimeout(this.openTimer);
      this.openTimer = null;
    }
  }
}

function getMenuService(panel: HTMLElement): MenuService | null {
  return (
    (panel as unknown as Record<string, MenuService | undefined>)[QZ_MENU_SERVICE_PROPERTY] ?? null
  );
}

function queueFrame(document: Document, callback: () => void): void {
  const view = document.defaultView;
  if (view?.requestAnimationFrame) view.requestAnimationFrame(callback);
  else callback();
}
