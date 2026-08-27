import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoltBadge, VoltButton, VoltCard, VoltCardContent } from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { version } from '../../../../../../packages/core/package.json';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, VoltBadge, VoltButton, VoltCard, VoltCardContent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="relative z-10 px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20 md:px-10 md:pt-44 lg:pb-32"
    >
      <div class="mx-auto grid max-w-6xl items-center gap-10 sm:gap-16 lg:grid-cols-[1.05fr_.95fr]">
        <div class="text-center lg:text-left">
          <div
            [move]="'fade-up'"
            [moveDelay]="40"
            class="mb-5 flex justify-center sm:mb-7 lg:justify-start"
          >
            <volt-badge
              variant="secondary"
              class="border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-emerald-200"
            >
              <span
                class="mr-2 inline-block size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]"
              ></span>
              v{{ version }} · Angular 21
            </volt-badge>
          </div>
          <h1
            [move]="'fade-up'"
            [moveDelay]="100"
            class="mx-auto max-w-3xl text-[clamp(2.75rem,12vw,4rem)] leading-[0.98] font-black tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:mx-0 lg:text-7xl"
          >
            Behaviour for the
            <span
              class="bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-400 bg-clip-text text-transparent"
              >interfaces you own.</span
            >
          </h1>
          <p
            [move]="'fade-up'"
            [moveDelay]="160"
            class="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-400 sm:mt-7 sm:text-lg sm:leading-8 lg:mx-0"
          >
            Quartz gives Angular design systems accessible interaction primitives — not another
            visual language to undo.
          </p>
          <div
            [move]="'fade-up'"
            [moveDelay]="220"
            class="mt-7 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row lg:justify-start"
          >
            <a routerLink="/docs" class="w-full sm:w-auto"
              ><volt-button variant="solid" class="w-full sm:w-auto"
                >Start building <span slot="trailing">→</span></volt-button
              ></a
            >
            <a routerLink="/components" class="w-full sm:w-auto"
              ><volt-button variant="outline" class="w-full sm:w-auto"
                >Browse primitives</volt-button
              ></a
            >
          </div>
          <div
            [move]="'fade-up'"
            [moveDelay]="280"
            class="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-slate-500 sm:mt-10 sm:gap-6 sm:text-xs sm:tracking-[0.16em] lg:justify-start"
          >
            <span>Signals first</span><span class="size-1 rounded-full bg-slate-700"></span
            ><span>SSR safe</span><span class="size-1 rounded-full bg-slate-700"></span
            ><span>Unstyled</span>
          </div>
        </div>

        <volt-card
          [move]="'fade-up'"
          [moveDelay]="140"
          class="relative overflow-hidden border border-white/10 bg-slate-950/70 shadow-[0_24px_100px_rgba(16,185,129,0.12)] backdrop-blur"
        >
          <div
            class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent"
          ></div>
          <volt-card-content class="block p-4 sm:p-7">
            <div class="mb-4 flex items-center justify-between sm:mb-6">
              <span class="font-mono text-xs text-slate-500">behaviour.preview.ts</span
              ><span
                class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300"
                >Live</span
              >
            </div>
            <div
              class="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-slate-300 sm:p-5 sm:text-sm sm:leading-7"
            >
              <p>
                <span class="text-violet-300">const</span> menu =
                <span class="text-cyan-300">inject</span>(OverlayService);
              </p>
              <p class="mt-3 text-slate-500">// positioning, focus and escape</p>
              <p>menu.<span class="text-emerald-300">create</span>(template, vcr, trigger);</p>
              <p class="mt-4 text-slate-500">// your markup. your visual system.</p>
              <p>
                <span class="text-violet-300">export</span>
                <span class="text-violet-300">class</span>
                <span class="text-cyan-200">Menu</span> &#123; ... &#125;
              </p>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
              <div class="rounded-lg border border-white/8 bg-white/[0.03] p-2 sm:p-3">
                <p class="text-base font-bold text-white sm:text-lg">10</p>
                <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Primitives</p>
              </div>
              <div class="rounded-lg border border-white/8 bg-white/[0.03] p-2 sm:p-3">
                <p class="text-base font-bold text-white sm:text-lg">0</p>
                <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Themes</p>
              </div>
              <div class="rounded-lg border border-white/8 bg-white/[0.03] p-2 sm:p-3">
                <p class="text-base font-bold text-white sm:text-lg">A11y</p>
                <p class="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Built in</p>
              </div>
            </div>
          </volt-card-content>
        </volt-card>
      </div>
    </main>
  `,
})
export class HomeHeroComponent {
  readonly version = version;
}
