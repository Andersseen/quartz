import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LmnGithubIcon, LmnMenuIcon, LmnXIcon } from 'lumen-icons';
import { GITHUB_URL } from '../../site/site-config';

interface NavLink {
  label: string;
  path: string;
  /** Match only the exact URL (Home), otherwise any URL below the path. */
  exact: boolean;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LmnGithubIcon, LmnMenuIcon, LmnXIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
    '(focusout)': 'onFocusOut($event)',
  },
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly toggle = viewChild<ElementRef<HTMLButtonElement>>('toggle');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly github = GITHUB_URL;
  protected readonly links: NavLink[] = [
    { label: 'Home', path: '/', exact: true },
    { label: 'Components', path: '/components', exact: false },
    { label: 'Docs', path: '/docs', exact: false },
  ];

  /**
   * Mobile menu for the site-level links; the documentation sidebar is owned by Doqs. The panel is
   * only rendered while open, so its links are never keyboard-reachable (or announced) when closed.
   */
  readonly mobileNavOpen = signal(false);

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNavOpen.set(false));
  }

  protected toggleMenu(): void {
    this.mobileNavOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.mobileNavOpen.set(false);
  }

  /** Escape closes the menu and, if focus was inside it, returns focus to the toggle. */
  protected onEscape(): void {
    if (!this.mobileNavOpen()) return;
    const active = this.toggle()?.nativeElement.ownerDocument.activeElement ?? null;
    const focusInside =
      active !== null &&
      (this.panel()?.nativeElement.contains(active) || this.toggle()?.nativeElement === active);
    this.mobileNavOpen.set(false);
    if (focusInside) this.toggle()?.nativeElement.focus();
  }

  /** Tabbing out of the open menu dismisses it so it never hangs open behind other content. */
  protected onFocusOut(event: FocusEvent): void {
    if (!this.mobileNavOpen()) return;
    const next = event.relatedTarget as Node | null;
    if (next === null) return; // window blur or a click on a non-focusable area: backdrop handles it
    const header = event.currentTarget as HTMLElement;
    if (!header.contains(next)) this.mobileNavOpen.set(false);
  }
}
