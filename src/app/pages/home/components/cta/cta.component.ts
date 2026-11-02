import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

/** Closing call to action. The backdrop echoes the hero: satin light over a wireframe grid. */
@Component({
  selector: 'app-home-cta',
  imports: [RouterLink, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="cta-title" class="px-4 pb-24 sm:px-6 md:px-10">
      <div [move]="'fade-up'" class="cta-band mx-auto max-w-6xl">
        <div class="relative z-10 mx-auto max-w-2xl text-center">
          <h2
            id="cta-title"
            class="text-[clamp(2.25rem,6vw,4rem)] leading-[1] font-black tracking-[-0.045em] text-fg"
          >
            Own every pixel.<br />
            <span class="hero-title-accent">Keep the behaviour.</span>
          </h2>
          <p class="mx-auto mt-6 max-w-lg text-base leading-7 text-fg-muted sm:text-lg">
            Start with one primitive in an existing app. Nothing to theme, nothing to override.
          </p>
          <div class="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a routerLink="/docs/getting-started/quick-start" class="site-focus btn-light"
              >Read the quick start →</a
            >
            <a routerLink="/components" class="site-focus btn-secondary">Explore all components</a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeCtaComponent {}
