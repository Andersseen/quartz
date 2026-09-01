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
import { ToggleGroupDirective } from './toggle-group.directive';

let toggleItemId = 0;

@Directive({
  selector: '[qzToggleItem]',
  exportAs: 'qzToggleItem',
  standalone: true,
  host: {
    type: 'button',
    '[attr.id]': 'id',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-pressed]': 'pressed()',
    '[attr.aria-disabled]': 'itemDisabled() || null',
    '[attr.disabled]': 'itemDisabled() ? "" : null',
    '[attr.data-qz-state]': 'pressed() ? "on" : "off"',
    '[attr.data-qz-disabled]': 'itemDisabled() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
  },
})
export class ToggleItemDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly group = inject(ToggleGroupDirective<T>);

  readonly value = input.required<T>({ alias: 'qzToggleItem' });
  readonly disabled = input(false, { alias: 'qzToggleItemDisabled', transform: booleanAttribute });
  readonly id = `qz-toggle-item-${++toggleItemId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly itemDisabled = computed(() => this.disabled() || this.group.disabled());
  readonly pressed = computed(() => this.group.isPressed(this));
  readonly tabIndex = computed(() =>
    this.itemDisabled() ? -1 : this.group.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.group.register(this);
  }

  ngOnDestroy(): void {
    this.group.unregister(this);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.group.toggle(this, { focus: true });
  }

  onFocus(): void {
    this.group.setActive(this);
  }
}
