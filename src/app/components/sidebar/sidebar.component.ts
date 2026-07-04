import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  readonly agnosticItems = [
    {
      path: '/web-agnostic',
      label: 'Overview',
      icon: 'package' as const,
      soon: false,
    },
    {
      path: '/web-agnostic/splitter',
      label: 'Splitter',
      icon: 'grid' as const,
      soon: false,
    },
    {
      path: '/web-agnostic/drag-drop',
      label: 'Drag & Drop',
      icon: 'zap' as const,
      soon: false,
    },
    {
      path: '/web-agnostic/dialog',
      label: 'Dialog',
      icon: 'file' as const,
      soon: false,
    },
    {
      path: '/web-agnostic/tooltip',
      label: 'Tooltip',
      icon: 'package' as const,
      soon: false,
    },
  ];

  readonly menuItems = computed(() => [...this.angularItems, ...this.agnosticItems]);
}
