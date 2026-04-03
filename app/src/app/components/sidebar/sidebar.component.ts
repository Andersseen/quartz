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
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sidebar">
      <div class="sidebar__header">
        <div class="sidebar__logo">
          <span class="sidebar__logo-icon">💎</span>
          <div class="sidebar__logo-text">
            <span class="sidebar__logo-title">Quartz UI</span>
            <span class="sidebar__logo-subtitle">Headless Components</span>
          </div>
        </div>
      </div>

      <nav class="sidebar__nav">
        <div class="sidebar__section">
          <span class="sidebar__section-title">Overview</span>
          <a
            routerLink="/"
            routerLinkActive="sidebar__link--active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="sidebar__link"
          >
            <span class="sidebar__link-icon">◈</span>
            <span>Getting Started</span>
          </a>
        </div>

        <div class="sidebar__section">
          <span class="sidebar__section-title">Components</span>
          @for (item of components(); track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="sidebar__link--active"
              class="sidebar__link"
              [class.sidebar__link--soon]="item.soon"
            >
              <span class="sidebar__link-icon">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
              @if (item.soon) {
                <span class="sidebar__soon-badge">Soon</span>
              }
            </a>
          }
        </div>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__version">
          <span class="sidebar__version-dot"></span>
          <span>v0.0.1</span>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      .sidebar {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 260px;
        background: #0f0f13;
        border-right: 1px solid #1e1e2a;
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
      }

      .sidebar__header {
        padding: 1.5rem;
        border-bottom: 1px solid #1e1e2a;
      }

      .sidebar__logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .sidebar__logo-icon {
        font-size: 1.75rem;
        line-height: 1;
      }

      .sidebar__logo-text {
        display: flex;
        flex-direction: column;
      }

      .sidebar__logo-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: -0.02em;
      }

      .sidebar__logo-subtitle {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .sidebar__nav {
        flex: 1;
        padding: 1.5rem 0.75rem;
        overflow-y: auto;
      }

      .sidebar__section {
        margin-bottom: 1.5rem;
      }

      .sidebar__section-title {
        display: block;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        padding: 0 0.75rem;
        margin-bottom: 0.5rem;
      }

      .sidebar__link {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        padding: 0.625rem 0.75rem;
        border-radius: 8px;
        color: #9ca3af;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        transition: all 0.15s ease;
        margin-bottom: 0.25rem;
        position: relative;
      }

      .sidebar__link:hover {
        background: #1e1e2a;
        color: #e5e7eb;
      }

      .sidebar__link--active {
        background: #1e1430;
        color: #a78bfa;
      }

      .sidebar__link--active::before {
        content: '';
        position: absolute;
        left: -0.75rem;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background: #7c3aed;
        border-radius: 0 2px 2px 0;
      }

      .sidebar__link--soon {
        opacity: 0.5;
        pointer-events: none;
      }

      .sidebar__link-icon {
        font-size: 1rem;
        flex-shrink: 0;
        width: 1.25rem;
        text-align: center;
      }

      .sidebar__soon-badge {
        margin-left: auto;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        background: #1e1e2a;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
      }

      .sidebar__footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #1e1e2a;
      }

      .sidebar__version {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
      }

      .sidebar__version-dot {
        width: 6px;
        height: 6px;
        background: #22c55e;
        border-radius: 50%;
        box-shadow: 0 0 8px #22c55e;
      }
    `,
  ],
})
export class SidebarComponent {
  components = input<NavItem[]>([
    { path: '/overlay', label: 'Overlay', icon: '◎' },
    { path: '/splitter', label: 'Splitter', icon: '▦' },
    { path: '/toast', label: 'Toast', icon: '🔔' },
    { path: '/listbox', label: 'Listbox', icon: '☰', soon: true },
    { path: '/tooltip', label: 'Tooltip', icon: '💬', soon: true },
  ]);
}
