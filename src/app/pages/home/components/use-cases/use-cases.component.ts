import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { SectionHeadingComponent } from '../section-heading/section-heading.component';

type Sketch = 'palette' | 'shell' | 'forms' | 'dates' | 'data' | 'widgets';

interface UseCase {
  title: string;
  summary: string;
  sketch: Sketch;
  /** Bento placement on large screens. */
  span: string;
  pieces: { name: string; path: string }[];
}

/**
 * Use cases as a bento grid. Each card carries a wireframe of the interface it describes: the
 * same "structure, not skin" language as the hero lens. The sketches are decorative.
 */
@Component({
  selector: 'app-home-use-cases',
  imports: [RouterLink, SectionHeadingComponent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="use-cases-title" class="section-shell">
      <div class="mx-auto max-w-6xl">
        <app-section-heading headingId="use-cases-title" eyebrow="Use cases" tone="accent">
          <ng-container heading>The interfaces teams actually build.</ng-container>
          Real screens are compositions. Each one below names the Quartz pieces it is made of; the
          wireframe is everything Quartz cares about.
        </app-section-heading>

        <ul
          moveStagger
          [moveStaggerStep]="70"
          class="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          @for (useCase of useCases; track useCase.title) {
            <li [move]="'fade-up'" class="feature-card group flex flex-col" [class]="useCase.span">
              <div class="sketch" aria-hidden="true">
                @switch (useCase.sketch) {
                  @case ('palette') {
                    <div class="mx-auto w-full max-w-sm space-y-2">
                      <div class="wire flex h-9 items-center gap-2 px-3">
                        <span class="wire-dot"></span><span class="wire-bar w-24"></span>
                      </div>
                      <div class="wire space-y-1.5 p-2">
                        <div class="wire-row wire-active"><span class="wire-bar w-28"></span></div>
                        <div class="wire-row"><span class="wire-bar w-20"></span></div>
                        <div class="wire-row"><span class="wire-bar w-32"></span></div>
                      </div>
                    </div>
                  }
                  @case ('shell') {
                    <div class="grid h-full w-full grid-cols-[3.5rem_1fr] gap-2">
                      <div class="wire space-y-2 p-2">
                        <span class="wire-bar block w-full"></span>
                        <span class="wire-bar block w-3/4"></span>
                        <span class="wire-bar block w-full"></span>
                      </div>
                      <div class="grid grid-rows-[1.75rem_1fr] gap-2">
                        <div class="wire"></div>
                        <div class="grid grid-cols-[1fr_auto_1.4fr] gap-1.5">
                          <div class="wire"></div>
                          <div class="wire-handle"></div>
                          <div class="wire"></div>
                        </div>
                      </div>
                    </div>
                  }
                  @case ('forms') {
                    <div class="w-full space-y-3">
                      <span class="wire-bar block w-14"></span>
                      <div class="wire h-8"></div>
                      <div class="flex items-center justify-between">
                        <span class="wire-bar w-16"></span>
                        <span class="wire-switch"></span>
                      </div>
                      <div class="wire-track"><span class="wire-thumb"></span></div>
                    </div>
                  }
                  @case ('dates') {
                    <div class="grid w-full grid-cols-7 gap-1">
                      @for (day of days; track day) {
                        <span
                          class="wire-cell"
                          [class.wire-range]="day >= 9 && day <= 13"
                          [class.wire-active]="day === 9 || day === 13"
                        ></span>
                      }
                    </div>
                  }
                  @case ('data') {
                    <div class="w-full space-y-1.5">
                      @for (row of rows; track row.id) {
                        <div class="wire-row" [style.padding-left.rem]="0.5 + row.depth * 1.1">
                          <span class="wire-dot"></span>
                          <span class="wire-bar" [style.width.rem]="row.width"></span>
                        </div>
                      }
                    </div>
                  }
                  @case ('widgets') {
                    <div class="relative flex h-full w-full items-center justify-around gap-6">
                      <div class="flex flex-col items-center gap-2">
                        <div class="wire flex h-8 w-24 items-center justify-center">
                          <span class="wire-bar w-12"></span>
                        </div>
                        <span class="wire-arrow"></span>
                        <div class="wire w-32 space-y-1.5 p-2">
                          <div class="wire-row wire-active">
                            <span class="wire-bar w-14"></span>
                          </div>
                          <div class="wire-row"><span class="wire-bar w-20"></span></div>
                        </div>
                      </div>
                      <div class="hidden w-40 space-y-1.5 sm:block">
                        <div class="wire-row">
                          <span class="wire-grip"></span><span class="wire-bar w-16"></span>
                        </div>
                        <div class="wire-row wire-lift">
                          <span class="wire-grip"></span><span class="wire-bar w-20"></span>
                        </div>
                        <div class="wire-row">
                          <span class="wire-grip"></span><span class="wire-bar w-12"></span>
                        </div>
                      </div>
                    </div>
                  }
                }
              </div>

              <div class="flex flex-1 flex-col p-6 pt-5">
                <h3 class="text-lg font-semibold tracking-tight text-fg">{{ useCase.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-fg-muted">{{ useCase.summary }}</p>
                <ul
                  class="mt-auto flex flex-wrap gap-2 pt-5"
                  [attr.aria-label]="useCase.title + ' building blocks'"
                >
                  @for (piece of useCase.pieces; track piece.path) {
                    <li>
                      <a [routerLink]="piece.path" class="site-focus chip">{{ piece.name }}</a>
                    </li>
                  }
                </ul>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class HomeUseCasesComponent {
  protected readonly days = Array.from({ length: 28 }, (_, index) => index + 1);
  protected readonly rows = [
    { id: 1, depth: 0, width: 6 },
    { id: 2, depth: 1, width: 5 },
    { id: 3, depth: 1, width: 7 },
    { id: 4, depth: 2, width: 4 },
    { id: 5, depth: 0, width: 5.5 },
  ];
  protected readonly useCases: UseCase[] = [
    {
      title: 'Command palette & search',
      summary: 'An editable combobox in a modal layer with filtering, typeahead and focus return.',
      sketch: 'palette',
      span: 'lg:col-span-2',
      pieces: [
        { name: 'Combobox', path: '/components/combobox' },
        { name: 'Dialog', path: '/components/dialog' },
        { name: 'Search recipe', path: '/components/search-composition' },
      ],
    },
    {
      title: 'Application shell',
      summary: 'A responsive sidebar and sticky navbar around panels the user can resize.',
      sketch: 'shell',
      span: '',
      pieces: [
        { name: 'Sidebar', path: '/components/sidebar' },
        { name: 'Navbar', path: '/components/navbar' },
        { name: 'Resizable', path: '/components/resizable' },
      ],
    },
    {
      title: 'Settings & forms',
      summary:
        'Labelled fields with errors, switches, sliders and selects that work with Angular Forms.',
      sketch: 'forms',
      span: '',
      pieces: [
        { name: 'FormField', path: '/components/form-field' },
        { name: 'Switch', path: '/components/switch' },
        { name: 'Select', path: '/components/select' },
        { name: 'Forms adapters', path: '/docs/guides/angular-forms' },
      ],
    },
    {
      title: 'Dates & scheduling',
      summary: 'Keyboard-navigable calendars for one date or a range, locale-aware and RTL-safe.',
      sketch: 'dates',
      span: '',
      pieces: [
        { name: 'DatePicker', path: '/components/date-picker' },
        { name: 'DateRangePicker', path: '/components/date-range-picker' },
      ],
    },
    {
      title: 'Data-dense screens',
      summary: 'Large lists, trees and toolbars that stay fast and keyboard-reachable.',
      sketch: 'data',
      span: '',
      pieces: [
        { name: 'VirtualScroll', path: '/components/virtual-scroll' },
        { name: 'Tree', path: '/components/tree' },
        { name: 'Toolbar', path: '/components/toolbar' },
        { name: 'Pagination', path: '/components/pagination' },
      ],
    },
    {
      title: 'Custom widgets',
      summary:
        'Build a one-off popup or a sortable list from the same engine the primitives use: positioning, dismissal, keyboard collections and drag and drop.',
      sketch: 'widgets',
      span: 'md:col-span-2 lg:col-span-3',
      pieces: [
        { name: 'Overlay', path: '/components/overlay' },
        { name: 'Dismiss', path: '/components/dismiss' },
        { name: 'Collection', path: '/components/collection' },
        { name: 'DragDrop', path: '/components/drag-drop' },
      ],
    },
  ];
}
