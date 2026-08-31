import { DOCUMENT } from '@angular/common';
import { Directive, OnDestroy, booleanAttribute, inject, input, model } from '@angular/core';
import { CollectionStore, focusSafely, type CollectionItem } from '@quartz-headless/core';
import type { AccordionItemDirective } from './accordion-item.directive';
import {
  DEFAULT_ACCORDION_CONFIG,
  type AccordionConfig,
  type AccordionType,
} from './accordion.types';

@Directive({
  selector: '[qzAccordion]',
  exportAs: 'qzAccordion',
  standalone: true,
  host: {
    '[attr.data-qz-type]': 'type()',
  },
})
export class AccordionDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly collection = new CollectionStore<AccordionItemDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical' },
    this.document,
  );

  readonly value = model<T | T[] | null>(null);
  readonly type = input<AccordionType>(DEFAULT_ACCORDION_CONFIG.type);
  readonly collapsible = input(DEFAULT_ACCORDION_CONFIG.collapsible, {
    transform: booleanAttribute,
  });
  readonly region = input(DEFAULT_ACCORDION_CONFIG.region, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(DEFAULT_ACCORDION_CONFIG.compareWith);
  readonly config = input<Partial<AccordionConfig<T>>>({});

  registerItem(item: AccordionItemDirective<T>): void {
    this.collection.register(item as AccordionItemDirective<T> & CollectionItem);
    this.ensureRequiredOpenItem();
  }

  refreshItems(): void {
    this.collection.refreshOrder();
  }

  unregisterItem(item: AccordionItemDirective<T>): void {
    const wasOpen = this.isOpen(item);
    this.collection.unregister(item as AccordionItemDirective<T> & CollectionItem);
    if (wasOpen) this.removeValue(item.value());
    this.ensureRequiredOpenItem();
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  setActive(item: AccordionItemDirective<T>, options: { focus?: boolean } = {}): void {
    if (!item.itemDisabled()) this.collection.setActive(item.id, options);
  }

  toggle(item: AccordionItemDirective<T>): void {
    if (item.itemDisabled()) return;
    this.setActive(item);
    if (this.isMultiple()) {
      this.toggleMultiple(item.value());
      return;
    }
    if (this.isOpen(item)) {
      if (this.collapsible()) this.value.set(null);
      return;
    }
    this.value.set(item.value());
  }

  isOpen(item: AccordionItemDirective<T>): boolean {
    const value = this.value();
    if (this.isMultiple()) {
      return (
        Array.isArray(value) && value.some((current) => this.compareWith()(current, item.value()))
      );
    }
    return value !== null && !Array.isArray(value) && this.compareWith()(value, item.value());
  }

  handleTriggerKeydown(item: AccordionItemDirective<T>, event: KeyboardEvent): void {
    const items = this.collection.enabledItems();
    const current = Math.max(
      0,
      items.findIndex((entry) => entry === item),
    );
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusItem(items[Math.min(current + 1, items.length - 1)] ?? null);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusItem(items[Math.max(current - 1, 0)] ?? null);
        return;
      case 'Home':
        event.preventDefault();
        this.focusItem(items[0] ?? null);
        return;
      case 'End':
        event.preventDefault();
        this.focusItem(items[items.length - 1] ?? null);
        return;
    }
  }

  ngOnDestroy(): void {
    this.collection.destroy();
  }

  private isMultiple(): boolean {
    return this.type() === 'multiple';
  }

  private toggleMultiple(itemValue: T): void {
    const current = this.value();
    const values = Array.isArray(current) ? [...current] : [];
    const index = values.findIndex((value) => this.compareWith()(value, itemValue));
    if (index === -1) values.push(itemValue);
    else values.splice(index, 1);
    this.value.set(values);
  }

  private removeValue(itemValue: T): void {
    const current = this.value();
    if (Array.isArray(current)) {
      this.value.set(current.filter((value) => !this.compareWith()(value, itemValue)));
    } else if (current !== null && this.compareWith()(current, itemValue)) {
      this.value.set(null);
    }
  }

  private ensureRequiredOpenItem(): void {
    if (this.isMultiple() || this.collapsible() || this.value() !== null) return;
    const first = this.collection.enabledItems()[0];
    if (first) this.value.set(first.value());
  }

  private focusItem(item: AccordionItemDirective<T> | null): void {
    if (item) this.collection.setActive(item.id);
    focusSafely(item?.element() ?? null);
  }
}
