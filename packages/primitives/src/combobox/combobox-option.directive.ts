import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { QzIdGenerator, type CollectionItem } from '@quartz-headless/core';
import { ComboboxDirective } from './combobox.directive';

@Directive({
  selector: '[qzComboboxOption]',
  exportAs: 'qzComboboxOption',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"option"',
    '[attr.aria-selected]': 'ariaSelected()',
    '[attr.aria-disabled]': 'optionDisabled() || null',
    '[attr.data-qz-active]': 'active() ? "" : null',
    '[attr.data-qz-selected]': 'selected() ? "" : null',
    '[attr.data-qz-disabled]': 'optionDisabled() ? "" : null',
    '(mousedown)': 'onPointerDown($event)',
    '(click)': 'onClick($event)',
  },
})
export class ComboboxOptionDirective<T> implements OnInit, OnDestroy, CollectionItem {
  private readonly ids = inject(QzIdGenerator);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly combobox = inject<ComboboxDirective<T>>(ComboboxDirective);

  readonly qzComboboxOption = input.required<T>();
  readonly qzComboboxOptionDisabled = input(false, { transform: booleanAttribute });
  readonly qzComboboxOptionLabel = input<string | null>(null);
  readonly id = this.ids.next('qz-combobox-option');
  readonly value = this.qzComboboxOption;
  readonly optionDisabled = this.qzComboboxOptionDisabled;
  readonly active = computed(() => this.combobox.activeId() === this.id);
  readonly selected = computed(() => this.combobox.isSelected(this));
  /** Multiple: the selection. Single: the highlighted option (APG active-descendant pattern). */
  readonly ariaSelected = computed(() =>
    this.combobox.multiple() ? this.selected() : this.active(),
  );
  readonly label = computed(
    () =>
      this.qzComboboxOptionLabel() ??
      this.elementRef.nativeElement.textContent?.trim() ??
      this.combobox.displayOption(this.value()),
  );
  readonly element = () => this.elementRef.nativeElement;
  readonly disabled = () => this.optionDisabled();

  ngOnInit(): void {
    this.combobox.register(this);
  }

  ngOnDestroy(): void {
    this.combobox.unregister(this);
  }

  onPointerDown(event: MouseEvent): void {
    event.preventDefault();
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.combobox.selectOption(this);
  }
}
