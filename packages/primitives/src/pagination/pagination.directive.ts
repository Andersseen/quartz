import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { focusSafely } from '@quartz-headless/core';
import { DEFAULT_PAGINATION_CONFIG } from './pagination.types';

@Directive({
  selector: '[qzPagination]',
  exportAs: 'qzPagination',
  standalone: true,
  host: {
    '[attr.role]': '"navigation"',
    '[attr.data-qz-pagination]': '""',
  },
})
export class PaginationDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private destroyed = false;
  private readonly recoverFocus = signal(false);

  readonly page = model(DEFAULT_PAGINATION_CONFIG.page);
  readonly pageCount = input(DEFAULT_PAGINATION_CONFIG.pageCount, { transform: normalizeCount });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly currentPage = computed(() =>
    this.pageCount() === 0 ? null : normalizePage(this.page(), this.pageCount()),
  );
  readonly isDisabled = computed(() => this.disabled() || this.pageCount() === 0);

  constructor() {
    afterRenderEffect(() => {
      const count = this.pageCount();
      const page = this.page();
      const pending = this.recoverFocus();
      const normalized = normalizePage(page, count);
      if (page !== normalized) this.page.set(normalized);
      if (!pending || this.destroyed) return;
      const current = this.elementRef.nativeElement.querySelector(
        '[aria-current="page"]',
      ) as HTMLElement | null;
      const target = current ?? this.elementRef.nativeElement;
      if (!current && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      focusSafely(target);
      this.recoverFocus.set(false);
    });
  }

  setPage(page: number, action?: 'first' | 'previous' | 'next' | 'last', event?: Event): void {
    if (this.isDisabled()) return;
    const next = normalizePage(page, this.pageCount());
    const active = this.document.activeElement;
    const boundary =
      (action === 'next' && next === this.pageCount()) || (action === 'previous' && next === 1);
    const eventTarget = event?.currentTarget;
    const focusedControl =
      (eventTarget instanceof HTMLElement
        ? eventTarget.closest('[data-qz-pagination-action]')
        : null) ??
      active?.closest('[data-qz-pagination-action]') ??
      null;
    const activeAction = focusedControl?.getAttribute('data-qz-pagination-action');
    if (boundary && activeAction === action) this.recoverFocus.set(true);
    this.page.set(next);
  }

  first(event?: Event): void {
    this.setPage(1, 'first', event);
  }

  previous(event?: Event): void {
    this.setPage(this.page() - 1, 'previous', event);
  }

  next(event?: Event): void {
    this.setPage(this.page() + 1, 'next', event);
  }

  last(event?: Event): void {
    this.setPage(this.pageCount(), 'last', event);
  }

  controlDisabled(action: 'first' | 'previous' | 'next' | 'last'): boolean {
    if (this.isDisabled()) return true;
    const page = this.currentPage();
    return action === 'first' || action === 'previous' ? page === 1 : page === this.pageCount();
  }

  pageDisabled(): boolean {
    return this.isDisabled();
  }

  isCurrent(page: number): boolean {
    return this.currentPage() === page;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }
}

@Directive({
  selector: 'button[qzPaginationFirst]',
  exportAs: 'qzPaginationFirst',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': '"First page"',
    '[disabled]': 'pagination.controlDisabled("first")',
    '[attr.data-qz-pagination-action]': '"first"',
    '(click)': 'pagination.first($event)',
  },
})
export class PaginationFirstDirective {
  protected readonly pagination = inject(PaginationDirective);
}

@Directive({
  selector: 'button[qzPaginationPrevious]',
  exportAs: 'qzPaginationPrevious',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': '"Previous page"',
    '[disabled]': 'pagination.controlDisabled("previous")',
    '[attr.data-qz-pagination-action]': '"previous"',
    '(click)': 'pagination.previous($event)',
  },
})
export class PaginationPreviousDirective {
  protected readonly pagination = inject(PaginationDirective);
}

@Directive({
  selector: 'button[qzPaginationNext]',
  exportAs: 'qzPaginationNext',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': '"Next page"',
    '[disabled]': 'pagination.controlDisabled("next")',
    '[attr.data-qz-pagination-action]': '"next"',
    '(click)': 'pagination.next($event)',
  },
})
export class PaginationNextDirective {
  protected readonly pagination = inject(PaginationDirective);
}

@Directive({
  selector: 'button[qzPaginationLast]',
  exportAs: 'qzPaginationLast',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': '"Last page"',
    '[disabled]': 'pagination.controlDisabled("last")',
    '[attr.data-qz-pagination-action]': '"last"',
    '(click)': 'pagination.last($event)',
  },
})
export class PaginationLastDirective {
  protected readonly pagination = inject(PaginationDirective);
}

@Directive({
  selector: 'button[qzPaginationPage]',
  exportAs: 'qzPaginationPage',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': 'pageLabel()',
    '[attr.aria-current]': 'pagination.isCurrent(page()) ? "page" : null',
    '[disabled]': 'pagination.pageDisabled()',
    '(click)': 'pagination.setPage(page())',
  },
})
export class PaginationPageDirective {
  protected readonly pagination = inject(PaginationDirective);
  readonly page = input.required<number>({ alias: 'qzPaginationPage' });

  pageLabel(): string {
    return `Page ${this.page()}`;
  }
}

function normalizeCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function normalizePage(value: number, count: number): number {
  if (!Number.isFinite(value)) return 1;
  return count === 0 ? 1 : Math.min(count, Math.max(1, Math.floor(value)));
}
