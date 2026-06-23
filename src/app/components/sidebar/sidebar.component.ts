import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import {
  VoltBadge,
  VoltSidebar,
  VoltSidebarContent,
  VoltSidebarFooter,
  VoltSidebarGroup,
  VoltSidebarHeader,
  VoltSidebarItem,
} from '@voltui/components';
import {
  LmnBellIcon,
  LmnBookmarkIcon,
  LmnDatabaseIcon,
  LmnFileIcon,
  LmnGridIcon,
  LmnHomeIcon,
  LmnListIcon,
  LmnPackageIcon,
  LmnRefreshCwIcon,
  LmnZapIcon,
} from 'lumen-icons';

@Component({
  selector: 'app-sidebar',
  imports: [
    VoltBadge,
    VoltSidebar,
    VoltSidebarContent,
    VoltSidebarFooter,
    VoltSidebarGroup,
    VoltSidebarHeader,
    VoltSidebarItem,
    LmnBellIcon,
    LmnBookmarkIcon,
    LmnDatabaseIcon,
    LmnFileIcon,
    LmnGridIcon,
    LmnHomeIcon,
    LmnListIcon,
    LmnPackageIcon,
    LmnRefreshCwIcon,
    LmnZapIcon,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.translate-x-0]': 'open()', '[class.-translate-x-full]': '!open()' },
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  open = input(false);

  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isAgnostic = computed(() => this.currentUrl().startsWith('/web-agnostic'));

  readonly menuItems = computed(() => {
    if (this.isAgnostic()) {
      return [
        {
          path: '/web-agnostic',
          fragment: 'splitter',
          label: 'Splitter',
          icon: 'grid' as const,
          soon: false,
        },
        {
          path: '/web-agnostic',
          fragment: 'drag-drop',
          label: 'Drag & Drop',
          icon: 'zap' as const,
          soon: false,
        },
        {
          path: '/web-agnostic',
          fragment: 'dialog',
          label: 'Dialog',
          icon: 'file' as const,
          soon: false,
        },
        {
          path: '/web-agnostic',
          fragment: 'tooltip',
          label: 'Tooltip',
          icon: 'package' as const,
          soon: false,
        },
      ];
    }
    return [
      {
        path: '/overlay',
        label: 'Overlay',
        icon: 'package' as const,
        soon: false,
        fragment: undefined,
      },
      { path: '/dialog', label: 'Dialog', icon: 'file' as const, soon: false, fragment: undefined },
      {
        path: '/splitter',
        label: 'Splitter',
        icon: 'grid' as const,
        soon: false,
        fragment: undefined,
      },
      { path: '/toast', label: 'Toast', icon: 'bell' as const, soon: false, fragment: undefined },
      {
        path: '/drag-drop',
        label: 'Drag & Drop',
        icon: 'zap' as const,
        soon: false,
        fragment: undefined,
      },
      { path: '/tree', label: 'Tree', icon: 'list' as const, soon: false, fragment: undefined },
      {
        path: '/virtual-scroll',
        label: 'Virtual Scroll',
        icon: 'refresh' as const,
        soon: false,
        fragment: undefined,
      },
      {
        path: '/viewport',
        label: 'Viewport',
        icon: 'database' as const,
        soon: false,
        fragment: undefined,
      },
    ];
  });
}
