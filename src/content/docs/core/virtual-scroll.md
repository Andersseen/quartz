---
title: Virtual Scroll
description: 'Efficiently render massive lists by only mounting DOM nodes that are visible in the viewport. Fully headless — you control the markup and styling.'
group: Core
order: 36
---

## At a glance

- **Fixed Size** — Optimized for uniform item heights
- **Buffer** — Prerender items outside viewport
- **Scroll To Index** — Programmatic navigation
- **Resize Aware** — Recalculates on viewport resize

## Live examples

::demo[virtual-scroll]

## Code

### 10 000 Items

```html
<div
  class="viewport"
  qzVirtualScroll
  [items]="users()"
  [itemSize]="56"
  [buffer]="4"
  #vs="qzVirtualScroll"
>
  <div class="content" [style.height.px]="vs.contentHeight()">
    @for (row of vs.visibleItems(); track row.index) {
    <div class="row" [style.top.px]="row.offset">
      <strong>#{{ row.index + 1 }}</strong>
      <span>{{ row.item.name }}</span>
      <small>{{ row.item.email }}</small>
    </div>
    }
  </div>
</div>
```

### What The Directive Exposes

```html
<!-- Template reference -->
<div qzVirtualScroll [items]="items" [itemSize]="50" #vs="qzVirtualScroll">...</div>

<!-- Scroll to index -->
<button (click)="vs.scrollToIndex(0)">Top</button>
<button (click)="vs.scrollToIndex(5000)">Middle</button>
<button (click)="vs.scrollToIndex(vs.count() - 1)">Bottom</button>

<!-- Read signals -->
<p>Rendered: {{ vs.visibleItems().length }} / {{ vs.count() }}</p>
<p>Range: {{ vs.startIndex() + 1 }} - {{ vs.endIndex() + 1 }}</p>
<p>Scroll height: {{ vs.contentHeight() }}px</p>
```
