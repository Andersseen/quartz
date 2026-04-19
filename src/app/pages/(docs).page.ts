import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { HeaderComponent } from '../components/header/header.component';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout" [class.layout--sidebar-open]="layout.sidebarOpen()">
      <app-header />

      <!-- Backdrop — closes sidebar on tap outside -->
      <div class="layout__backdrop" (click)="layout.close()"></div>

      <app-sidebar [open]="layout.sidebarOpen()" />

      <main class="layout__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .layout {
        display: flex;
        min-height: 100vh;
        background: #0a0a0c;
        overflow-x: hidden;
      }

      .layout__content {
        flex: 1;
        margin-left: 260px;
        padding-top: 6rem;
        min-height: 100vh;
        min-width: 0;
      }

      .layout__backdrop {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 900;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
      }

      @media (max-width: 768px) {
        .layout__content {
          margin-left: 0;
          padding-top: 5rem;
        }

        .layout__backdrop {
          display: block;
        }

        .layout--sidebar-open .layout__backdrop {
          opacity: 1;
          pointer-events: auto;
        }
      }
    `,
  ],
})
export default class DocsLayout {
  readonly layout = inject(LayoutService);
}
