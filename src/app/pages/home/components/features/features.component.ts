import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  VoltBadge,
  VoltCard,
  VoltCardContent,
  VoltCardDescription,
  VoltCardHeader,
  VoltCardTitle,
} from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-home-features',
  imports: [
    VoltBadge,
    VoltCard,
    VoltCardContent,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    RouterLink,
    ...MOVEMENT_DIRECTIVES,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-y border-white/8 bg-slate-950/40 px-6 py-24 md:px-10">
      <div class="mx-auto max-w-6xl">
        <div [move]="'fade-up'" class="mb-12 max-w-2xl">
          <volt-badge variant="secondary" class="mb-4">The foundation layer</volt-badge>
          <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ship behaviour once. Express it differently everywhere.
          </h2>
        </div>
        <div moveStagger [moveStaggerStep]="90" class="grid grid-cols-1 gap-5 md:grid-cols-3">
          @for (feature of features; track feature.title; let i = $index) {
            <volt-card
              [move]="'fade-up'"
              [moveWhileHover]="{ y: [0, -6], scale: [1, 1.01] }"
              class="group border border-white/8 bg-white/[0.025] transition-colors hover:border-emerald-300/25 hover:bg-emerald-300/[0.035]"
            >
              <volt-card-header
                ><div
                  class="mb-5 flex size-11 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-xl"
                >
                  {{ feature.icon }}
                </div>
                <volt-card-title>{{ feature.title }}</volt-card-title
                ><volt-card-description>{{
                  feature.description
                }}</volt-card-description></volt-card-header
              >
              <volt-card-content
                class="block px-6 pb-6 text-xs font-medium uppercase tracking-[0.14em] text-emerald-300/80"
                >{{ feature.detail }}</volt-card-content
              >
            </volt-card>
          }
        </div>

        <div [move]="'fade-up'" [moveDelay]="120" class="mt-16 grid gap-10 lg:grid-cols-[1fr_1fr]">
          <section>
            <div class="mb-5 flex items-center justify-between gap-4">
              <h3 class="text-xl font-bold text-white">Core infrastructure</h3>
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >10 APIs</span
              >
            </div>
            <div class="grid gap-2 sm:grid-cols-2">
              @for (item of core; track item.path) {
                <a
                  [routerLink]="item.path"
                  class="group border border-white/8 bg-black/20 px-3 py-3 text-sm text-slate-300 transition-colors hover:border-cyan-300/30 hover:bg-cyan-300/[0.04] hover:text-white"
                >
                  <span class="block font-medium">{{ item.name }}</span>
                  <span class="mt-1 block text-xs leading-5 text-slate-500">{{ item.detail }}</span>
                </a>
              }
            </div>
          </section>

          <section>
            <div class="mb-5 flex items-center justify-between gap-4">
              <h3 class="text-xl font-bold text-white">Primitives</h3>
              <span class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                >17 controls</span
              >
            </div>
            <div class="grid gap-2 sm:grid-cols-2">
              @for (item of primitives; track item.path) {
                <a
                  [routerLink]="item.path"
                  class="group border border-white/8 bg-black/20 px-3 py-3 text-sm text-slate-300 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/[0.04] hover:text-white"
                >
                  <span class="block font-medium">{{ item.name }}</span>
                  <span class="mt-1 block text-xs leading-5 text-slate-500">{{ item.detail }}</span>
                </a>
              }
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
})
export class HomeFeaturesComponent {
  readonly features = [
    {
      icon: '◌',
      title: 'Headless by default',
      description: 'Bring your tokens, components and visual language.',
      detail: 'No theme to override',
    },
    {
      icon: '↗',
      title: 'Accessible behaviour',
      description: 'Focus, keyboard interactions and ARIA patterns are first-class.',
      detail: 'WAI-ARIA minded',
    },
    {
      icon: '✦',
      title: 'Composes cleanly',
      description: 'Small primitives that become menus, command palettes and more.',
      detail: 'Signals + standalone',
    },
  ];

  readonly core = [
    { name: 'Collection', path: '/docs', detail: 'Registration, DOM order and roving focus' },
    { name: 'Focus', path: '/docs', detail: 'Trap, restore and initial focus helpers' },
    { name: 'Dismiss', path: '/docs', detail: 'Escape, outside pointer, focus and scroll' },
    { name: 'Directionality', path: '/directionality', detail: 'LTR/RTL resolution and keys' },
    { name: 'Overlay', path: '/overlay', detail: 'Portal positioning for floating UI' },
    { name: 'Scroll Lock', path: '/scroll-lock', detail: 'Document-scoped modal scroll locks' },
    { name: 'Viewport', path: '/viewport', detail: 'Reactive breakpoint matching' },
    { name: 'Drag & Drop', path: '/drag-drop', detail: 'Native pointer-based drag flows' },
    {
      name: 'Virtual Scroll',
      path: '/virtual-scroll',
      detail: 'Windowed rendering for long lists',
    },
    { name: 'Splitter', path: '/splitter', detail: 'Resizable panels and handles' },
  ];

  readonly primitives = [
    { name: 'Dialog', path: '/dialog', detail: 'Modal dialog and drawer behavior' },
    { name: 'Tooltip', path: '/tooltip', detail: 'Hover and focus descriptions' },
    { name: 'Popover', path: '/popover', detail: 'Dismissible floating content' },
    { name: 'Menu', path: '/menu', detail: 'Menu, submenu and checkable items' },
    { name: 'Listbox', path: '/listbox', detail: 'Single and multi selection' },
    { name: 'Combobox', path: '/combobox', detail: 'Editable suggestions' },
    { name: 'Select', path: '/select', detail: 'Button-triggered listbox popup' },
    { name: 'Tree', path: '/tree', detail: 'Hierarchical navigation' },
    { name: 'Tabs', path: '/tabs', detail: 'Tablist and panels' },
    { name: 'Accordion', path: '/accordion', detail: 'Disclosure sections' },
    { name: 'Switch', path: '/switch', detail: 'Boolean setting control' },
    { name: 'Checkbox', path: '/checkbox', detail: 'Checked, unchecked and mixed state' },
    { name: 'RadioGroup', path: '/radio-group', detail: 'Standalone radio selection' },
    { name: 'Toggle', path: '/toggle', detail: 'Pressed button state' },
    { name: 'ToggleGroup', path: '/toggle-group', detail: 'Single or multiple pressed items' },
    { name: 'Slider', path: '/slider', detail: 'Single-thumb range input' },
    { name: 'Toast', path: '/toast', detail: 'Accessible notifications' },
  ];
}
