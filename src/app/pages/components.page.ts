import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { SkipLinkComponent } from '../components/skip-link/skip-link.component';
import {
  CATALOGUE,
  CATEGORIES,
  apiPath,
  catalogueCounts,
  filterCatalogue,
  type CatalogueLayer,
  type CategoryId,
} from '../site/catalogue';
import { PageSeoService } from '../site/page-seo';
import { HomeFooterComponent } from './home/components/footer/footer.component';

type CategoryFilter = CategoryId | 'all';
type LayerFilter = CatalogueLayer | 'all';

const LAYERS: { id: LayerFilter; label: string }[] = [
  { id: 'all', label: 'Both packages' },
  { id: 'core', label: 'Core' },
  { id: 'primitives', label: 'Primitives' },
];

@Component({
  selector: 'app-components-catalog',
  imports: [HeaderComponent, SkipLinkComponent, HomeFooterComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-skip-link />
    <app-header />

    <main
      id="main-content"
      tabindex="-1"
      class="min-h-screen px-4 pt-28 pb-20 outline-none sm:px-8 md:px-10 md:pt-36"
    >
      <div class="mx-auto max-w-6xl">
        <header class="max-w-3xl">
          <p class="text-xs font-semibold tracking-[0.16em] text-brand uppercase">Catalogue</p>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight text-fg md:text-6xl">
            Find the behaviour you need.
          </h1>
          <p class="mt-5 text-base leading-7 text-fg-muted sm:text-lg sm:leading-8">
            {{ counts.coreApis }} Core APIs and {{ counts.primitiveFamilies }} primitive families,
            each linked to its documentation, live demo and API reference. Entries marked
            <strong class="font-semibold text-fg">Alias</strong> or
            <strong class="font-semibold text-fg">Recipe</strong> are documented patterns, not
            separate exports.
          </p>
        </header>

        <div class="mt-10" role="search" aria-label="Catalogue">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div class="flex-1">
              <label for="catalogue-search" class="text-sm font-medium text-fg">
                Search the catalogue
              </label>
              <div class="relative mt-2">
                <input
                  #searchInput
                  id="catalogue-search"
                  type="search"
                  autocomplete="off"
                  spellcheck="false"
                  placeholder="Try “dropdown”, “focus trap” or “calendar”"
                  [value]="query()"
                  (input)="query.set(searchInput.value)"
                  class="site-focus min-h-12 w-full rounded-lg border border-line-strong bg-surface-1 px-4 pr-24 text-base text-fg placeholder:text-fg-subtle"
                />
                @if (query()) {
                  <button
                    type="button"
                    (click)="clearSearch()"
                    class="site-focus absolute inset-y-1.5 right-1.5 rounded-md px-3 text-sm font-medium text-fg-muted hover:text-fg"
                  >
                    Clear
                  </button>
                }
              </div>
            </div>

            <div role="group" aria-label="Package" class="flex flex-wrap gap-2">
              @for (item of layers; track item.id) {
                <button
                  type="button"
                  (click)="layer.set(item.id)"
                  [attr.aria-pressed]="layer() === item.id"
                  class="site-focus min-h-11 rounded-lg border px-4 text-sm font-medium transition-colors aria-pressed:border-brand aria-pressed:bg-brand/15 aria-pressed:text-fg border-line text-fg-muted hover:text-fg"
                >
                  {{ item.label }}
                </button>
              }
            </div>
          </div>

          <div role="group" aria-label="Category" class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              (click)="category.set('all')"
              [attr.aria-pressed]="category() === 'all'"
              class="site-focus min-h-11 rounded-full border px-4 text-sm font-medium transition-colors aria-pressed:border-signal aria-pressed:bg-signal/15 aria-pressed:text-fg border-line text-fg-muted hover:text-fg"
            >
              All categories
            </button>
            @for (item of categories; track item.id) {
              <button
                type="button"
                (click)="category.set(item.id)"
                [attr.aria-pressed]="category() === item.id"
                class="site-focus min-h-11 rounded-full border px-4 text-sm font-medium transition-colors aria-pressed:border-signal aria-pressed:bg-signal/15 aria-pressed:text-fg border-line text-fg-muted hover:text-fg"
              >
                {{ item.label }}
              </button>
            }
          </div>
        </div>

        <p
          class="mt-6 text-sm text-fg-muted"
          role="status"
          aria-live="polite"
          data-testid="catalogue-count"
        >
          {{ resultSummary() }}
        </p>

        @if (results().length === 0) {
          <div
            class="mt-6 rounded-2xl border border-dashed border-line-strong p-8 text-center"
            data-testid="catalogue-empty"
          >
            <h2 class="text-lg font-semibold text-fg">Nothing matches that search.</h2>
            <p class="mt-2 text-sm text-fg-muted">
              Try a broader word such as “list”, “menu” or “input”, or reset the filters.
            </p>
            <button
              type="button"
              (click)="resetFilters()"
              class="site-focus mt-5 min-h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-surface-0"
            >
              Show everything
            </button>
          </div>
        } @else {
          <div class="mt-4 space-y-12">
            @for (group of groups(); track group.id) {
              <section [attr.aria-labelledby]="'cat-' + group.id" [attr.data-category]="group.id">
                <div class="mb-4 border-b border-line pb-3">
                  <h2 [id]="'cat-' + group.id" class="text-xl font-bold text-fg">
                    {{ group.label }}
                    <span class="ml-1 font-mono text-sm font-normal text-fg-subtle">{{
                      group.entries.length
                    }}</span>
                  </h2>
                  <p class="mt-1 text-sm text-fg-subtle">{{ group.summary }}</p>
                </div>
                <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  @for (entry of group.entries; track entry.path) {
                    <li
                      class="group relative min-w-0 rounded-xl border border-line bg-surface-1 p-4 transition-colors focus-within:border-line-strong hover:border-line-strong"
                      [attr.data-entry]="entry.path"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <h3 class="text-base font-semibold text-fg">
                          <a
                            [routerLink]="entry.path"
                            class="site-focus rounded after:absolute after:inset-0 after:content-['']"
                            >{{ entry.name }}</a
                          >
                        </h3>
                        <span class="flex shrink-0 gap-1.5">
                          @if (entry.kind === 'alias') {
                            <span
                              class="rounded border border-accent/40 px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-accent uppercase"
                              >Alias</span
                            >
                          } @else if (entry.kind === 'composition') {
                            <span
                              class="rounded border border-accent/40 px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide text-accent uppercase"
                              >Recipe</span
                            >
                          }
                          <span
                            class="rounded border px-1.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide uppercase"
                            [class]="
                              entry.layer === 'core'
                                ? 'border-signal/40 text-signal'
                                : 'border-brand/40 text-brand'
                            "
                            >{{ entry.layer === 'core' ? 'Core' : 'Primitives' }}</span
                          >
                        </span>
                      </div>
                      <p class="mt-2 text-sm leading-6 text-fg-muted">{{ entry.description }}</p>
                      @if (entry.note) {
                        <p class="mt-2 text-xs leading-5 text-fg-subtle">{{ entry.note }}</p>
                      }
                      <div class="mt-3 flex items-center justify-between gap-3">
                        <p
                          class="min-w-0 truncate font-mono text-xs text-fg-subtle"
                          [title]="entry.exports.join(', ')"
                        >
                          {{ entry.exports.join(' · ') }}
                        </p>
                        @if (api(entry); as route) {
                          <a
                            [routerLink]="route"
                            class="site-focus relative z-10 inline-flex min-h-8 shrink-0 items-center text-xs font-medium text-fg underline underline-offset-4"
                            [attr.aria-label]="entry.name + ' API reference'"
                            >API</a
                          >
                        }
                      </div>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        }

        <p class="mt-14 text-sm text-fg-subtle">
          Looking for guides, migration notes or the generated API reference?
          <a routerLink="/docs" class="site-focus text-fg underline underline-offset-4"
            >Open the documentation</a
          >.
        </p>
      </div>
    </main>

    <app-home-footer />
  `,
})
export default class ComponentsCatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly counts = catalogueCounts();
  protected readonly categories = CATEGORIES;
  protected readonly layers = LAYERS;

  protected readonly query = signal('');
  protected readonly category = signal<CategoryFilter>('all');
  protected readonly layer = signal<LayerFilter>('all');

  protected readonly results = computed(() =>
    filterCatalogue({ text: this.query(), category: this.category(), layer: this.layer() }),
  );

  protected readonly groups = computed(() =>
    CATEGORIES.map((category) => ({
      ...category,
      entries: this.results().filter((entry) => entry.category === category.id),
    })).filter((group) => group.entries.length > 0),
  );

  protected readonly resultSummary = computed(() => {
    const shown = this.results().length;
    const total = CATALOGUE.length;
    return shown === total
      ? `Showing all ${total} documented capabilities.`
      : `Showing ${shown} of ${total} documented capabilities.`;
  });

  /** Filters mirror into the URL (shareable) only after the initial state was read from it. */
  private readonly urlSynced = signal(false);

  constructor() {
    inject(PageSeoService).claim(inject(DestroyRef), {
      title: 'Component catalogue · Quartz Headless',
      description:
        'Search every Quartz Headless Core API and primitive: overlays, dialogs, menus, selects, forms, navigation, date pickers and feedback. Each entry links to docs, live demos and the API reference.',
      path: '/components',
    });

    // Read `?q=&category=&layer=` after hydration: the prerendered HTML always shows the full
    // catalogue, and changing it during hydration would mismatch the server markup.
    afterNextRender(() => {
      const params = this.route.snapshot.queryParamMap;
      this.query.set(params.get('q') ?? '');
      const category = params.get('category');
      if (CATEGORIES.some((item) => item.id === category)) {
        this.category.set(category as CategoryId);
      }
      const layer = params.get('layer');
      if (layer === 'core' || layer === 'primitives') this.layer.set(layer);
      this.urlSynced.set(true);
    });

    effect(() => {
      const queryParams = {
        q: this.query().trim() || null,
        category: this.category() === 'all' ? null : this.category(),
        layer: this.layer() === 'all' ? null : this.layer(),
      };
      if (!this.urlSynced()) return;
      void this.router.navigate([], {
        queryParams,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  protected readonly api = apiPath;

  protected clearSearch(): void {
    this.query.set('');
    this.search()?.nativeElement.focus();
  }

  protected resetFilters(): void {
    this.query.set('');
    this.category.set('all');
    this.layer.set('all');
    this.search()?.nativeElement.focus();
  }
}
