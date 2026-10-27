import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
} from './pagination.directive';

@Component({
  standalone: true,
  imports: [
    PaginationDirective,
    PaginationFirstDirective,
    PaginationPreviousDirective,
    PaginationNextDirective,
    PaginationLastDirective,
    PaginationPageDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="submitted.set(true)">
      <nav
        qzPagination
        aria-label="Search results"
        [(page)]="page"
        [pageCount]="pageCount()"
        [disabled]="disabled()"
      >
        <button qzPaginationFirst>First</button>
        <button qzPaginationPrevious>Previous</button>
        @for (number of pageNumbers(); track number) {
          <button [qzPaginationPage]="number">{{ number }}</button>
        }
        <button qzPaginationNext>Next</button>
        <button qzPaginationLast>Last</button>
      </nav>
    </form>
  `,
})
class PaginationHost {
  readonly page = signal(1);
  readonly pageCount = signal(3);
  readonly disabled = signal(false);
  readonly submitted = signal(false);
  pageNumbers = () => Array.from({ length: this.pageCount() }, (_, index) => index + 1);
}

describe('Pagination', () => {
  it('uses a named navigation landmark, 1-based current state and boundary controls', async () => {
    await render(PaginationHost);
    const nav = screen.getByRole('navigation', { name: 'Search results' });
    expect(nav).toHaveAttribute('role', 'navigation');
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.getAllByRole('button', { current: 'page' })).toHaveLength(1);
  });

  it('supports first, previous, next and last without submitting the surrounding form', async () => {
    const { fixture } = await render(PaginationHost);
    const host = fixture.componentInstance;
    fireEvent.click(screen.getByRole('button', { name: 'Last page' }));
    fixture.detectChanges();
    expect(host.page()).toBe(3);
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    fixture.detectChanges();
    expect(host.page()).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'First page' }));
    fixture.detectChanges();
    expect(host.page()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fixture.detectChanges();
    expect(host.page()).toBe(2);
    expect(host.submitted()).toBe(false);
  });

  it('clamps programmatic values and dynamic pageCount changes, including zero pages', async () => {
    const { fixture } = await render(PaginationHost);
    const host = fixture.componentInstance;
    host.page.set(99);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(3);

    host.pageCount.set(2);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(2);

    host.pageCount.set(0);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(1);
    expect(screen.queryByRole('button', { current: 'page' })).not.toBeInTheDocument();
    for (const control of screen.getAllByRole('button')) expect(control).toBeDisabled();
  });

  it('normalizes invalid page values and honors the disabled input', async () => {
    const { fixture } = await render(PaginationHost);
    const host = fixture.componentInstance;
    host.page.set(Number.NaN);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(1);
    host.disabled.set(true);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    expect(host.page()).toBe(1);
  });

  it('moves focus to the active page when focused Next becomes disabled', async () => {
    const { fixture } = await render(PaginationHost);
    const host = fixture.componentInstance;
    host.page.set(2);
    fixture.detectChanges();
    const next = screen.getByRole('button', { name: 'Next page' });
    next.focus();
    fireEvent.click(next);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(host.page()).toBe(3);
    expect(next).toBeDisabled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Page 3' }));
  });
});
