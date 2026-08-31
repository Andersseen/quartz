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
import { SelectDirective } from './select.directive';

let selectOptionId = 0;

@Directive({
  selector: '[qzSelectOption]',
  exportAs: 'qzSelectOption',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"option"',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-disabled]': 'optionDisabled() || null',
    '[attr.data-qz-selected]': 'selected() ? "" : null',
    '[attr.data-qz-highlighted]': 'highlighted() ? "" : null',
    '[attr.data-qz-disabled]': 'optionDisabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
    '(pointerenter)': 'onPointerEnter()',
  },
})
export class SelectOptionDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly select = inject(SelectDirective<T>);

  readonly value = input.required<T>({ alias: 'qzSelectOption' });
  readonly disabled = input(false, {
    alias: 'qzSelectOptionDisabled',
    transform: booleanAttribute,
  });
  readonly label = input<string | null>(null, { alias: 'qzSelectOptionLabel' });

  readonly id = `qz-select-option-${++selectOptionId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly optionDisabled = computed(() => this.disabled());
  readonly selected = computed(() => this.select.isSelected(this));
  readonly highlighted = computed(() => this.select.activeId() === this.id);
  readonly tabIndex = computed(() =>
    this.optionDisabled() ? -1 : this.select.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.select.register(this);
  }

  ngOnDestroy(): void {
    this.select.unregister(this);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.select.selectOption(this);
  }

  onFocus(): void {
    if (!this.optionDisabled()) this.select.setActive(this);
  }

  onPointerEnter(): void {
    if (!this.optionDisabled()) this.select.setActive(this);
  }
}
