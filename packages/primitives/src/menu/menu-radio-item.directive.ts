import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MenuRadioGroupDirective } from './menu-radio-group.directive';
import { MenuService } from './menu.service';
import type { MenuCollectionEntry } from './menu.types';

let radioItemId = 0;

@Directive({
  selector: '[qzMenuRadioItem]',
  exportAs: 'qzMenuRadioItem',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"menuitemradio"',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.data-qz-checked]': 'checked() ? "" : null',
    '[attr.data-qz-disabled]': 'disabled() ? "" : null',
    '[attr.data-qz-highlighted]': 'highlighted() ? "" : null',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
  },
})
export class MenuRadioItemDirective<T> implements OnInit, OnDestroy, MenuCollectionEntry {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly menuService = inject(MenuService);
  private readonly group = inject<MenuRadioGroupDirective<T>>(MenuRadioGroupDirective);

  readonly value = input.required<T>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(false, { transform: booleanAttribute });
  readonly selected = output<void>();

  readonly id = `qz-menu-radio-item-${++radioItemId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly checked = computed(() => this.group.isChecked(this.value()));
  readonly highlighted = computed(() => this.menuService.activeId() === this.id);
  readonly tabIndex = computed(() =>
    this.disabled() ? -1 : this.menuService.activeTabIndex(this.id),
  );

  ngOnInit(): void {
    this.menuService.register(this);
  }

  ngOnDestroy(): void {
    this.menuService.unregister(this);
  }

  activate(): void {
    if (this.disabled()) return;
    this.group.select(this.value());
    this.selected.emit();
    if (this.closeOnSelect()) this.menuService.closeAll(true);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menuService.setActive(this.id, { focus: true });
    this.activate();
  }

  onFocus(): void {
    if (!this.disabled()) this.menuService.setActive(this.id);
  }
}
