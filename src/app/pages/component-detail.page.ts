import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  computed,
  effect,
  inject,
  type Type,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { DoqPlaygroundComponent } from '@doqs/analog';
import { map } from 'rxjs';
import { HeaderComponent } from '../components/header/header.component';
import { SkipLinkComponent } from '../components/skip-link/skip-link.component';
import { DOC_DEMOS } from '../docs-demos/registry';
import { DOC_PLAYGROUNDS } from '../docs-playgrounds/registry';
import {
  CATALOGUE,
  CATEGORIES,
  apiPath,
  componentPath,
  findBySlug,
  type CatalogueEntry,
} from '../site/catalogue';
import { PageSeoService } from '../site/page-seo';
import { demoTitle, SHOWCASE } from '../site/showcase';
import { HomeFooterComponent } from './home/components/footer/footer.component';

const DEMOS = DOC_DEMOS as Readonly<Record<string, Type<unknown>>>;

/** Sidebar order; previous/next follow it too. */
const GROUPS = CATEGORIES.map((category) => ({
  ...category,
  entries: CATALOGUE.filter((entry) => entry.category === category.id),
}));
const ORDERED = GROUPS.flatMap((group) => group.entries);

/**
 * One page per component: see it and try it. The playground and the examples are the same Doqs
 * playground and demo components the documentation uses, rendered here without the docs around
 * them. The documentation keeps the contract (API, keyboard, accessibility); this page links to it.
 */
@Component({
  selector: 'app-component-detail',
  imports: [
    HeaderComponent,
    SkipLinkComponent,
    HomeFooterComponent,
    RouterLink,
    RouterLinkActive,
    NgComponentOutlet,
    DoqPlaygroundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-skip-link />
    <app-header />

    <div
      class="mx-auto grid max-w-7xl gap-10 px-4 pt-28 pb-20 sm:px-6 md:pt-32 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8"
    >
      <!-- Desktop: sticky list of every component. -->
      <nav class="components-nav max-lg:hidden" aria-label="Components">
        @for (group of groups; track group.id) {
          <p class="components-nav-heading">{{ group.label }}</p>
          <ul>
            @for (item of group.entries; track item.path) {
              <li>
                <a
                  [routerLink]="link(item)"
                  routerLinkActive="is-active"
                  ariaCurrentWhenActive="page"
                  class="components-nav-link site-focus"
                  >{{ item.name }}</a
                >
              </li>
            }
          </ul>
        }
      </nav>

      @if (entry(); as current) {
        <main id="main-content" tabindex="-1" class="min-w-0 outline-none">
          <!-- Mobile: the same list, behind a native disclosure. -->
          <details class="components-nav-mobile lg:hidden">
            <summary class="site-focus">All components</summary>
            <nav aria-label="Components (mobile)" class="mt-3 grid grid-cols-2 gap-1">
              @for (item of ordered; track item.path) {
                <a
                  [routerLink]="link(item)"
                  routerLinkActive="is-active"
                  ariaCurrentWhenActive="page"
                  class="components-nav-link site-focus"
                  >{{ item.name }}</a
                >
              }
            </nav>
          </details>

          <nav aria-label="Breadcrumb" class="text-sm text-fg-subtle">
            <ol class="flex flex-wrap items-center gap-2">
              <li><a routerLink="/components" class="site-focus hover:text-fg">Components</a></li>
              <li aria-hidden="true">/</li>
              <li>{{ categoryLabel() }}</li>
            </ol>
          </nav>

          <header class="mt-5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="qz-badge" [attr.data-layer]="current.layer">{{
                current.layer === 'core' ? 'Core' : 'Primitives'
              }}</span>
              @if (current.kind === 'alias') {
                <span class="qz-badge" data-kind>Alias</span>
              } @else if (current.kind === 'composition') {
                <span class="qz-badge" data-kind>Recipe</span>
              }
            </div>
            <h1
              class="mt-4 text-[clamp(2.25rem,6vw,3.75rem)] leading-[1] font-bold tracking-[-0.04em] text-fg"
            >
              {{ current.name }}
            </h1>
            <p
              class="mt-5 max-w-2xl text-base leading-7 text-pretty text-fg-muted sm:text-lg sm:leading-8"
            >
              {{ current.description }}
            </p>
            @if (current.note) {
              <p class="mt-3 max-w-2xl text-sm leading-6 text-fg-subtle">{{ current.note }}</p>
            }
            <div class="mt-7 flex flex-wrap gap-3">
              <a [routerLink]="current.path" class="site-focus btn-secondary">Documentation</a>
              @if (api(); as route) {
                <a [routerLink]="route" class="site-focus btn-secondary">API reference</a>
              }
            </div>
          </header>

          @for (shown of [current]; track shown.path) {
            @if (showcase(); as content) {
              @if (playgroundId(); as id) {
                <section class="mt-14" aria-labelledby="playground-title">
                  <h2 id="playground-title" class="component-section-title">Playground</h2>
                  <p class="mt-2 text-sm text-fg-muted">
                    Change the inputs, watch the outputs and copy the usage code.
                  </p>
                  <div class="doq-root qz-doq-embed mt-5">
                    <doq-playground
                      [uid]="slug() + '-playground'"
                      [playgroundId]="id"
                      [definition]="playgroundDefinition(id)"
                    />
                  </div>
                </section>
              }

              <section class="mt-14" aria-labelledby="examples-title">
                <h2 id="examples-title" class="component-section-title">
                  {{ content.demos.length === 1 ? 'Example' : 'Examples' }}
                </h2>
                <div class="mt-5 grid gap-6">
                  @for (demo of content.demos; track demo) {
                    <figure class="component-example">
                      <figcaption class="component-example-caption">
                        {{ demoTitle(demo, shown.name) }}
                      </figcaption>
                      <div class="component-example-stage">
                        <ng-container [ngComponentOutlet]="demoComponent(demo)" />
                      </div>
                    </figure>
                  }
                </div>
              </section>
            } @else {
              <section class="mt-14 feature-card p-6" aria-labelledby="no-demo-title">
                <h2 id="no-demo-title" class="text-lg font-semibold text-fg">
                  Infrastructure, not interface
                </h2>
                <p class="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
                  {{ current.name }} has no visual output of its own: it is the behaviour other
                  primitives are built on. The documentation shows how to use it in a widget of your
                  own.
                </p>
                <a [routerLink]="current.path" class="site-focus link-arrow mt-2"
                  >Read the {{ current.name }} documentation</a
                >
              </section>
            }
          }

          <section class="mt-14" aria-labelledby="install-title">
            <h2 id="install-title" class="component-section-title">Install</h2>
            <div class="showcase-frame mt-5">
              <pre
                class="code-scroll site-focus m-0 p-5 font-mono text-[0.8125rem] leading-6 text-fg"
                tabindex="0"
                aria-label="Install and import"
              ><code><span class="select-none text-accent" aria-hidden="true">$ </span>{{ installCommand() }}@if (importLine(); as line) {

<span class="text-fg-subtle">// {{ current.kind === 'alias' ? 'backed by' : 'exports' }}</span>
{{ line }}}</code></pre>
            </div>
            <p class="mt-3 text-sm text-fg-subtle">
              Prefer owning the source?
              <a
                routerLink="/docs/guides/cli"
                class="site-focus text-fg underline underline-offset-4"
                >Copy it with the CLI</a
              >.
            </p>
          </section>

          <nav class="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Previous and next component">
            @if (previous(); as item) {
              <a [routerLink]="link(item)" class="pager site-focus">
                <span class="text-xs text-fg-subtle">Previous</span>
                <span class="font-semibold text-fg">← {{ item.name }}</span>
              </a>
            } @else {
              <span></span>
            }
            @if (next(); as item) {
              <a [routerLink]="link(item)" class="pager site-focus sm:text-right">
                <span class="text-xs text-fg-subtle">Next</span>
                <span class="font-semibold text-fg">{{ item.name }} →</span>
              </a>
            }
          </nav>
        </main>
      } @else {
        <main id="main-content" tabindex="-1" class="min-w-0 outline-none">
          <h1 class="text-3xl font-bold text-fg">Component not found</h1>
          <p class="mt-3 text-fg-muted">
            <a routerLink="/components" class="site-focus text-fg underline underline-offset-4"
              >Browse all components</a
            >.
          </p>
        </main>
      }
    </div>

    <app-home-footer />
  `,
})
export default class ComponentDetailPage {
  private readonly document = inject(DOCUMENT);

  protected readonly groups = GROUPS;
  protected readonly ordered = ORDERED;
  protected readonly link = componentPath;
  protected readonly demoTitle = demoTitle;

  protected readonly slug = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );
  protected readonly entry = computed(() => findBySlug(this.slug()));
  protected readonly showcase = computed(() => SHOWCASE[this.slug()]);
  protected readonly playgroundId = computed(() => this.showcase()?.playground ?? null);
  protected readonly api = computed(() => {
    const entry = this.entry();
    return entry ? apiPath(entry) : null;
  });
  protected readonly categoryLabel = computed(
    () => CATEGORIES.find((category) => category.id === this.entry()?.category)?.label ?? '',
  );

  private readonly index = computed(() => ORDERED.findIndex((item) => item === this.entry()));
  protected readonly previous = computed(() => ORDERED[this.index() - 1] ?? null);
  protected readonly next = computed(() =>
    this.index() >= 0 ? (ORDERED[this.index() + 1] ?? null) : null,
  );

  /** Primitives need Core beside them; Core-layer entries (and the Core-backed alias) need Core only. */
  protected readonly installCommand = computed(() =>
    this.packageOf(this.entry()) === '@quartz-headless/core'
      ? 'npm install @quartz-headless/core'
      : 'npm install @quartz-headless/core @quartz-headless/primitives',
  );
  protected readonly importLine = computed(() => {
    const entry = this.entry();
    const source = entry?.kind === 'alias' ? this.backing(entry) : entry;
    if (!source || source.exports.length === 0) return null;
    return `import { ${source.exports.join(', ')} } from '${this.packageOf(source)}';`;
  });

  constructor() {
    const seo = inject(PageSeoService);
    const destroyRef = inject(DestroyRef);
    let release: (() => void) | null = null;
    let first = true;
    effect(() => {
      const entry = this.entry();
      if (!entry) return;
      release?.();
      release = seo.apply({
        title: `${entry.name} · Components · Quartz Headless`,
        description: entry.description,
        path: componentPath(entry),
      });
      // Moving between components keeps this page instance: start each one at the top.
      if (!first) this.document.defaultView?.scrollTo?.({ top: 0 });
      first = false;
    });
    destroyRef.onDestroy(() => release?.());
  }

  protected playgroundDefinition(id: string) {
    return DOC_PLAYGROUNDS[id]!;
  }

  protected demoComponent(id: string): Type<unknown> | null {
    return DEMOS[id] ?? null;
  }

  private backing(entry: CatalogueEntry): CatalogueEntry | undefined {
    return CATALOGUE.find((candidate) => candidate.path === entry.backedBy);
  }

  private packageOf(entry: CatalogueEntry | undefined): string {
    if (!entry) return '@quartz-headless/primitives';
    const source = entry.kind === 'alias' ? (this.backing(entry) ?? entry) : entry;
    return source.layer === 'core' ? '@quartz-headless/core' : '@quartz-headless/primitives';
  }
}
