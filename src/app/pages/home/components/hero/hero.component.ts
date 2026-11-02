import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { ANGULAR_SUPPORT, LATEST_NPM_VERSION } from '../../../../site/site-config';
import { HeroPlasmaComponent } from './hero-plasma.component';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, HeroPlasmaComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="hero-title"
      class="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-24 sm:px-6 md:px-10"
    >
      <app-hero-plasma />
      <!-- Keeps the copy legible wherever the folds and the lens happen to be. -->
      <div class="hero-scrim pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>

      <div class="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <p
          [move]="'fade-up'"
          [moveDelay]="40"
          class="mb-7 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/15 bg-surface-0/60 px-3.5 py-1.5 text-xs font-medium text-fg-muted backdrop-blur-md"
        >
          <span class="size-1.5 rounded-full bg-brand" aria-hidden="true"></span>
          <span class="text-fg">npm {{ npmVersion }}</span>
          <span class="text-fg-subtle" aria-hidden="true">·</span>
          <span>{{ angularSupport }}</span>
        </p>
        <h1
          id="hero-title"
          [move]="'fade-up'"
          [moveDelay]="100"
          class="text-[clamp(2.75rem,11vw,6.25rem)] leading-[0.95] font-black tracking-[-0.055em] text-fg [text-shadow:0_2px_40px_rgb(0_0_0/0.6)]"
        >
          Behaviour for the
          <span class="hero-title-accent block">interfaces you own.</span>
        </h1>
        <p
          [move]="'fade-up'"
          [moveDelay]="160"
          class="mt-7 max-w-2xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8"
        >
          Quartz is a set of unstyled, accessible Angular primitives: focus, keyboard, ARIA,
          overlays and state, shipped as two npm packages. You write the markup and the styles;
          Quartz owns the behaviour.
        </p>
        <div
          [move]="'fade-up'"
          [moveDelay]="220"
          class="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
        >
          <a
            routerLink="/docs/getting-started/installation"
            class="site-focus inline-flex min-h-12 items-center justify-center rounded-full bg-fg px-6 text-sm font-semibold text-surface-0 shadow-[0_0_40px_rgb(52_211_153/0.25)] transition-[background-color,box-shadow] hover:bg-white hover:shadow-[0_0_60px_rgb(52_211_153/0.4)]"
            >Start building →</a
          >
          <a
            routerLink="/components"
            class="site-focus inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-surface-0/50 px-6 text-sm font-semibold text-fg backdrop-blur-md transition-colors hover:border-brand/60"
            >Browse the catalogue</a
          >
        </div>
        <ul
          [move]="'fade-up'"
          [moveDelay]="280"
          class="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-xs tracking-wide text-fg-subtle"
          aria-label="Key properties"
        >
          <li>signals-first</li>
          <li class="max-sm:hidden" aria-hidden="true">/</li>
          <li>zoneless</li>
          <li class="max-sm:hidden" aria-hidden="true">/</li>
          <li>SSR-safe</li>
          <li class="max-sm:hidden" aria-hidden="true">/</li>
          <li>0 bytes of CSS</li>
        </ul>
      </div>

      <p
        class="absolute inset-x-4 bottom-8 max-sm:hidden mx-auto max-w-md text-center font-mono text-[0.6875rem] tracking-wide text-fg-subtle"
      >
        <span class="text-brand" aria-hidden="true">◯</span> The lens shows what Quartz ships:
        structure, not skin.
      </p>
    </section>
  `,
})
export class HomeHeroComponent {
  protected readonly npmVersion = LATEST_NPM_VERSION;
  protected readonly angularSupport = ANGULAR_SUPPORT;
}
