export const BASIC_SNIPPET = `import { Component, inject } from '@angular/core';
import { ViewportService } from 'quartz';

@Component({
  selector: 'app-responsive',
  template: \`
    <p>Width: {{ viewport.width() }}px</p>
    <p>Height: {{ viewport.height() }}px</p>
    <p>Mobile? {{ viewport.isMobile() }}</p>
  \`,
})
export class ResponsiveComponent {
  readonly viewport = inject(ViewportService);
}`;

export const MATCH_SNIPPET = `// Predefined breakpoints
const match = viewport.match(); // { xs, sm, md, lg, xl }

// Custom media queries
const isWide = viewport.minWidth(1200);
const isNarrow = viewport.maxWidth(600);
const isPortrait = viewport.observe('(orientation: portrait)');

// Reactive in templates
<button [disabled]="isNarrow()">Desktop Only</button>`;

export const API_SNIPPET = `<div qzViewportMatch class="card">
  <!-- Classes qz-mobile / qz-tablet / qz-desktop are applied automatically -->

  @if (viewport.isMobile()) {
    <span>📱 Mobile</span>
  } @else {
    <span>🖥️ Desktop</span>
  }
</div>`;
