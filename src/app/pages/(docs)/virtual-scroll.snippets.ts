export const BASIC_SNIPPET = `<div
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
</div>`;

export const API_SNIPPET = `<!-- Template reference -->
<div qzVirtualScroll [items]="items" [itemSize]="50" #vs="qzVirtualScroll">
  ...
</div>

<!-- Scroll to index -->
<button (click)="vs.scrollToIndex(0)">Top</button>
<button (click)="vs.scrollToIndex(5000)">Middle</button>
<button (click)="vs.scrollToIndex(vs.count() - 1)">Bottom</button>

<!-- Read signals -->
<p>Rendered: {{ vs.visibleItems().length }} / {{ vs.count() }}</p>
<p>Range: {{ vs.startIndex() + 1 }} - {{ vs.endIndex() + 1 }}</p>
<p>Scroll height: {{ vs.contentHeight() }}px</p>`;
