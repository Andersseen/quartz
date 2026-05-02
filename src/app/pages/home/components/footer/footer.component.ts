import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="py-24 px-8 border-t border-white/10 text-center">
      <p class="text-sm text-gray-500">© 2024 Quartz Headless. Built by Andersseen.</p>
    </footer>
  `,
})
export class HomeFooterComponent {}
