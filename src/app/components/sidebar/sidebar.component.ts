import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  description?: string;
  soon?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sidebar-open]': 'open()' },
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  open = input(false);

  components = input<NavItem[]>([
    { path: '/overlay', label: 'Overlay', icon: '◎' },
    { path: '/dialog', label: 'Dialog', icon: '◻' },
    { path: '/splitter', label: 'Splitter', icon: '▦' },
    { path: '/toast', label: 'Toast', icon: '🔔' },
    { path: '/drag-drop', label: 'Drag & Drop', icon: '✥' },
    { path: '/tree', label: 'Tree', icon: '🌳' },
    { path: '/virtual-scroll', label: 'Virtual Scroll', icon: '▤' },
    { path: '/viewport', label: 'Viewport', icon: '◱' },
  ]);
}
