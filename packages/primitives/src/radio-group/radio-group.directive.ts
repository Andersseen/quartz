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
import type { RadioDirective } from './radio.directive';
import { DEFAULT_RADIO_GROUP_CONFIG, type RadioGroupOrientation } from './radio-group.types';

@Directive({
  selector: '[qzRadioGroup]',
  exportAs: 'qzRadioGroup',
  standalone: true,
  host: {
    '[attr.role]': '"radiogroup"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class RadioGroupDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<RadioDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical', wrap: true },
    this.document,
  );

  readonly value = model<T | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<RadioGroupOrientation>(DEFAULT_RADIO_GROUP_CONFIG.orientation);
  readonly loop = input(DEFAULT_RADIO_GROUP_CONFIG.loop, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(
    DEFAULT_RADIO_GROUP_CONFIG.compareWith as (a: T, b: T) => boolean,
  );

  readonly activeId = this.collection.activeId;
  readonly activeRadio = computed(() => this.collection.activeItem());

  register(radio: RadioDirective<T>): void {
    this.configureCollection();
    this.collection.register(radio as RadioDirective<T> & CollectionItem);
    if (this.isSelected(radio)) this.collection.setActive(radio.id);
  }

  unregister(radio: RadioDirective<T>): void {
    const selected = this.isSelected(radio);
    this.collection.unregister(radio as RadioDirective<T> & CollectionItem);
    if (selected) this.value.set(null);
  }

  select(radio: RadioDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || radio.radioDisabled()) return;
    this.collection.setActive(radio.id, options);
    this.value.set(radio.value());
  }

  setActive(radio: RadioDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.disabled() || radio.radioDisabled()) return;
    this.collection.setActive(radio.id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    const selected = this.collection.items().find((radio) => this.isSelected(radio));
    if (selected) return selected.id === id ? 0 : -1;
    return this.collection.activeTabIndex(id);
  }

  isSelected(radio: RadioDirective<T>): boolean {
    const value = this.value();
    return value !== null && this.compareWith()(value, radio.value());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    this.configureCollection();
    if (event.key === ' ') {
      const active = this.collection.activeItem();
      if (active) {
        event.preventDefault();
        this.select(active, { focus: true });
      }
      return;
    }
    const handled = this.collection.handleKeydown(event, { focus: true });
    const active = this.collection.activeItem();
    if (handled && active) this.value.set(active.value());
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
