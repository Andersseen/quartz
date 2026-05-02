import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { VoltButton, VoltCard, VoltCardContent } from '@voltui/components';

@Component({
  selector: 'app-home-cta',
  imports: [VoltButton, VoltCard, VoltCardContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-24 px-8 bg-[#0f0f13] border-t border-white/10 text-center">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Ready to craft your UI?
        </h2>
        <p class="text-xl text-gray-400 mb-12">
          Zero dependencies, perfect accessibility, infinite styling.
        </p>

        <volt-card
          class="inline-block bg-[#161620] border border-white/10 rounded-xl p-2 shadow-xl"
        >
          <volt-card-content>
            <div
              class="flex items-center gap-4 bg-zinc-900 px-4 py-3 rounded-lg font-mono text-sm text-gray-200"
            >
              <span class="text-violet-500 select-none">$</span>
              npm install quartz-headless
              <volt-button
                variant="outline"
                size="sm"
                (click)="copyInstallCommand()"
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
    navigator.clipboard.writeText('npm install quartz-headless');
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
