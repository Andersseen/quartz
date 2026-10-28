import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ComboboxContentDirective,
  ComboboxDirective,
  ComboboxInputDirective,
  ComboboxListboxDirective,
  ComboboxOptionDirective,
  DialogService,
  ListboxDirective,
  ListboxGroupDirective,
  ListboxGroupLabelDirective,
  ListboxOptionDirective,
  ListboxSeparatorDirective,
  SelectContentDirective,
  SelectDirective,
  SelectGroupDirective,
  SelectGroupLabelDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectSeparatorDirective,
  SelectTriggerDirective,
  createLatestRequest,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

interface Tag {
  id: number;
  name: string;
}

/**
 * Browser-contract fixture for the Quartz 0.10 advanced selection: multiple Select, grouped Select
 * and Listbox, Combobox (local, asynchronous, IME, multiple) and their Angular Forms adapters.
 * Not documentation: Playwright drives it to assert committed values, focus and ARIA. `?dir=rtl`
 * renders it right-to-left. Intentionally unstyled.
 */
@Component({
  selector: 'app-e2e-selection',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    JsonPipe,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    SelectGroupDirective,
    SelectGroupLabelDirective,
    SelectSeparatorDirective,
    ListboxDirective,
    ListboxOptionDirective,
    ListboxGroupDirective,
    ListboxGroupLabelDirective,
    ListboxSeparatorDirective,
    ComboboxDirective,
    ComboboxInputDirective,
    ComboboxContentDirective,
    ComboboxListboxDirective,
    ComboboxOptionDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Behaviour fixture: rendered on the client only (it queries ViewContainerRefs on elements).
  host: { ngSkipHydration: 'true' },
  template: `
    <main id="app" [attr.data-ready]="ready() ? '' : null" style="padding: 24px" [attr.dir]="dir">
      <h1>Advanced selection</h1>
      <form id="form" [formGroup]="form" novalidate>
        <div
          qzSelect
          multiple
          formControlName="tags"
          #tagsSel="qzSelect"
          [compareWith]="sameTag"
          [displayWith]="tagName"
        >
          <span id="tags-label">Tags</span>
          <button id="tags" type="button" qzSelectTrigger aria-labelledby="tags-label tags">
            {{ tagsSel.selectedLabel() || 'Pick tags' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox style="background: white; color: black">
              <div qzSelectGroup>
                <div qzSelectGroupLabel>Frontend</div>
                @for (tag of frontend; track tag.id) {
                  <button
                    type="button"
                    [qzSelectOption]="tag"
                    [qzSelectOptionDisabled]="tag.id === 2"
                  >
                    {{ tag.name }}
                  </button>
                }
              </div>
              <div qzSelectSeparator></div>
              <div qzSelectGroup>
                <div qzSelectGroupLabel>Backend</div>
                @for (tag of backend; track tag.id) {
                  <button type="button" [qzSelectOption]="tag">{{ tag.name }}</button>
                }
              </div>
            </div>
          </ng-template>
        </div>

        <div
          id="sections"
          qzListbox
          [multiple]="true"
          formControlName="sections"
          aria-label="Sections"
        >
          <div qzListboxGroup>
            <div qzListboxGroupLabel>Fruit</div>
            <div qzListboxOption="apple">Apple</div>
            <div qzListboxOption="pear" qzListboxOptionDisabled>Pear</div>
          </div>
          <div qzListboxSeparator></div>
          <div qzListboxGroup>
            <div qzListboxGroupLabel>Veg</div>
            <div qzListboxOption="carrot">Carrot</div>
          </div>
        </div>

        <div
          qzCombobox
          formControlName="city"
          #cityCb="qzCombobox"
          [options]="cities"
          [allowDeselect]="true"
        >
          <input id="city" aria-label="City" qzComboboxInput />
          <ng-template qzComboboxContent>
            <ul qzComboboxListbox aria-label="Cities" style="background: white; color: black">
              @for (c of cityCb.filteredOptions(); track c) {
                <li [qzComboboxOption]="c">{{ c }}</li>
              }
              @if (cityCb.status() === 'empty') {
                <li id="city-empty">No results</li>
              }
            </ul>
          </ng-template>
        </div>

        <div
          qzCombobox
          formControlName="remote"
          #remoteCb="qzCombobox"
          [options]="remoteOptions()"
          [filter]="null"
          [loading]="remoteLoading()"
          (queryChanged)="search($event)"
        >
          <input id="remote" aria-label="Remote" qzComboboxInput />
          <ng-template qzComboboxContent>
            <ul
              qzComboboxListbox
              aria-label="Remote results"
              style="background: white; color: black"
            >
              @for (c of remoteCb.filteredOptions(); track c) {
                <li [qzComboboxOption]="c">{{ c }}</li>
              }
              @if (remoteCb.status() === 'loading') {
                <li id="remote-loading">Loading</li>
              }
            </ul>
          </ng-template>
        </div>

        <div qzCombobox multiple formControlName="langs" #langsCb="qzCombobox" [options]="langs">
          <input id="langs" aria-label="Languages" qzComboboxInput />
          <ng-template qzComboboxContent>
            <ul
              qzComboboxListbox
              aria-label="Language results"
              style="background: white; color: black"
            >
              @for (c of langsCb.filteredOptions(); track c) {
                <li [qzComboboxOption]="c">{{ c }}</li>
              }
            </ul>
          </ng-template>
        </div>

        <button id="reset" type="button" (click)="form.reset()">Reset</button>
        <button id="disable" type="button" (click)="toggleDisabled()">Toggle disabled</button>
        <button id="prefill" type="button" (click)="prefill()">Prefill</button>
        <button id="open-dialog" type="button" (click)="openDialog()">Open dialog</button>
      </form>

      <pre id="live-value">{{ form.getRawValue() | json }}</pre>
      <p id="dirty">{{ form.dirty ? 'dirty' : 'pristine' }}</p>
      <p id="changes">{{ changes() }}</p>
      <p id="remote-query">{{ lastQuery() }}</p>
      <p id="dialog-value">{{ dialogValue() }}</p>
      <a id="leave" routerLink="/">Leave</a>
    </main>

    <ng-template #dialogTpl let-ref let-labelledBy="ariaLabelledBy">
      <div id="dialog-content" style="background: white; padding: 16px">
        <h2 [id]="labelledBy">Pick tags</h2>
        <div qzSelect multiple [formControl]="dialogTags" #dsel="qzSelect">
          <span id="dialog-tags-label">Dialog tags</span>
          <button
            id="dialog-tags"
            type="button"
            qzSelectTrigger
            aria-labelledby="dialog-tags-label dialog-tags"
          >
            {{ dsel.selectedLabel() || 'Pick' }}
          </button>
          <ng-template qzSelectContent>
            <div qzSelectListbox style="background: white; color: black">
              <button type="button" qzSelectOption="one">One</button>
              <button type="button" qzSelectOption="two">Two</button>
            </div>
          </ng-template>
        </div>
        <button id="dialog-close" type="button" (click)="ref.close()">Close</button>
      </div>
    </ng-template>
  `,
})
export default class E2eSelectionPage {
  private readonly platformId = inject(PLATFORM_ID);
  readonly ready = signal(false);
  private readonly dialogs = inject(DialogService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly dialogTpl = viewChild.required<TemplateRef<unknown>>('dialogTpl');
  private readonly latest = createLatestRequest();

  readonly dir = inject(ActivatedRoute).snapshot.queryParamMap.get('dir') === 'rtl' ? 'rtl' : 'ltr';
  readonly frontend: Tag[] = [
    { id: 1, name: 'Angular' },
    { id: 2, name: 'React' },
    { id: 3, name: 'Svelte' },
  ];
  readonly backend: Tag[] = [{ id: 10, name: 'Node' }];
  readonly cities = ['Madrid', 'Paris', 'Prague'];
  readonly langs = ['English', 'Spanish', 'Czech'];
  readonly sameTag = (a: Tag, b: Tag) => a.id === b.id;
  readonly tagName = (t: Tag) => t.name;

  readonly form = new FormGroup({
    tags: new FormControl<Tag[] | null>(null),
    sections: new FormControl<string[] | null>(null),
    city: new FormControl<string | null>(null),
    remote: new FormControl<string | null>(null),
    langs: new FormControl<string[] | null>([]),
  });
  readonly dialogTags = new FormControl<string[] | null>([]);

  readonly changes = signal(0);
  readonly remoteOptions = signal<string[]>([]);
  readonly remoteLoading = signal(false);
  readonly lastQuery = signal('');
  readonly dialogValue = signal('none');

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) this.ready.set(true);
    });
    this.form.valueChanges.subscribe(() => this.changes.update((n) => n + 1));
    this.dialogTags.valueChanges.subscribe((v) => this.dialogValue.set(JSON.stringify(v)));
  }

  /** Asynchronous results: queries starting with "slow" resolve late, so they arrive stale. */
  async search(query: string): Promise<void> {
    this.lastQuery.set(query);
    this.remoteLoading.set(true);
    const result = await this.latest.run(async (signal) => {
      const delay = query.startsWith('slow') ? 600 : 50;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, delay);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
      return query ? [`${query}-1`, `${query}-2`] : [];
    });
    if (result === undefined) return; // superseded: a newer request owns the loading state
    this.remoteOptions.set(result);
    this.remoteLoading.set(false);
  }

  prefill(): void {
    this.form.patchValue({
      tags: [this.frontend[0], this.backend[0]],
      sections: ['apple'],
      city: 'Paris',
      langs: ['Czech'],
    });
  }

  toggleDisabled(): void {
    if (this.form.disabled) this.form.enable();
    else this.form.disable();
  }

  openDialog(): void {
    this.dialogs.open(this.dialogTpl(), this.vcr, { width: '320px' });
  }
}
