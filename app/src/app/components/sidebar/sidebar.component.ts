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
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  components = input<NavItem[]>([
    { path: '/overlay', label: 'Overlay', icon: '◎' },
    { path: '/splitter', label: 'Splitter', icon: '▦' },
    { path: '/toast', label: 'Toast', icon: '🔔' },
    { path: '/drag-drop', label: 'Drag & Drop', icon: '✥' },
    { path: '/listbox', label: 'Listbox', icon: '☰', soon: true },
    { path: '/tooltip', label: 'Tooltip', icon: '💬', soon: true },
  ]);
}
