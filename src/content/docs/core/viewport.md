---
title: Viewport
description: 'Reactive viewport dimensions and breakpoint matching powered by Angular signals. No RxJS, no subscriptions — just signals that update automatically.'
group: Core
order: 37
---

## At a glance

- **Signals** — width & height as read-only signals
- **Breakpoints** — xs / sm / md / lg / xl matching
- **Custom Queries** — observe(), minWidth(), maxWidth()
- **SSR Safe** — No window access during server render

## Live examples

::demo[viewport]

## Code

### Live Dimensions

```ts
import { Component, inject } from '@angular/core';
import { ViewportService } from '@quartz-headless/core';

@Component({
  selector: 'app-responsive',
  template: `
    <p>Width: {{ viewport.width() }}px</p>
    <p>Height: {{ viewport.height() }}px</p>
    <p>Mobile? {{ viewport.isMobile() }}</p>
  `,
})
export class ResponsiveComponent {
  readonly viewport = inject(ViewportService);
}
```

### Breakpoint Matching

```ts
// Predefined breakpoints
const match = viewport.match(); // { xs, sm, md, lg, xl }

// Custom media queries
const isWide = viewport.minWidth(1200);
const isNarrow = viewport.maxWidth(600);
const isPortrait = viewport.observe('(orientation: portrait)');

// Reactive in templates
<button [disabled]="isNarrow()">Desktop Only</button>
```

### Directive Usage

```html
<div qzViewportMatch class="card">
  <!-- Classes qz-mobile / qz-tablet / qz-desktop are applied automatically -->

  @if (viewport.isMobile()) {
  <span>📱 Mobile</span>
  } @else {
  <span>🖥️ Desktop</span>
  }
</div>
```
