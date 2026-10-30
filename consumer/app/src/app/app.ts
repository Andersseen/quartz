import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Pages" class="pages">
      <a routerLink="/forms" routerLinkActive="active" ariaCurrentWhenActive="page">Forms</a>
      <a routerLink="/overlays" routerLinkActive="active" ariaCurrentWhenActive="page">Overlays</a>
      <a routerLink="/navigation" routerLinkActive="active" ariaCurrentWhenActive="page"
        >Navigation</a
      >
    </nav>
    <main><router-outlet /></main>
  `,
})
export class App {}
