import { Directive, OnDestroy, OnInit, computed, inject, input } from '@angular/core';
import { QzIdGenerator } from '@quartz-headless/core';
import { TabsDirective } from './tabs.directive';

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
  private readonly ids = inject(QzIdGenerator);
  protected readonly tabs = inject(TabsDirective<T>);

  readonly value = input.required<T>({ alias: 'qzTabPanel' });
  readonly id = this.ids.next('qz-tab-panel');
  readonly selected = computed(() => this.tabs.isPanelSelected(this));
  readonly tabId = computed(() => this.tabs.tabIdFor(this));

  ngOnInit(): void {
    this.tabs.registerPanel(this);
  }

  ngOnDestroy(): void {
    this.tabs.unregisterPanel(this);
  }
}
