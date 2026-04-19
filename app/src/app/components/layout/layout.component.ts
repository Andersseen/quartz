import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout" [class.layout--sidebar-open]="sidebarOpen()">
      <app-header />

      <!-- Mobile hamburger -->
      <button
        class="layout__hamburger"
        (click)="sidebarOpen.update(v => !v)"
        [attr.aria-expanded]="sidebarOpen()"
        aria-label="Toggle navigation"
      >
        @if (sidebarOpen()) {
          <span class="layout__hamburger-icon">&#x2715;</span>
        } @else {
          <span class="layout__hamburger-icon">&#9776;</span>
        }
      </button>

      <!-- Backdrop for mobile -->
      <div class="layout__backdrop" (click)="sidebarOpen.set(false)"></div>

      <app-sidebar [open]="sidebarOpen()" />

      <main class="layout__content" (click)="closeSidebarOnNav()">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; }

      .layout {
        display: flex;
        min-height: 100vh;
        background: #0a0a0c;
      }

      .layout__content {
        flex: 1;
        margin-left: 260px;
        padding-top: 6rem;
        min-height: 100vh;
        min-width: 0;
      }

      .layout__hamburger {
        display: none;
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1100;
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 8px;
        background: rgba(15,15,19,0.9);
        backdrop-filter: blur(8px);
        color: #e5e7eb;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        transition: background 0.15s;
      }

      .layout__hamburger:hover { background: #1e1e2a; }

      .layout__hamburger-icon { line-height: 1; }

      .layout__backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        z-index: 900;
        opacity: 0;
        transition: opacity 0.3s;
      }

      @media (max-width: 768px) {
        .layout__content {
          margin-left: 0;
          padding-top: 5rem;
        }

        .layout__hamburger {
          display: flex;
        }

        .layout__backdrop {
          display: block;
        }

        .layout--sidebar-open .layout__backdrop {
          opacity: 1;
          pointer-events: auto;
        }

        .layout:not(.layout--sidebar-open) .layout__backdrop {
          pointer-events: none;
        }
      }
    `,
  ],
})
export default class LayoutComponent {
  sidebarOpen = signal(false);

  closeSidebarOnNav(): void {
    this.sidebarOpen.set(false);
  }
}
