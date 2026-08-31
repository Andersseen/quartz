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

let tabsId = 0;

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
  private readonly generatedId = `qz-tabs-${++tabsId}`;
  private readonly panels = new Set<TabPanelDirective<T>>();

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
    if (selected) this.value.set(this.collection.enabledItems()[0]?.value() ?? null);
  }

  registerPanel(panel: TabPanelDirective<T>): void {
    this.panels.add(panel);
  }

  unregisterPanel(panel: TabPanelDirective<T>): void {
    this.panels.delete(panel);
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

  panelIdFor(tab: TabDirective<T>): string {
    const panel = [...this.panels].find((current) =>
      this.compareWith()(current.value(), tab.value()),
    );
    return panel?.id ?? `${this.generatedId}-panel-${tab.id}`;
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
