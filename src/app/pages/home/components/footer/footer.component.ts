import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  GITHUB_URL,
  LATEST_NPM_VERSION,
  NPM_CORE_URL,
  NPM_PRIMITIVES_URL,
} from '../../../../site/site-config';

@Component({
  selector: 'app-home-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="border-t border-line px-4 py-14 sm:px-6 md:px-10">
      <div class="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p class="font-semibold text-fg">Quartz Headless</p>
          <p class="mt-3 max-w-xs text-sm leading-6 text-fg-muted">
            Unstyled, accessible Angular primitives. You own the styles; Quartz owns the behaviour.
          </p>
        </div>
        <nav aria-label="Documentation">
          <h2 class="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">Learn</h2>
          <ul class="mt-4 space-y-1 text-sm">
            @for (link of docs; track link.path) {
              <li>
                <a
                  [routerLink]="link.path"
                  class="site-focus inline-flex min-h-8 items-center text-fg-muted hover:text-fg"
                  >{{ link.label }}</a
                >
              </li>
            }
          </ul>
        </nav>
        <nav aria-label="Project">
          <h2 class="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">Project</h2>
          <ul class="mt-4 space-y-1 text-sm">
            <li>
              <a
                [href]="github"
                rel="noopener"
                class="site-focus inline-flex min-h-8 items-center text-fg-muted hover:text-fg"
                >GitHub</a
              >
            </li>
            <li>
              <a
                [href]="github + '/issues'"
                rel="noopener"
                class="site-focus inline-flex min-h-8 items-center text-fg-muted hover:text-fg"
                >Issues</a
              >
            </li>
            <li>
              <a
                [href]="github + '/blob/main/LICENSE'"
                rel="noopener"
                class="site-focus inline-flex min-h-8 items-center text-fg-muted hover:text-fg"
                >MIT License</a
              >
            </li>
          </ul>
        </nav>
        <nav aria-label="Packages">
          <h2 class="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">npm</h2>
          <ul class="mt-4 space-y-1 text-sm">
            <li>
              <a
                [href]="npmCore"
                rel="noopener"
                class="site-focus inline-flex min-h-8 items-center font-mono text-xs text-fg-muted hover:text-fg"
                >&#64;quartz-headless/core</a
              >
            </li>
            <li>
              <a
                [href]="npmPrimitives"
                rel="noopener"
                class="site-focus inline-flex min-h-8 items-center font-mono text-xs text-fg-muted hover:text-fg"
                >&#64;quartz-headless/primitives</a
              >
            </li>
            <li class="pt-1 text-xs text-fg-subtle">Latest on npm: {{ npmVersion }}</li>
          </ul>
        </nav>
      </div>
      <p class="mx-auto mt-12 max-w-6xl text-xs text-fg-subtle">
        © {{ year }} Andersseen. Released under the MIT License.
      </p>
    </footer>
  `,
})
export class HomeFooterComponent {
  protected readonly year = new Date().getFullYear();
  protected readonly github = GITHUB_URL;
  protected readonly npmCore = NPM_CORE_URL;
  protected readonly npmPrimitives = NPM_PRIMITIVES_URL;
  protected readonly npmVersion = LATEST_NPM_VERSION;
  protected readonly docs = [
    { label: 'Installation', path: '/docs/getting-started/installation' },
    { label: 'Quick start', path: '/docs/getting-started/quick-start' },
    { label: 'Component catalogue', path: '/components' },
    { label: 'All documentation', path: '/docs' },
  ];
}
