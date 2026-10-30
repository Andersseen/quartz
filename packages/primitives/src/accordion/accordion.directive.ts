import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  inject,
  input,
  model,
} from '@angular/core';
import {
  CollectionStore,
  focusSafely,
  resolveDirection,
  type CollectionItem,
} from '@quartz-headless/core';
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
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
  },
})
export class AccordionDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<AccordionItemDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical' },
    this.document,
  );
  private destroyed = false;

  readonly value = model<T | T[] | null>(null);
  readonly type = input<AccordionType>(DEFAULT_ACCORDION_CONFIG.type);
  readonly collapsible = input(DEFAULT_ACCORDION_CONFIG.collapsible, {
    transform: booleanAttribute,
  });
  readonly region = input(DEFAULT_ACCORDION_CONFIG.region, { transform: booleanAttribute });
  readonly orientation = input(DEFAULT_ACCORDION_CONFIG.orientation);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(DEFAULT_ACCORDION_CONFIG.compareWith);
  readonly config = input<Partial<AccordionConfig<T>>>({});

  registerItem(item: AccordionItemDirective<T>): void {
    this.configureCollection();
    this.collection.register(item as AccordionItemDirective<T> & CollectionItem);
    this.ensureRequiredOpenItem();
  }

  refreshItems(): void {
    this.collection.refreshOrder();
  }

  unregisterItem(item: AccordionItemDirective<T>): void {
    const wasOpen = this.isOpen(item);
    const wasFocused =
      this.document.activeElement === item.element() || item.hasFocus || item.blurredThisTask;
    this.collection.unregister(item as AccordionItemDirective<T> & CollectionItem);
    // Settle first: the accordion may be torn down as a whole (the bound value must survive) or
    // the item re-created with the same value (@for), in which case nothing was really removed.
    queueMicrotask(() => {
      if (this.destroyed) return;
      const returned = this.collection
        .items()
        .some((current) => this.compareWith()(current.value(), item.value()));
      if (wasOpen && !returned) this.removeValue(item.value());
      this.ensureRequiredOpenItem();
      if (wasFocused && !item.element()?.isConnected) {
        focusSafely(this.collection.activeItem()?.element() ?? null);
      }
    });
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  setActive(item: AccordionItemDirective<T>, options: { focus?: boolean } = {}): void {
    if (!this.disabled() && !item.itemDisabled()) this.collection.setActive(item.id, options);
  }

  toggle(item: AccordionItemDirective<T>): void {
    if (this.disabled() || item.itemDisabled()) return;
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
    if (this.disabled() || item.itemDisabled()) return;
    this.configureCollection();
    this.collection.refreshOrder();
    this.collection.setActive(item.id);
    this.collection.handleKeydown(event, { focus: true });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
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
    const first = this.collection.items().find((item) => !item.disabled());
    if (first) this.value.set(first.value());
  }

  isRequiredOpen(item: AccordionItemDirective<T>): boolean {
    return !this.isMultiple() && !this.collapsible() && this.isOpen(item);
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
      wrap: false,
    });
  }
}
