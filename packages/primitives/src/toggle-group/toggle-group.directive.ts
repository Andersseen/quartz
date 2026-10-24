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
  output,
  signal,
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
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
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
  /**
   * Single mode only: whether pressing the pressed item clears the value (`null`). Default `true`
   * (the pre-0.11 behaviour); `false` makes single mode behave like "one of" with no empty state.
   */
  readonly allowDeselection = input(DEFAULT_TOGGLE_GROUP_CONFIG.allowDeselection, {
    transform: booleanAttribute,
  });
  readonly compareWith = input<(a: T, b: T) => boolean>(
    DEFAULT_TOGGLE_GROUP_CONFIG.compareWith as (a: T, b: T) => boolean,
  );
  /**
   * Emits the new value once per user activation: a `T | null` in single mode, a `T[]` in multiple
   * mode. Programmatic `value` writes and focus/roving navigation never emit.
   */
  readonly valueChangeCommitted = output<T | readonly T[] | null>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());
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
    if (this.isDisabled() || item.itemDisabled()) return;
    this.collection.setActive(item.id, options);
    let next: T | readonly T[] | null;
    if (this.type() === 'multiple') {
      const rawValue = this.value();
      const current = Array.isArray(rawValue) ? [...rawValue] : [];
      const index = current.findIndex((value) => this.compareWith()(value, item.value()));
      if (index === -1) current.push(item.value());
      else current.splice(index, 1);
      next = current;
    } else if (this.isPressed(item)) {
      if (!this.allowDeselection()) return;
      next = null;
    } else {
      next = item.value();
    }
    this.value.set(next);
    this.valueChangeCommitted.emit(next);
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  setActive(item: ToggleItemDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.isDisabled() || item.itemDisabled()) return;
    this.collection.setActive(item.id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  isPressed(item: ToggleItemDirective<T>): boolean {
    const value = this.value();
    if (this.type() === 'multiple') {
      return (
        Array.isArray(value) && value.some((current) => this.compareWith()(current, item.value()))
      );
    }
    return value !== null && !Array.isArray(value) && this.compareWith()(value as T, item.value());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
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
