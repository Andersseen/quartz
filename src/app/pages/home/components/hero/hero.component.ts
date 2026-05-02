import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="flex flex-col items-center justify-center text-center px-8 pt-12 pb-24 relative z-10"
    >
      <div class="max-w-4xl w-full mx-auto">
        <div
          class="inline-flex items-center gap-3 px-5 py-2.5 bg-[#0f0f13] border border-white/10 rounded-full mb-8 text-sm font-medium text-gray-400"
        >
          <span
            class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_12px_#22c55e] animate-pulse"
          ></span>
          v0.0.1 • Headless Primitives
        </div>

        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Build with
          <span
            class="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent"
            >Precision.</span
          >
        </h1>

        <p class="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-12 leading-relaxed">
          A collection of unstyled, accessible, and composable Angular components. Reclaim control
          over your design system.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/docs">
            <volt-button variant="solid">
              Get Started
              <span slot="trailing">→</span>
            </volt-button>
          </a>
          <a routerLink="/components">
            <volt-button variant="outline">Explore Components</volt-button>
          </a>
        </div>
      </div>
    </main>
  `,
})
export class HomeHeroComponent {}
