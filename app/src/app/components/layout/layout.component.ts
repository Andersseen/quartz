import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout">
      <app-header />
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
        padding-top: 6rem;
        min-height: 100vh;
      }
    `,
  ],
})
export class LayoutComponent {}
