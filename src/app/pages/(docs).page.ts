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
    <div class="flex min-h-screen bg-[#0a0a0c] overflow-x-hidden">
      <app-header />

      <div
        class="fixed inset-0 bg-black/60 z-[900] opacity-0 pointer-events-none transition-opacity duration-300 max-md:block hidden"
        [class.opacity-100]="layout.sidebarOpen()"
        [class.pointer-events-auto]="layout.sidebarOpen()"
        (click)="layout.close()"
      ></div>

      <app-sidebar [open]="layout.sidebarOpen()" />

      <main
        class="flex-1 ml-[260px] pt-28 min-h-screen min-w-0 px-8 pb-12 max-md:ml-0 max-md:pt-24 max-md:px-4"
      >
        <router-outlet />
      </main>
    </div>
  `,
})
export default class DocsLayout {
  readonly layout = inject(LayoutService);
}
