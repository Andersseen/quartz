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
import { TabsDirective } from './tabs.directive';

let tabId = 0;

@Directive({
  selector: '[qzTab]',
  exportAs: 'qzTab',
  standalone: true,
  host: {
    type: 'button',
    '[attr.id]': 'id',
    '[attr.role]': '"tab"',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-selected]': 'selected()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.aria-disabled]': 'tabDisabled() || null',
    '[attr.data-qz-selected]': 'selected() ? "" : null',
    '[attr.data-qz-disabled]': 'tabDisabled() ? "" : null',
    '[attr.data-qz-state]': 'selected() ? "active" : "inactive"',
    '(click)': 'onClick($event)',
    '(focus)': 'onFocus()',
  },
})
export class TabDirective<T> implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  protected readonly tabs = inject(TabsDirective<T>);

  readonly value = input.required<T>({ alias: 'qzTab' });
  readonly disabled = input(false, { alias: 'qzTabDisabled', transform: booleanAttribute });

  readonly id = `qz-tab-${++tabId}`;
  readonly element = () => this.elementRef.nativeElement;
  readonly label = () => this.elementRef.nativeElement.textContent?.trim() ?? '';
  readonly tabDisabled = computed(() => this.disabled());
  readonly selected = computed(() => this.tabs.isSelected(this));
  readonly tabIndex = computed(() => (this.tabDisabled() ? -1 : this.tabs.activeTabIndex(this.id)));
  readonly panelId = computed(() => this.tabs.panelIdFor(this));

  ngOnInit(): void {
    this.tabs.registerTab(this);
  }

  ngOnDestroy(): void {
    this.tabs.unregisterTab(this);
  }

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.tabs.activate(this, { focus: true });
  }

  onFocus(): void {
    this.tabs.setActive(this);
  }
}
