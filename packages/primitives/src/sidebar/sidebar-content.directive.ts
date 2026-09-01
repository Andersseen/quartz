import { Directive, computed, inject } from '@angular/core';
import { SidebarDirective } from './sidebar.directive';

@Directive({
  selector: '[qzSidebarContent]',
  exportAs: 'qzSidebarContent',
  standalone: true,
  host: {
    '[attr.data-qz-sidebar-content]': '""',
    '[attr.data-qz-mode]': 'sidebar.currentMode()',
    '[attr.data-qz-state]': 'sidebar.state()',
    '[style.grid-column]': 'gridColumn()',
    '[style.min-width]': '"0"',
  },
})
export class SidebarContentDirective {
  protected readonly sidebar = inject(SidebarDirective);

  readonly gridColumn = computed(() => {
    if (this.sidebar.currentMode() !== 'push') return '1';
    return this.sidebar.side() === 'inline-start' ? '2' : '1';
  });
}
