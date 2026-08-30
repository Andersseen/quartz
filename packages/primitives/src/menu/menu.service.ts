import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal, type OnDestroy } from '@angular/core';
import {
  CollectionStore,
  createDismissController,
  type DismissController,
  inlineEndKey,
  inlineStartKey,
  resolveDirection,
} from '@quartz-headless/core';
import { DEFAULT_MENU_CONFIG, type MenuCollectionEntry, type MenuConfig } from './menu.types';

@Injectable()
export class MenuService implements OnDestroy {
  readonly #document = inject(DOCUMENT);
  readonly #parent = inject(MenuService, { optional: true, skipSelf: true });
  readonly #collection = new CollectionStore<MenuCollectionEntry>(
    {
      focusStrategy: 'roving-tabindex',
      orientation: 'vertical',
      wrap: DEFAULT_MENU_CONFIG.wrap,
      typeaheadTimeoutMs: DEFAULT_MENU_CONFIG.typeaheadTimeoutMs,
    },
    this.#document,
  );
  readonly #panels = signal<HTMLElement[]>([]);
  readonly #openSubmenuId = signal<string | null>(null);
  readonly #config = signal<MenuConfig>(DEFAULT_MENU_CONFIG);
  #rootClose: ((restoreFocus: boolean) => void) | null = null;
  #levelClose: ((restoreFocus: boolean) => void) | null = null;
  #openSubmenuClose: (() => void) | null = null;
  #dismissController: DismissController | null = null;
  #dismissTimer: number | null = null;
  #dismissTracksScroll = false;

  readonly items = this.#collection.items;
  readonly activeId = this.#collection.activeId;
  readonly activeItem = this.#collection.activeItem;
  readonly openSubmenuId = this.#openSubmenuId.asReadonly();
  readonly isRoot = !this.#parent;
  readonly root: MenuService = this.#parent?.root ?? this;
  readonly config = computed(() => this.#config());

  configure(config: Partial<MenuConfig>): void {
    const next = { ...DEFAULT_MENU_CONFIG, ...config };
    this.#config.set(next);
    this.#collection.configure({
      wrap: next.wrap,
      typeaheadTimeoutMs: next.typeaheadTimeoutMs,
      orientation: 'vertical',
      focusStrategy: 'roving-tabindex',
    });
  }

  register(item: MenuCollectionEntry): void {
    this.#collection.register(item);
  }

  unregister(item: MenuCollectionEntry): void {
    this.#collection.unregister(item);
  }

  setActive(id: string | null, options: { focus?: boolean } = {}): void {
    this.#collection.setActive(id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.#collection.activeTabIndex(id);
  }

  focusFirst(): void {
    this.#collection.first({ focus: true });
  }

  focusLast(): void {
    this.#collection.last({ focus: true });
  }

  focusActive(): void {
    this.#collection.focusActive();
  }

  handleKeydown(event: KeyboardEvent, host: HTMLElement): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.activeItem()?.activate();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this.isRoot) this.closeAll(true);
      else this.#levelClose?.(true);
      return;
    }

    if (event.key === 'Tab') {
      this.closeAll(false);
      return;
    }

    const direction = resolveDirection(host);
    if (event.key === inlineEndKey(direction)) {
      const active = this.activeItem();
      if (active?.hasSubmenu?.()) {
        event.preventDefault();
        active.openSubmenu?.({ focusFirst: true });
      }
      return;
    }

    if (event.key === inlineStartKey(direction)) {
      if (!this.isRoot) {
        event.preventDefault();
        this.#levelClose?.(true);
      }
      return;
    }

    if (this.#collection.handleKeydown(event, { focus: true })) {
      this.closeOpenSubmenu();
    }
  }

  requestOpenSubmenu(ownerId: string, open: () => void, close: () => void): void {
    if (this.#openSubmenuId() === ownerId) return;
    this.closeOpenSubmenu();
    this.#openSubmenuId.set(ownerId);
    this.#openSubmenuClose = close;
    open();
  }

  closeOpenSubmenu(): void {
    const close = this.#openSubmenuClose;
    this.#openSubmenuId.set(null);
    this.#openSubmenuClose = null;
    close?.();
  }

  registerPanel(el: HTMLElement): void {
    this.root.#panels.update((panels) => (panels.includes(el) ? panels : [...panels, el]));
    this.root.#ensureDismissController();
  }

  unregisterPanel(el: HTMLElement): void {
    this.root.#panels.update((panels) => panels.filter((panel) => panel !== el));
    this.root.#teardownDismissIfIdle();
  }

  registerRootClose(fn: (restoreFocus: boolean) => void): void {
    this.root.#rootClose = fn;
    this.root.#ensureDismissController();
  }

  unregisterRootClose(fn: (restoreFocus: boolean) => void): void {
    if (this.root.#rootClose === fn) this.root.#rootClose = null;
    this.root.#teardownDismissIfIdle();
  }

  registerLevelClose(fn: (restoreFocus: boolean) => void): void {
    this.#levelClose = fn;
  }

  unregisterLevelClose(fn: (restoreFocus: boolean) => void): void {
    if (this.#levelClose === fn) this.#levelClose = null;
  }

  closeAll(restoreFocus = true): void {
    this.root.#rootClose?.(restoreFocus);
  }

  destroy(): void {
    this.closeOpenSubmenu();
    this.#collection.destroy();
    this.#clearDismissTimer();
    this.#dismissController?.destroy();
    this.#dismissController = null;
    this.#dismissTracksScroll = false;
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  #ensureDismissController(): void {
    if (!this.isRoot || !this.#rootClose) return;
    if (!this.#dismissController) this.#attachDismissController(false);
    if (this.#dismissTracksScroll || this.#dismissTimer !== null) return;
    const view = this.#document.defaultView;
    if (!view) return;
    this.#dismissTimer = view.setTimeout(() => {
      this.#dismissTimer = null;
      if (!this.isRoot || this.#dismissTracksScroll || !this.#rootClose) return;
      this.#attachDismissController(true);
    });
  }

  #attachDismissController(scroll: boolean): void {
    this.#dismissController?.destroy();
    this.#dismissController = createDismissController({
      document: this.#document,
      outsidePointer: true,
      scroll,
      rootElements: () => this.#panels(),
      onDismiss: () => this.closeAll(true),
    });
    this.#dismissTracksScroll = scroll;
  }

  #teardownDismissIfIdle(): void {
    if (!this.isRoot || this.#panels().length || this.#rootClose) return;
    this.#clearDismissTimer();
    this.#dismissController?.destroy();
    this.#dismissController = null;
    this.#dismissTracksScroll = false;
  }

  #clearDismissTimer(): void {
    if (this.#dismissTimer === null) return;
    this.#document.defaultView?.clearTimeout(this.#dismissTimer);
    this.#dismissTimer = null;
  }
}
