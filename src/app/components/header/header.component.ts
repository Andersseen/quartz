import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { LmnGithubIcon, LmnMenuIcon, LmnXIcon } from 'lumen-icons';

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

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Mobile menu for the site-level links; the documentation sidebar is owned by Doqs. */
  readonly mobileNavOpen = signal(false);

  constructor() {
    effect(() => {
      this.currentUrl();
      this.mobileNavOpen.set(false);
    });
  }
}
