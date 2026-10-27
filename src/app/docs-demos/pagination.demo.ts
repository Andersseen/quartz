import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-pagination-demo',
  imports: [
    PaginationDirective,
    PaginationFirstDirective,
    PaginationPreviousDirective,
    PaginationPageDirective,
    PaginationNextDirective,
    PaginationLastDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="qz-demo-card">
    <h3>Search results</h3>
    <nav
      qzPagination
      aria-label="Search results"
      [(page)]="page"
      [pageCount]="pageCount()"
      [disabled]="disabled()"
      class="flex gap-2"
    >
      <button qzPaginationFirst>First</button><button qzPaginationPrevious>Previous</button>
      @for (number of pageNumbers(); track number) {
        <button [qzPaginationPage]="number">{{ number }}</button>
      }
      <button qzPaginationNext>Next</button><button qzPaginationLast>Last</button>
    </nav>
    <p>Page {{ page() }} of {{ pageCount() }}</p>
    <button type="button" (click)="pageCount.update(v => v + 1)">Add page</button
    ><button type="button" (click)="removePage()">Remove page</button
    ><button type="button" (click)="disabled.update(v => !v)">Toggle disabled</button>
  </section>`,
})
export class PaginationDemoComponent {
  readonly page = signal(1);
  readonly pageCount = signal(5);
  readonly disabled = signal(false);
  pageNumbers(): number[] {
    return Array.from({ length: this.pageCount() }, (_, index) => index + 1);
  }

  removePage(): void {
    this.pageCount.update((count) => Math.max(0, count - 1));
  }
}
