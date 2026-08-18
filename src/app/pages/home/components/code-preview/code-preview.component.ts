import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VoltBadge, VoltCard, VoltCardContent } from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-home-code-preview',
  imports: [VoltBadge, VoltCard, VoltCardContent, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="px-6 py-24 md:px-10">
      <div class="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-5 lg:gap-16">
        <div [move]="'fade-up'" class="lg:col-span-2">
          <volt-badge variant="secondary" class="mb-4">Ergonomic API</volt-badge>
          <h2 class="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Less ceremony.<br /><span class="text-emerald-300">More control.</span>
          </h2>
          <p class="mt-5 text-lg leading-8 text-slate-400">
            Compose sophisticated UI behaviour with concise TypeScript while the markup and visual
            treatment remain entirely yours.
          </p>
          <div class="mt-7 flex gap-6 border-l border-emerald-400/30 pl-4 text-sm text-slate-400">
            <span><strong class="block text-lg text-white">Signals</strong> reactive state</span
            ><span><strong class="block text-lg text-white">SSR</strong> guarded DOM</span>
          </div>
        </div>
        <volt-card
          [move]="'fade-up'"
          [moveDelay]="120"
          class="lg:col-span-3 overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl"
        >
          <volt-card-content class="block p-0">
            <div class="flex items-center gap-2 border-b border-white/5 bg-white/[0.025] px-4 py-3">
              <span class="w-3 h-3 rounded-full bg-red-500"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              <span class="ml-4 font-mono text-xs text-gray-500">save-profile.ts</span>
            </div>
            <pre
              class="overflow-x-auto p-6"
            ><code class="font-mono text-sm leading-7 text-gray-200">
<span class="text-purple-400">import</span> &#123; ToastService &#125; <span class="text-purple-400">from</span> <span class="text-green-400">'quartz/toast'</span>;

<span class="text-purple-400">export class</span> ProfileComponent &#123;
  <span class="text-purple-400">constructor</span>(private toast: ToastService) &#123;&#125;

  save() &#123;
    <span class="text-gray-500 italic">// 🚀 Trigger a beautiful toast instantly</span>
    <span class="text-purple-400">this</span>.toast.success(<span class="text-green-400">'Profile updated exactly as intended.'</span>);
  &#125;
&#125;</code></pre>
          </volt-card-content>
        </volt-card>
      </div>
    </section>
  `,
})
export class HomeCodePreviewComponent {}
