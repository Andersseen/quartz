import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { CollectionStore, resolveDirection, type CollectionItem } from '@quartz-headless/core';
import type { TabDirective } from './tab.directive';
import type { TabPanelDirective } from './tab-panel.directive';
import {
  DEFAULT_TABS_CONFIG,
  type TabsActivationMode,
  type TabsConfig,
  type TabsOrientation,
} from './tabs.types';

@Directive({
  selector: '[qzTabs]',
  exportAs: 'qzTabs',
  standalone: true,
})
export class TabsDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<TabDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'horizontal' },
    this.document,
  );
  private readonly panels = signal<readonly TabPanelDirective<T>[]>([]);
  private destroyed = false;

  readonly value = model<T | null>(null);
  readonly orientation = input<TabsOrientation>(DEFAULT_TABS_CONFIG.orientation);
  readonly activationMode = input<TabsActivationMode>(DEFAULT_TABS_CONFIG.activationMode);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(DEFAULT_TABS_CONFIG.compareWith);
  readonly config = input<Partial<TabsConfig<T>>>({});

  readonly activeId = this.collection.activeId;
  readonly activeTab = computed(() => this.collection.activeItem());

  registerTab(tab: TabDirective<T>): void {
    this.configureCollection();
    this.collection.register(tab as TabDirective<T> & CollectionItem);
    if (this.value() === null && !tab.tabDisabled()) {
      this.value.set(tab.value());
      this.collection.setActive(tab.id);
    } else if (this.isSelected(tab)) {
      this.collection.setActive(tab.id);
    }
  }

  unregisterTab(tab: TabDirective<T>): void {
    const selected = this.isSelected(tab);
    this.collection.unregister(tab as TabDirective<T> & CollectionItem);
    if (!selected) return;
    // Recover to a valid tab only once the removal settled: the widget may be torn down as a
    // whole (the bound value must survive) or the tab re-created with the same value (@for).
    queueMicrotask(() => {
      const value = this.value();
      if (this.destroyed || value === null || !this.compareWith()(value, tab.value())) return;
      if (this.collection.items().some((current) => this.compareWith()(current.value(), value))) {
        return;
      }
      this.value.set(this.collection.enabledItems()[0]?.value() ?? null);
    });
  }

  registerPanel(panel: TabPanelDirective<T>): void {
    this.panels.update((panels) => [...panels, panel]);
  }

  unregisterPanel(panel: TabPanelDirective<T>): void {
    this.panels.update((panels) => panels.filter((current) => current !== panel));
  }

  activate(tab: TabDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || tab.tabDisabled()) return;
    this.collection.setActive(tab.id, options);
    this.value.set(tab.value());
  }

  setActive(tab: TabDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || tab.tabDisabled()) return;
    this.collection.setActive(tab.id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  isSelected(tab: TabDirective<T>): boolean {
    const value = this.value();
    return value !== null && this.compareWith()(value, tab.value());
  }

  isPanelSelected(panel: TabPanelDirective<T>): boolean {
    const value = this.value();
    return value !== null && this.compareWith()(value, panel.value());
  }

  panelIdFor(tab: TabDirective<T>): string | null {
    const panel = this.panels().find((current) => this.compareWith()(current.value(), tab.value()));
    // No registered panel (e.g. lazily rendered): omit aria-controls instead of dangling.
    return panel?.id ?? null;
  }

  tabIdFor(panel: TabPanelDirective<T>): string | null {
    return (
      this.collection.items().find((tab) => this.compareWith()(tab.value(), panel.value()))?.id ??
      null
    );
  }

  handleListKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    this.configureCollection();
    const handled = this.collection.handleKeydown(event, { focus: true });
    if (!handled || this.activationMode() !== 'automatic') return;
    const active = this.collection.activeItem();
    if (active) this.value.set(active.value());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.collection.destroy();
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
    });
  }
}
