import {
  Component,
  ChangeDetectionStrategy,
  effect,
  inject,
  computed,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LayoutService } from '../../services/layout.service';
import { LmnGithubIcon, LmnMenuIcon, LmnXIcon } from 'lumen-icons';

const COMPONENT_ROUTES = [
  '/components',
  '/directionality',
  '/overlay',
  '/dialog',
  '/splitter',
  '/toast',
  '/tooltip',
  '/drag-drop',
  '/tree',
  '/listbox',
  '/menu',
  '/popover',
  '/combobox',
  '/scroll-lock',
  '/select',
  '/tabs',
  '/accordion',
  '/switch',
  '/checkbox',
  '/radio-group',
  '/toggle',
  '/toggle-group',
  '/slider',
  '/virtual-scroll',
  '/viewport',
];

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LmnGithubIcon, LmnMenuIcon, LmnXIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'mobileNavOpen.set(false)',
  },
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly layout = inject(LayoutService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isComponentRoute = computed(() =>
    COMPONENT_ROUTES.some((p) => this.currentUrl().startsWith(p)),
  );

  /**
   * Standalone mobile menu for `/` and `/docs`, which have no sidebar to toggle (unlike
   * component routes — see isComponentRoute()). Without this, the desktop `<nav>` links
   * (Home/Components/Docs) are just hidden below `md` with no way to reach them.
   */
  readonly mobileNavOpen = signal(false);

  constructor() {
    effect(() => {
      this.currentUrl();
      this.mobileNavOpen.set(false);
    });
  }
}
