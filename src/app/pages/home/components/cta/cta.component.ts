import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { VoltBadge, VoltButton, VoltCard, VoltCardContent } from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-home-cta',
  imports: [VoltBadge, VoltButton, VoltCard, VoltCardContent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-4 py-16 text-center sm:px-6 sm:py-24 md:px-10">
      <div
        [move]="'fade-up'"
        class="mx-auto max-w-4xl rounded-3xl border border-emerald-400/15 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.13),transparent_42%),rgba(15,23,42,0.55)] px-4 py-12 shadow-[0_30px_100px_rgba(15,23,42,0.6)] sm:px-6 sm:py-16 md:px-12"
      >
        <volt-badge variant="secondary" class="mb-5">Ready when you are</volt-badge>
        <h2 class="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          Start with behaviour.<br /><span class="text-emerald-300">Make it yours.</span>
        </h2>
        <p class="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Install one primitive or copy its source. Quartz works with the visual system you already
          trust.
        </p>

        <volt-card
          class="mt-8 block border border-white/10 bg-slate-950/80 p-2 shadow-xl sm:mt-10 sm:inline-block"
        >
          <volt-card-content>
            <div
              class="flex min-w-0 flex-wrap items-center justify-center gap-3 rounded-lg bg-black/30 px-3 py-3 font-mono text-xs text-gray-200 sm:flex-nowrap sm:justify-start sm:gap-4 sm:px-4 sm:text-sm"
            >
              <span class="text-violet-500 select-none">$</span>
              npm install @quartz-headless/core @quartz-headless/primitives
              <volt-button
                variant="outline"
                size="sm"
                (click)="copyInstallCommand()"
                [moveWhileHover]="{ scale: [1, 1.04] }"
                [class.text-green-400]="copied()"
              >
                {{ copied() ? '✓ Copied' : 'Copy' }}
              </volt-button>
            </div>
          </volt-card-content>
        </volt-card>
      </div>
    </section>
  `,
})
export class HomeCtaComponent {
  copied = signal<boolean>(false);

  copyInstallCommand() {
    navigator.clipboard.writeText('npm install @quartz-headless/core @quartz-headless/primitives');
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
