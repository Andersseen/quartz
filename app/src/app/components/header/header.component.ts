import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

const COMPONENT_ROUTES = ['/overlay', '/splitter', '/toast', '/drag-drop', '/listbox', '/tooltip'];

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private router = inject(Router);

  isComponentsActive = computed(() =>
    COMPONENT_ROUTES.some((p) => this.router.url.startsWith(p)),
  );
}
