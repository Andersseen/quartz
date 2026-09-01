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
import type { ToggleItemDirective } from './toggle-item.directive';
import {
  DEFAULT_TOGGLE_GROUP_CONFIG,
  type ToggleGroupOrientation,
  type ToggleGroupType,
} from './toggle-group.types';

@Directive({
  selector: '[qzToggleGroup]',
  exportAs: 'qzToggleGroup',
  standalone: true,
  host: {
    '[attr.role]': '"group"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ToggleGroupDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<ToggleItemDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'horizontal', wrap: true },
    this.document,
  );

  readonly value = model<T | readonly T[] | null>(null);
  readonly type = input<ToggleGroupType>(DEFAULT_TOGGLE_GROUP_CONFIG.type);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<ToggleGroupOrientation>(DEFAULT_TOGGLE_GROUP_CONFIG.orientation);
  readonly loop = input(DEFAULT_TOGGLE_GROUP_CONFIG.loop, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(
    DEFAULT_TOGGLE_GROUP_CONFIG.compareWith as (a: T, b: T) => boolean,
  );
  readonly activeId = this.collection.activeId;
  readonly activeItem = computed(() => this.collection.activeItem());

  register(item: ToggleItemDirective<T>): void {
    this.configureCollection();
    this.collection.register(item as ToggleItemDirective<T> & CollectionItem);
  }

  unregister(item: ToggleItemDirective<T>): void {
    this.collection.unregister(item as ToggleItemDirective<T> & CollectionItem);
  }

  toggle(item: ToggleItemDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || item.itemDisabled()) return;
    this.collection.setActive(item.id, options);
    if (this.type() === 'multiple') {
      const rawValue = this.value();
      const current = Array.isArray(rawValue) ? [...rawValue] : [];
      const index = current.findIndex((value) => this.compareWith()(value, item.value()));
      if (index === -1) current.push(item.value());
      else current.splice(index, 1);
      this.value.set(current);
    } else {
      this.value.set(this.isPressed(item) ? null : item.value());
    }
  }

  setActive(item: ToggleItemDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || item.itemDisabled()) return;
    this.collection.setActive(item.id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  isPressed(item: ToggleItemDirective<T>): boolean {
    const value = this.value();
    if (Array.isArray(value))
      return value.some((current) => this.compareWith()(current, item.value()));
    return value !== null && this.compareWith()(value as T, item.value());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    this.configureCollection();
    this.collection.handleKeydown(event, { focus: true });
  }

  ngOnDestroy(): void {
    this.collection.destroy();
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
      wrap: this.loop(),
    });
  }
}
