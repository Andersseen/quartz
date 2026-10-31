import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { catalogueCounts } from '../../../../site/catalogue';

@Component({
  selector: 'app-home-packages',
  imports: [RouterLink, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="packages-title" class="px-4 py-20 sm:px-6 md:px-10 md:py-24">
      <div class="mx-auto max-w-6xl">
        <div [move]="'fade-up'" class="max-w-2xl">
          <p class="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Two packages</p>
          <h2
            id="packages-title"
            class="mt-3 text-3xl font-bold tracking-tight text-fg md:text-4xl"
          >
            Core is the engine. Primitives are the patterns.
          </h2>
          <p class="mt-5 text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
            Build your own widget on Core, or take a finished accessible pattern from Primitives.
            Primitives depends on Core as a peer dependency; Core never depends on Primitives.
          </p>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-2">
          <article
            [move]="'fade-up'"
            class="rounded-2xl border border-line bg-surface-1 p-6 sm:p-8"
            aria-labelledby="pkg-core"
          >
            <p class="font-mono text-xs text-signal">{{ counts.coreApis }} Core APIs</p>
            <h3 id="pkg-core" class="mt-2 font-mono text-lg font-semibold text-fg">
              &#64;quartz-headless/core
            </h3>
            <p class="mt-3 text-sm leading-6 text-fg-muted">
              Low-level interaction infrastructure, comparable to the Angular CDK: positioned
              overlays, dismissal, focus, keyboard collections, direction, viewport, scroll lock,
              drag and drop, virtual scroll and a splitter.
            </p>
            <p class="mt-4 text-sm leading-6 text-fg-subtle">
              Choose it when you are building a custom widget and want the hard parts.
            </p>
            <a
              routerLink="/components"
              [queryParams]="{ layer: 'core' }"
              class="site-focus mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-signal underline underline-offset-4"
              >Browse Core APIs →</a
            >
          </article>

          <article
            [move]="'fade-up'"
            [moveDelay]="100"
            class="rounded-2xl border border-line bg-surface-1 p-6 sm:p-8"
            aria-labelledby="pkg-primitives"
          >
            <p class="font-mono text-xs text-brand">
              {{ counts.primitiveFamilies }} primitive families
            </p>
            <h3 id="pkg-primitives" class="mt-2 font-mono text-lg font-semibold text-fg">
              &#64;quartz-headless/primitives
            </h3>
            <p class="mt-3 text-sm leading-6 text-fg-muted">
              Accessible UI patterns built on Core: dialogs, menus, selects, comboboxes, tabs,
              sliders, date pickers, form fields, navigation, toasts and more. Directives with no
              CSS; state is exposed as signals, ARIA and
              <code class="font-mono text-fg">data-qz-*</code> hooks.
            </p>
            <p class="mt-4 text-sm leading-6 text-fg-subtle">
              Also documented: {{ counts.aliases }} alias backed by Core and
              {{ counts.compositions }} native-HTML recipe, labelled as such in the catalogue.
            </p>
            <a
              routerLink="/components"
              [queryParams]="{ layer: 'primitives' }"
              class="site-focus mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-4"
              >Browse Primitives →</a
            >
          </article>
        </div>

        <p class="mt-6 text-sm text-fg-subtle">
          Not sure which to install?
          <a
            routerLink="/docs/guides/core-vs-primitives"
            class="site-focus text-fg underline underline-offset-4"
            >Core versus Primitives</a
          >
          explains the dependency direction and the import map.
        </p>
      </div>
    </section>
  `,
})
export class HomePackagesComponent {
  protected readonly counts = catalogueCounts();
}
