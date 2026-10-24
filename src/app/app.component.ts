import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { HeaderComponent } from './components/header/header.component';

/**
 * Root shell. The landing and catalogue pages render their own header; the documentation region
 * is owned by Doqs (sidebar, table of contents, search), so the site header is added around it
 * here and nothing else is duplicated.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isDocs()) {
      <app-header />
    }
    <div [class.qz-docs-host]="isDocs()" [attr.role]="documentRole() ? 'main' : null">
      <router-outlet />
    </div>
  `,
})
export class App {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    const document = inject(DOCUMENT);
    afterNextRender(() => {
      const view = document.defaultView;
      if (!view?.requestAnimationFrame) return; // prerender: no animation frames, nothing to restore
      // Doqs re-creates its sidebar for every document, which resets its scroll position. Keep the
      // reader's place in the long navigation list across page changes (host-level workaround).
      let saved = 0;
      document.addEventListener(
        'scroll',
        (event) => {
          const target = event.target;
          if (target instanceof HTMLElement && target.matches('nav.doq-sidebar')) {
            saved = target.scrollTop;
          }
        },
        true,
      );
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        // The new sidebar appears once the document route has rendered: retry for a few frames.
        const previous = document.querySelector('nav.doq-sidebar');
        let attempts = 0;
        const restore = () => {
          const sidebar = document.querySelector<HTMLElement>('nav.doq-sidebar');
          if (sidebar && sidebar !== previous && sidebar.scrollHeight > sidebar.clientHeight) {
            if (saved > 0) sidebar.scrollTop = saved;
          } else if (++attempts < 60) {
            view.requestAnimationFrame(restore);
          }
        };
        view.requestAnimationFrame(restore);
      });
    });
  }

  protected readonly isDocs = () => /^\/docs(?:[/?#]|$)/.test(this.url());
  /** Doqs document pages have no `<main>`; its index page renders its own, so only wrap the former. */
  protected readonly documentRole = () => this.isDocs() && !/^\/docs\/?(?:[?#]|$)/.test(this.url());
}
