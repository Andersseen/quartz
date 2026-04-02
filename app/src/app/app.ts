import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SplitterDemoComponent } from './demos/splitter-demo.component';
import { ToastDemoComponent } from './demos/toast-demo.component';

@Component({
  selector: 'app-root',
  imports: [SplitterDemoComponent, ToastDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gray-100">
      <header class="bg-blue-600 text-white py-6 px-4 shadow-md">
        <h1 class="text-3xl font-bold text-center">Quartz UI - Headless Components Demo</h1>
      </header>

      <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <app-splitter-demo />
        <app-toast-demo />
      </main>
    </div>
  `,
})
export class App {}
