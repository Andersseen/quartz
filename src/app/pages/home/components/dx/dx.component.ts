import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

type Visual = 'api' | 'signals' | 'forms' | 'ssr' | 'cli' | 'matrix';

/** Developer experience: each claim carries the concrete artefact that backs it. */
@Component({
  selector: 'app-home-dx',
  imports: [RouterLink, SectionHeadingComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="dx-title" class="section-shell section-band">
      <div class="mx-auto max-w-6xl">
        <app-section-heading headingId="dx-title" eyebrow="Developer experience" tone="brand">
          <ng-container heading>Built for the Angular you write today.</ng-container>
          Signals in, signals out. No zone.js, no NgModules, no CSS to override, and every claim
          below links to the page that proves it.
        </app-section-heading>

        <ul
          moveStagger
          [moveStaggerStep]="60"
          class="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          @for (item of items; track item.title) {
            <li [move]="'fade-up'" class="feature-card flex flex-col">
              <div class="dx-visual" aria-hidden="true">
                @switch (item.visual) {
                  @case ('api') {
                    <div class="w-full space-y-1.5 font-mono text-[0.6875rem]">
                      <p>
                        <span class="text-accent">input</span>&nbsp;<span class="text-fg">min</span
                        ><span class="text-fg-subtle">: number = 0</span>
                      </p>
                      <p>
                        <span class="text-accent">input</span>&nbsp;<span class="text-fg">step</span
                        ><span class="text-fg-subtle">: number = 1</span>
                      </p>
                      <p>
                        <span class="text-signal">model</span>&nbsp;<span class="text-fg"
                          >value</span
                        ><span class="text-fg-subtle">: number</span>
                      </p>
                      <p>
                        <span class="text-brand">output</span>
                        <span class="text-fg">valueChangeCommitted</span>
                      </p>
                    </div>
                  }
                  @case ('signals') {
                    <pre
                      class="m-0 font-mono text-[0.6875rem] leading-5 text-fg-muted"
                    ><span class="text-fg-subtle">&lt;div</span>&nbsp;<span class="text-signal">qzSlider</span>
     <span class="text-accent">[(value)]</span>=<span class="text-brand">"volume"</span>
     <span class="text-accent">[disabled]</span>=<span class="text-brand">"muted()"</span><span class="text-fg-subtle">&gt;</span></pre>
                  }
                  @case ('forms') {
                    <pre
                      class="m-0 font-mono text-[0.6875rem] leading-5 text-fg-muted"
                    ><span class="text-accent">import</span> {{ '{' }} SliderControlDirective {{ '}' }}
  <span class="text-accent">from</span>&nbsp;<span class="text-brand">'&#64;quartz-headless/primitives/forms'</span>;</pre>
                  }
                  @case ('ssr') {
                    <div class="flex w-full flex-col gap-1.5 font-mono text-[0.6875rem]">
                      <p class="flex justify-between">
                        <span class="text-fg-muted">prerender</span
                        ><span class="text-brand">✓ pass</span>
                      </p>
                      <p class="flex justify-between">
                        <span class="text-fg-muted">hydration</span
                        ><span class="text-brand">✓ no mismatch</span>
                      </p>
                      <p class="flex justify-between">
                        <span class="text-fg-muted">ids per request</span
                        ><span class="text-brand">✓ deterministic</span>
                      </p>
                    </div>
                  }
                  @case ('cli') {
                    <div class="w-full font-mono text-[0.6875rem] leading-5">
                      <p>
                        <span class="text-accent">$</span>&nbsp;<span class="text-fg"
                          >pnpm quartz add dialog</span
                        >
                      </p>
                      <p class="text-fg-subtle">→ dialog/ · 5 TypeScript files, yours to edit</p>
                      <p class="text-fg-subtle">→ peer: &#64;quartz-headless/core</p>
                    </div>
                  }
                  @case ('matrix') {
                    <div
                      class="grid w-full grid-cols-[auto_1fr_1fr_1fr] gap-x-3 gap-y-1.5 text-center font-mono text-[0.6875rem]"
                    >
                      <span></span><span class="text-fg-subtle">21.2 min</span
                      ><span class="text-fg-subtle">21.2</span
                      ><span class="text-fg-subtle">22</span>&nbsp;<span class="text-fg-muted"
                        >AOT</span
                      ><span class="text-brand">✓</span><span class="text-brand">✓</span
                      ><span class="text-brand">✓</span>&nbsp;<span class="text-fg-muted">SSR</span
                      ><span class="text-brand">✓</span><span class="text-brand">✓</span
                      ><span class="text-brand">✓</span>
                    </div>
                  }
                }
              </div>
              <div class="flex flex-1 flex-col p-6 pt-5">
                <h3 class="text-base font-semibold text-fg">{{ item.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-fg-muted">{{ item.text }}</p>
                <a [routerLink]="item.path" class="site-focus link-arrow mt-auto self-start pt-4">{{
                  item.link
                }}</a>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class HomeDxComponent {
  protected readonly items: {
    title: string;
    text: string;
    link: string;
    path: string;
    visual: Visual;
  }[] = [
    {
      title: 'A typed public API',
      text: 'Every export, selector, input and output is listed in a generated reference, and a guard fails CI when the surface changes unexpectedly.',
      link: 'Example: SliderDirective',
      path: '/docs/reference/api/primitives/slider-directive',
      visual: 'api',
    },
    {
      title: 'Signals and controlled state',
      text: 'State is model() and signal() all the way down. Bind it two-way or control it yourself; user commits are separate outputs.',
      link: 'Signals guide',
      path: '/docs/guides/signals-and-controlled-state',
      visual: 'signals',
    },
    {
      title: 'Angular Forms, opt-in',
      text: 'Adapters live in a secondary entry point, so the main entry never imports @angular/forms.',
      link: 'Forms adapters',
      path: '/docs/guides/angular-forms',
      visual: 'forms',
    },
    {
      title: 'SSR and hydration',
      text: 'No DOM side effects at import time, deterministic ids per request, and an SSR/hydration test suite against packed tarballs.',
      link: 'SSR and lifecycle',
      path: '/docs/guides/ssr-and-lifecycle',
      visual: 'ssr',
    },
    {
      title: 'Copy the source instead',
      text: 'The CLI copies raw TypeScript for a primitive into your repo when you would rather own and edit it.',
      link: 'CLI guide',
      path: '/docs/guides/cli',
      visual: 'cli',
    },
    {
      title: 'Verified compatibility',
      text: 'Tested as installed packages in AOT-compiled apps on Angular 21.2 (minimum and current) and 22.',
      link: 'Compatibility',
      path: '/docs/guides/compatibility',
      visual: 'matrix',
    },
  ];
}
