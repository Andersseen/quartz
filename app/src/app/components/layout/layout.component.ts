import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <app-sidebar />
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
      }

      .layout__content {
        flex: 1;
        margin-left: 260px;
        min-height: 100vh;
      }
    `,
  ],
})
export class LayoutComponent {}
