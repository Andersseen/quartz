import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { resolveDirection } from './directionality';
import type { Direction } from './directionality.types';

/**
 * Root-level reactive source of truth for the document's text direction.
 *
 * Resolved once at construction from `document.documentElement` (SSR-safe: the
 * resolution is pure attribute-walking, see `resolveDirection`, so it needs no
 * `defaultView` guard). Quartz does not watch for `dir` mutations with a
 * `MutationObserver` — that's deliberately out of scope for this foundation.
 * Call `refresh()` after changing `dir` on the document yourself, or `set()`
 * to override the value directly (e.g. an app-level RTL toggle that doesn't
 * touch the DOM at all).
 */
@Injectable({ providedIn: 'root' })
export class DirectionalityService {
  private readonly document = inject(DOCUMENT);

  #direction = signal<Direction>('ltr');

  /** The current document-level direction. */
  readonly direction = this.#direction.asReadonly();

  constructor() {
    this.refresh();
  }

  /** Re-reads direction from `document.documentElement`. */
  refresh(): void {
    this.#direction.set(resolveDirection(this.document.documentElement));
  }

  /** Resolves the effective direction for a specific element's subtree, without changing `direction`. */
  resolve(element?: Element | null): Direction {
    return element ? resolveDirection(element) : this.direction();
  }

  /** Explicitly overrides the tracked direction. */
  set(direction: Direction): void {
    this.#direction.set(direction);
  }
}
