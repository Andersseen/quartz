import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-home-dx',
  imports: [RouterLink, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="dx-title"
      class="border-t border-line bg-surface-1/50 px-4 py-20 sm:px-6 md:px-10 md:py-24"
    >
      <div class="mx-auto max-w-6xl">
        <div [move]="'fade-up'" class="max-w-2xl">
          <p class="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
            Developer experience
          </p>
          <h2 id="dx-title" class="mt-3 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            Built for the Angular you write today.
          </h2>
        </div>
        <dl moveStagger [moveStaggerStep]="70" class="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-2">
          @for (item of items; track item.title) {
            <div [move]="'fade-up'" class="border-l border-brand/40 pl-5">
              <dt class="text-base font-semibold text-fg">{{ item.title }}</dt>
              <dd class="mt-2 text-sm leading-6 text-fg-muted">
                {{ item.text }}
                <a
                  [routerLink]="item.path"
                  class="site-focus ml-1 whitespace-nowrap text-brand underline underline-offset-4"
                  >{{ item.link }}</a
                >
              </dd>
            </div>
          }
        </dl>
      </div>
    </section>
  `,
})
export class HomeDxComponent {
  protected readonly items = [
    {
      title: 'A typed public API',
      text: 'Every export, selector, input and output is listed in a generated reference, and a guard fails CI when the surface changes unexpectedly.',
      link: 'Example: SliderDirective',
      path: '/docs/reference/api/primitives/slider-directive',
    },
    {
      title: 'Signals and controlled state',
      text: 'State is model() and signal() all the way down. Bind it two-way or control it yourself; user commits are separate outputs.',
      link: 'Signals guide',
      path: '/docs/guides/signals-and-controlled-state',
    },
    {
      title: 'Angular Forms, opt-in',
      text: 'Adapters live in a secondary entry point, so the main entry never imports @angular/forms.',
      link: 'Forms adapters',
      path: '/docs/guides/angular-forms',
    },
    {
      title: 'SSR and hydration',
      text: 'No DOM side effects at import time, deterministic ids per request, and an SSR/hydration test suite against packed tarballs.',
      link: 'SSR and lifecycle',
      path: '/docs/guides/ssr-and-lifecycle',
    },
    {
      title: 'Copy the source instead',
      text: 'The CLI copies raw TypeScript for a primitive into your repo when you would rather own and edit it.',
      link: 'CLI guide',
      path: '/docs/guides/cli',
    },
    {
      title: 'Verified compatibility',
      text: 'Tested as installed packages in AOT-compiled apps on Angular 21.2 (minimum and current) and 22.',
      link: 'Compatibility',
      path: '/docs/guides/compatibility',
    },
  ];
}
