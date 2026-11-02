import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { CATALOGUE, CATEGORIES, componentPath } from '../../../../site/catalogue';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

/**
 * Every documented Core API and primitive at a glance, grouped by category. A projection of the
 * catalogue, so it can never list something the docs do not have.
 */
@Component({
  selector: 'app-home-primitive-wall',
  imports: [RouterLink, SectionHeadingComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="wall-title" class="section-shell">
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <app-section-heading headingId="wall-title" eyebrow="The whole surface" tone="signal">
            <ng-container heading
              >{{ total }} building blocks. None of them has a look.</ng-container
            >
            Every documented Core API and primitive, grouped by what it is for. Each one is a page
            with a playground and live examples, one click from its documentation.
          </app-section-heading>
          <a routerLink="/components" class="site-focus link-arrow">Search the catalogue</a>
        </div>

        <div class="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
          @for (group of groups; track group.id) {
            <div
              [move]="'fade-up'"
              class="grid gap-4 bg-surface-0 p-5 transition-colors hover:bg-surface-1 sm:p-6 md:grid-cols-[13rem_1fr] md:gap-8"
            >
              <div>
                <h3 class="flex items-baseline gap-2 text-sm font-semibold text-fg">
                  {{ group.label }}
                  <span class="font-mono text-xs font-normal text-fg-subtle">{{
                    group.entries.length
                  }}</span>
                </h3>
                <p class="mt-1 text-xs leading-5 text-fg-subtle">{{ group.summary }}</p>
              </div>
              <ul class="flex flex-wrap content-start gap-2" [attr.aria-label]="group.label">
                @for (entry of group.entries; track entry.path) {
                  <li>
                    <a
                      [routerLink]="component(entry)"
                      class="chip site-focus gap-2"
                      [attr.data-layer]="entry.layer"
                    >
                      <span
                        class="size-1.5 rounded-full"
                        [class]="entry.layer === 'core' ? 'bg-signal' : 'bg-brand'"
                        aria-hidden="true"
                      ></span>
                      {{ entry.name }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>

        <p class="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-fg-subtle">
          <span class="inline-flex items-center gap-2"
            ><span class="size-1.5 rounded-full bg-signal" aria-hidden="true"></span>
            &#64;quartz-headless/core</span
          >
          <span class="inline-flex items-center gap-2"
            ><span class="size-1.5 rounded-full bg-brand" aria-hidden="true"></span>
            &#64;quartz-headless/primitives</span
          >
        </p>
      </div>
    </section>
  `,
})
export class HomePrimitiveWallComponent {
  protected readonly total = CATALOGUE.length;
  protected readonly component = componentPath;
  protected readonly groups = CATEGORIES.map((category) => ({
    ...category,
    entries: CATALOGUE.filter((entry) => entry.category === category.id),
  })).filter((group) => group.entries.length > 0);
}
