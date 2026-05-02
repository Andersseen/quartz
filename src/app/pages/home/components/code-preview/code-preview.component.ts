import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-code-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-24 px-8">
      <div class="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
        <div class="lg:col-span-2">
          <h2 class="text-4xl font-bold mb-4">Painless APIs.</h2>
          <p class="text-lg text-gray-400 leading-relaxed">
            Control sophisticated UI behaviors with a single line of typescript while keeping full
            control over the markup and styles.
          </p>
        </div>
        <div
          class="lg:col-span-3 bg-zinc-800 rounded-xl border border-white/10 overflow-hidden shadow-2xl"
        >
          <div class="flex items-center gap-2 px-4 py-3 bg-zinc-900 border-b border-white/5">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            <span class="ml-4 font-mono text-xs text-gray-500">save-profile.ts</span>
          </div>
          <pre class="p-6 overflow-x-auto"><code class="font-mono text-sm leading-7 text-gray-200">
<span class="text-purple-400">import</span> &#123; ToastService &#125; <span class="text-purple-400">from</span> <span class="text-green-400">'quartz/toast'</span>;

<span class="text-purple-400">export class</span> ProfileComponent &#123;
  <span class="text-purple-400">constructor</span>(private toast: ToastService) &#123;&#125;

  save() &#123;
    <span class="text-gray-500 italic">// 🚀 Trigger a beautiful toast instantly</span>
    <span class="text-purple-400">this</span>.toast.success(<span class="text-green-400">'Profile updated exactly as intended.'</span>);
  &#125;
&#125;</code></pre>
        </div>
      </div>
    </section>
  `,
})
export class HomeCodePreviewComponent {}
