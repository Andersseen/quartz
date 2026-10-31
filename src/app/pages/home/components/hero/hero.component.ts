import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { ANGULAR_SUPPORT, LATEST_NPM_VERSION } from '../../../../site/site-config';
import volumeDemoSource from '../../demos/volume-demo.component.ts?raw';
import { VolumeDemoComponent } from '../../demos/volume-demo.component';
import { DemoShowcaseComponent } from '../demo-showcase/demo-showcase.component';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, DemoShowcaseComponent, VolumeDemoComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="hero-title"
      class="relative z-10 px-4 pt-32 pb-16 sm:px-6 sm:pb-20 md:px-10 md:pt-40 lg:pb-28"
    >
      <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div class="text-center lg:text-left">
          <p
            [move]="'fade-up'"
            [moveDelay]="40"
            class="mx-auto mb-6 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-brand/25 bg-brand/10 px-3.5 py-1.5 text-xs font-medium text-brand lg:mx-0"
          >
            <span class="size-1.5 rounded-full bg-brand" aria-hidden="true"></span>
            <span>npm {{ npmVersion }}</span>
            <span class="text-fg-subtle" aria-hidden="true">·</span>
            <span>{{ angularSupport }}</span>
          </p>
          <h1
            id="hero-title"
            [move]="'fade-up'"
            [moveDelay]="100"
            class="mx-auto max-w-3xl text-[clamp(2.5rem,10.5vw,4rem)] leading-[1.02] font-black tracking-[-0.05em] text-fg sm:text-6xl md:text-7xl lg:mx-0 lg:text-7xl"
          >
            Behaviour for the
            <span
              class="bg-gradient-to-r from-brand via-signal to-accent bg-clip-text text-transparent"
              >interfaces you own.</span
            >
          </h1>
          <p
            [move]="'fade-up'"
            [moveDelay]="160"
            class="mx-auto mt-6 max-w-xl text-base leading-7 text-fg-muted sm:text-lg sm:leading-8 lg:mx-0"
          >
            Quartz is a set of unstyled, accessible Angular primitives: focus, keyboard, ARIA,
            overlays and state, shipped as two npm packages. You write the markup and the styles;
            Quartz owns the behaviour.
          </p>
          <div
            [move]="'fade-up'"
            [moveDelay]="220"
            class="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <a
              routerLink="/docs/getting-started/installation"
              class="site-focus inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-surface-0 transition-colors hover:bg-brand-deep"
              >Start building →</a
            >
            <a
              routerLink="/components"
              class="site-focus inline-flex min-h-11 items-center justify-center rounded-lg border border-line-strong px-5 text-sm font-semibold text-fg transition-colors hover:border-brand/60"
              >Browse the catalogue</a
            >
          </div>
          <ul
            [move]="'fade-up'"
            [moveDelay]="280"
            class="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium tracking-wide text-fg-subtle uppercase lg:justify-start"
            aria-label="Key properties"
          >
            <li>Signals-first</li>
            <li>Zoneless</li>
            <li>SSR-safe</li>
            <li>No CSS shipped</li>
          </ul>
        </div>

        <div [move]="'fade-up'" [moveDelay]="140" class="min-w-0">
          <app-demo-showcase
            label="Volume control"
            filename="volume-demo.component.ts"
            [code]="source"
          >
            <app-volume-demo />
          </app-demo-showcase>
          <p class="mt-3 text-sm leading-6 text-fg-subtle">
            Real Quartz <code class="font-mono text-fg-muted">Slider</code> and
            <code class="font-mono text-fg-muted">Switch</code>: drag, use the arrow keys, Home and
            End, or mute. State is a signal; the look is Tailwind classes in the file under Code.
          </p>
        </div>
      </div>
    </section>
  `,
})
export class HomeHeroComponent {
  protected readonly npmVersion = LATEST_NPM_VERSION;
  protected readonly angularSupport = ANGULAR_SUPPORT;
  protected readonly source = volumeDemoSource;
}
