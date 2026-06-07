import { Component, ChangeDetectionStrategy, input } from '@angular/core';
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

type NavIcon =
  | 'bell'
  | 'bookmark'
  | 'database'
  | 'file'
  | 'grid'
  | 'home'
  | 'list'
  | 'package'
  | 'refresh'
  | 'zap';

interface NavItem {
  path: string;
  label: string;
  icon: NavIcon;
  description?: string;
  soon?: boolean;
}

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.translate-x-0]': 'open()', '[class.-translate-x-full]': '!open()' },
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  open = input(false);

  components = input<NavItem[]>([
    { path: '/overlay', label: 'Overlay', icon: 'package' },
    { path: '/dialog', label: 'Dialog', icon: 'file' },
    { path: '/splitter', label: 'Splitter', icon: 'grid' },
    { path: '/toast', label: 'Toast', icon: 'bell' },
    { path: '/drag-drop', label: 'Drag & Drop', icon: 'zap' },
    { path: '/tree', label: 'Tree', icon: 'list' },
    { path: '/virtual-scroll', label: 'Virtual Scroll', icon: 'refresh' },
    { path: '/viewport', label: 'Viewport', icon: 'database' },
  ]);
}
