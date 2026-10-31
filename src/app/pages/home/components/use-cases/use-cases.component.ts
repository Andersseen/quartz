import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

interface UseCase {
  title: string;
  summary: string;
  pieces: { name: string; path: string }[];
}

@Component({
  selector: 'app-home-use-cases',
  imports: [RouterLink, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      aria-labelledby="use-cases-title"
      class="border-t border-line px-4 py-20 sm:px-6 md:px-10 md:py-24"
    >
      <div class="mx-auto max-w-6xl">
        <div [move]="'fade-up'" class="max-w-2xl">
          <p class="text-xs font-semibold tracking-[0.16em] text-accent uppercase">Use cases</p>
          <h2
            id="use-cases-title"
            class="mt-3 text-3xl font-bold tracking-tight text-fg md:text-4xl"
          >
            The interfaces teams actually build.
          </h2>
        </div>
        <ul
          moveStagger
          [moveStaggerStep]="70"
          class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          @for (useCase of useCases; track useCase.title) {
            <li
              [move]="'fade-up'"
              class="rounded-2xl border border-line bg-surface-1 p-6 transition-colors hover:border-line-strong"
            >
              <h3 class="text-lg font-semibold text-fg">{{ useCase.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-fg-muted">{{ useCase.summary }}</p>
              <ul
                class="mt-4 flex flex-wrap gap-2"
                [attr.aria-label]="useCase.title + ' building blocks'"
              >
                @for (piece of useCase.pieces; track piece.path) {
                  <li>
                    <a
                      [routerLink]="piece.path"
                      class="site-focus inline-flex min-h-8 items-center rounded-md border border-line px-2.5 font-mono text-xs text-fg hover:border-brand/60"
                      >{{ piece.name }}</a
                    >
                  </li>
                }
              </ul>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
})
export class HomeUseCasesComponent {
  protected readonly useCases: UseCase[] = [
    {
      title: 'Command palette & search',
      summary: 'An editable combobox in a modal layer with filtering, typeahead and focus return.',
      pieces: [
        { name: 'Combobox', path: '/docs/primitives/combobox' },
        { name: 'Dialog', path: '/docs/primitives/dialog' },
        { name: 'Search recipe', path: '/docs/primitives/search-composition' },
      ],
    },
    {
      title: 'Application shell',
      summary: 'A responsive sidebar and sticky navbar around panels the user can resize.',
      pieces: [
        { name: 'Sidebar', path: '/docs/primitives/sidebar' },
        { name: 'Navbar', path: '/docs/primitives/navbar' },
        { name: 'Resizable', path: '/docs/primitives/resizable' },
      ],
    },
    {
      title: 'Settings & forms',
      summary:
        'Labelled fields with errors, switches, sliders and selects that work with Angular Forms.',
      pieces: [
        { name: 'FormField', path: '/docs/primitives/form-field' },
        { name: 'Switch', path: '/docs/primitives/switch' },
        { name: 'Select', path: '/docs/primitives/select' },
        { name: 'Forms adapters', path: '/docs/guides/angular-forms' },
      ],
    },
    {
      title: 'Dates & scheduling',
      summary: 'Keyboard-navigable calendars for one date or a range, locale-aware and RTL-safe.',
      pieces: [
        { name: 'DatePicker', path: '/docs/primitives/date-picker' },
        { name: 'DateRangePicker', path: '/docs/primitives/date-range-picker' },
      ],
    },
    {
      title: 'Data-dense screens',
      summary: 'Large lists, trees and toolbars that stay fast and keyboard-reachable.',
      pieces: [
        { name: 'VirtualScroll', path: '/docs/core/virtual-scroll' },
        { name: 'Tree', path: '/docs/primitives/tree' },
        { name: 'Toolbar', path: '/docs/primitives/toolbar' },
        { name: 'Pagination', path: '/docs/primitives/pagination' },
      ],
    },
    {
      title: 'Custom widgets',
      summary: 'Build a one-off popup or sortable list from the same engine the primitives use.',
      pieces: [
        { name: 'Overlay', path: '/docs/core/overlay' },
        { name: 'Dismiss', path: '/docs/core/dismiss' },
        { name: 'Collection', path: '/docs/core/collection' },
        { name: 'DragDrop', path: '/docs/core/drag-drop' },
      ],
    },
  ];
}
