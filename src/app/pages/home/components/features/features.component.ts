import { Component, ChangeDetectionStrategy } from '@angular/core';
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
}
