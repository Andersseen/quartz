import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import { VoltBadge } from '@voltui/components';

@Component({
  selector: 'app-components-catalog',
  imports: [HeaderComponent, RouterLink, VoltBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />

    <main class="min-h-screen px-5 py-28 sm:px-8 md:px-10 md:py-36">
      <div class="mx-auto max-w-6xl">
        <header class="mb-10">
          <volt-badge variant="secondary" class="mb-4">Library catalogue</volt-badge>
          <h1 class="text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Two packages. Everything Quartz ships.
          </h1>
          <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
            Core contains low-level interaction infrastructure. Primitives compose those pieces into
            accessible, unstyled UI patterns for Angular design systems.
          </p>
        </header>

        <section class="space-y-8">
          <section class="border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                  Library
                </p>
                <h2 class="mt-1 text-2xl font-bold text-white">@quartz-headless/core</h2>
              </div>
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >10 APIs</span
              >
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              @for (item of core; track item.name) {
                <a
                  [routerLink]="item.path"
                  class="block border border-white/8 bg-white/[0.025] px-4 py-3 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.04]"
                >
                  <span class="font-medium text-slate-100">{{ item.name }}</span>
                  <span class="mt-1 block text-sm text-slate-500">{{ item.detail }}</span>
                </a>
              }
            </div>
          </section>

          <section class="border border-white/10 bg-white/[0.02] p-5 sm:p-6">
            <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                  Library
                </p>
                <h2 class="mt-1 text-2xl font-bold text-white">@quartz-headless/primitives</h2>
              </div>
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >17 primitives</span
              >
            </div>
            <div class="space-y-6">
              @for (group of primitiveGroups; track group.label) {
                <div class="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <h3 class="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {{ group.label }}
                  </h3>
                  <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    @for (item of group.items; track item.name) {
                      <a
                        [routerLink]="item.path"
                        class="block border border-white/8 bg-white/[0.025] px-4 py-3 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/[0.04]"
                      >
                        <span class="font-medium text-slate-100">{{ item.name }}</span>
                        <span class="mt-1 block text-sm text-slate-500">{{ item.detail }}</span>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </section>
        </section>
      </div>
    </main>
  `,
})
export default class ComponentsCatalogPage {
  readonly core = [
    { name: 'Collection', path: '/docs', detail: 'Registration, DOM order, typeahead and focus' },
    { name: 'Focus', path: '/docs', detail: 'Initial focus, focus trap and safe restoration' },
    { name: 'Dismiss', path: '/docs', detail: 'Escape, outside pointer, focus outside and scroll' },
    {
      name: 'Directionality',
      path: '/directionality',
      detail: 'LTR/RTL resolution and inline keys',
    },
    { name: 'Overlay', path: '/overlay', detail: 'Portal rendering and positioning' },
    { name: 'ScrollLock', path: '/scroll-lock', detail: 'Per-Document body scroll coordination' },
    { name: 'Viewport', path: '/viewport', detail: 'Reactive breakpoint matching' },
    { name: 'DragDrop', path: '/drag-drop', detail: 'Native pointer-based drag and drop' },
    {
      name: 'VirtualScroll',
      path: '/virtual-scroll',
      detail: 'Windowed rendering for large lists',
    },
    { name: 'Splitter', path: '/splitter', detail: 'Resizable panels and keyboard handles' },
  ];

  readonly primitiveGroups = [
    {
      label: 'Floating / Selection',
      items: [
        { name: 'Dialog', path: '/dialog', detail: 'Modal dialog and drawer behavior' },
        { name: 'Tooltip', path: '/tooltip', detail: 'Hover and focus descriptions' },
        { name: 'Popover', path: '/popover', detail: 'Dismissible floating content' },
        { name: 'Menu', path: '/menu', detail: 'Menus, submenus and checkable items' },
        { name: 'Listbox', path: '/listbox', detail: 'Single and multiple selection' },
        { name: 'Combobox', path: '/combobox', detail: 'Editable suggestions' },
        { name: 'Select', path: '/select', detail: 'Button-triggered listbox popup' },
      ],
    },
    {
      label: 'Navigation / Disclosure',
      items: [
        { name: 'Tree', path: '/tree', detail: 'Hierarchical keyboard navigation' },
        { name: 'Tabs', path: '/tabs', detail: 'Tablist and panels' },
        { name: 'Accordion', path: '/accordion', detail: 'Single or multiple disclosure sections' },
      ],
    },
    {
      label: 'Controls',
      items: [
        { name: 'Switch', path: '/switch', detail: 'Boolean setting control' },
        { name: 'Checkbox', path: '/checkbox', detail: 'Checked, unchecked and mixed state' },
        { name: 'RadioGroup', path: '/radio-group', detail: 'Standalone radio selection' },
        { name: 'Toggle', path: '/toggle', detail: 'Pressed button state' },
        { name: 'ToggleGroup', path: '/toggle-group', detail: 'Single or multiple pressed items' },
        { name: 'Slider', path: '/slider', detail: 'Single-thumb range input' },
      ],
    },
    {
      label: 'Feedback',
      items: [{ name: 'Toast', path: '/toast', detail: 'Accessible notifications' }],
    },
  ];
}
