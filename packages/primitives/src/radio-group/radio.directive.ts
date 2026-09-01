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
import { RadioGroupDirective } from './radio-group.directive';

let radioId = 0;

@Directive({
  selector: '[qzRadio]',
  exportAs: 'qzRadio',
  standalone: true,
  host: {
    type: 'button',
    '[attr.id]': 'id',
    '[attr.role]': '"radio"',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-checked]': 'selected()',
    '[attr.aria-disabled]': 'radioDisabled() || null',
    '[attr.disabled]': 'radioDisabled() ? "" : null',
    '[attr.data-qz-state]': 'selected() ? "checked" : "unchecked"',
    '[attr.data-qz-disabled]': 'radioDisabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
  },
})
export class RadioDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly group = inject(RadioGroupDirective<T>);

  readonly value = input.required<T>({ alias: 'qzRadio' });
  readonly disabled = input(false, { alias: 'qzRadioDisabled', transform: booleanAttribute });

  readonly id = `qz-radio-${++radioId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly radioDisabled = computed(() => this.disabled() || this.group.disabled());
  readonly selected = computed(() => this.group.isSelected(this));
  readonly tabIndex = computed(() =>
    this.radioDisabled() ? -1 : this.group.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.group.register(this);
  }

  ngOnDestroy(): void {
    this.group.unregister(this);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.group.select(this, { focus: true });
  }

  onFocus(): void {
    this.group.setActive(this);
  }
}
