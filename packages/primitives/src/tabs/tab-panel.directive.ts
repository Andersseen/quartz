import { Directive, OnDestroy, OnInit, computed, inject, input } from '@angular/core';
import { TabsDirective } from './tabs.directive';

let tabPanelId = 0;

@Directive({
  selector: '[qzTabPanel]',
  exportAs: 'qzTabPanel',
  standalone: true,
  host: {
    '[attr.id]': 'id',
    '[attr.role]': '"tabpanel"',
    '[attr.tabindex]': '0',
    '[attr.aria-labelledby]': 'tabId()',
    '[attr.hidden]': 'selected() ? null : ""',
    '[attr.data-qz-state]': 'selected() ? "active" : "inactive"',
  },
})
export class TabPanelDirective<T> implements OnInit, OnDestroy {
  protected readonly tabs = inject(TabsDirective<T>);

  readonly value = input.required<T>({ alias: 'qzTabPanel' });
  readonly id = `qz-tab-panel-${++tabPanelId}`;
  readonly selected = computed(() => this.tabs.isPanelSelected(this));
  readonly tabId = computed(() => this.tabs.tabIdFor(this));

  ngOnInit(): void {
    this.tabs.registerPanel(this);
  }

  ngOnDestroy(): void {
    this.tabs.unregisterPanel(this);
  }
}
