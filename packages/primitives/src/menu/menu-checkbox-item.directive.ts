import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { MenuService } from './menu.service';
import type { MenuCollectionEntry } from './menu.types';

let checkboxItemId = 0;

@Directive({
  selector: '[qzMenuCheckboxItem]',
  exportAs: 'qzMenuCheckboxItem',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"menuitemcheckbox"',
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
export class MenuCheckboxItemDirective implements OnInit, OnDestroy, MenuCollectionEntry {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly menuService = inject(MenuService);

  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnSelect = input(false, { transform: booleanAttribute });
  readonly selected = output<void>();

  readonly id = `qz-menu-checkbox-item-${++checkboxItemId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
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
    this.checked.update((value) => !value);
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
