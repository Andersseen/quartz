import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { catalogueCounts } from '../../../../site/catalogue';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

/** Core vs Primitives, drawn as the layer stack they form inside an application. */
@Component({
  selector: 'app-home-packages',
  imports: [RouterLink, SectionHeadingComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="packages-title" class="section-shell">
      <div class="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <app-section-heading headingId="packages-title" eyebrow="Architecture" tone="accent">
            <ng-container heading>Core is the engine. Primitives are the patterns.</ng-container>
            Build your own widget on Core, or take a finished accessible pattern from Primitives.
            Primitives depends on Core as a peer dependency; Core never depends on Primitives.
          </app-section-heading>

          <dl
            class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line"
          >
            <div class="bg-surface-0 p-5">
              <dt class="text-xs text-fg-subtle">&#64;quartz-headless/core</dt>
              <dd class="mt-2">
                <span class="stat-number text-signal">{{ counts.coreApis }}</span
                >&nbsp;<span class="text-sm text-fg-muted">Core APIs</span>
              </dd>
            </div>
            <div class="bg-surface-0 p-5">
              <dt class="text-xs text-fg-subtle">&#64;quartz-headless/primitives</dt>
              <dd class="mt-2">
                <span class="stat-number text-brand">{{ counts.primitiveFamilies }}</span
                >&nbsp;<span class="text-sm text-fg-muted">primitive families</span>
              </dd>
            </div>
          </dl>
          <p class="mt-4 text-sm leading-6 text-fg-subtle">
            Also documented: {{ counts.aliases }} alias backed by Core and
            {{ counts.compositions }} native-HTML recipe, labelled as such in the catalogue. Not
            sure which to install?
            <a
              routerLink="/docs/guides/core-vs-primitives"
              class="site-focus text-fg underline underline-offset-4"
              >Core versus Primitives</a
            >.
          </p>
        </div>

        <ol class="layer-stack" aria-label="How the layers fit together, top to bottom">
          <li [move]="'fade-up'" class="layer layer-yours">
            <p class="layer-kicker">Your code</p>
            <p class="layer-title">Your design system</p>
            <p class="layer-text">Markup, Tailwind, CSS, tokens, Volt UI. Every pixel.</p>
          </li>
          <li [move]="'fade-up'" [moveDelay]="80" class="layer layer-primitives">
            <p class="layer-kicker">&#64;quartz-headless/primitives</p>
            <p class="layer-title">Accessible patterns</p>
            <p class="layer-text">
              Dialog, Menu, Select, Combobox, Tabs, Slider, DatePicker, FormField, Toast…
            </p>
            <a
              routerLink="/components"
              [queryParams]="{ layer: 'primitives' }"
              class="site-focus layer-link text-brand"
              >Browse Primitives →</a
            >
          </li>
          <li [move]="'fade-up'" [moveDelay]="160" class="layer layer-core">
            <p class="layer-kicker">&#64;quartz-headless/core</p>
            <p class="layer-title">Interaction engine</p>
            <p class="layer-text">
              Overlay, dismiss, focus, collection, direction, viewport, scroll lock, drag and drop,
              virtual scroll, splitter.
            </p>
            <a
              routerLink="/components"
              [queryParams]="{ layer: 'core' }"
              class="site-focus layer-link text-signal"
              >Browse Core APIs →</a
            >
          </li>
          <li [move]="'fade-up'" [moveDelay]="240" class="layer layer-angular">
            <p class="layer-title">Angular 21.2+ and 22</p>
            <p class="layer-text">Signals, zoneless change detection, SSR and hydration.</p>
          </li>
        </ol>
      </div>
    </section>
  `,
})
export class HomePackagesComponent {
  protected readonly counts = catalogueCounts();
}
