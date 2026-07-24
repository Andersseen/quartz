import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { version } from '../../../../packages/quartz/package.json';
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

  readonly version = version;

  readonly groupLabel = 'Angular Components';

  readonly angularItems = [
    {
      path: '/overlay',
      label: 'Overlay',
      icon: 'package' as const,
      soon: false,
    },
    { path: '/dialog', label: 'Dialog', icon: 'file' as const, soon: false },
    {
      path: '/splitter',
      label: 'Splitter',
      icon: 'grid' as const,
      soon: false,
    },
    { path: '/toast', label: 'Toast', icon: 'bell' as const, soon: false },
    {
      path: '/drag-drop',
      label: 'Drag & Drop',
      icon: 'zap' as const,
      soon: false,
    },
    { path: '/tree', label: 'Tree', icon: 'list' as const, soon: false },
    {
      path: '/virtual-scroll',
      label: 'Virtual Scroll',
      icon: 'refresh' as const,
      soon: false,
    },
    {
      path: '/viewport',
      label: 'Viewport',
      icon: 'database' as const,
      soon: false,
    },
  ];

  readonly menuItems = this.angularItems;
}
