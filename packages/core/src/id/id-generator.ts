import { Injectable } from '@angular/core';

/**
 * Application-scoped generator for DOM ids.
 *
 * A module-level counter is shared by every Angular application in the same JavaScript realm. In
 * SSR that is the whole server process, so each request would continue numbering where the previous
 * one stopped: the server HTML would differ between identical requests and from what the client
 * renders after hydration. This service is `providedIn: 'root'`, so every application (every SSR
 * request) gets its own counters, and ids depend only on render order.
 *
 * Counters are kept per prefix, so mounting an unrelated primitive never renumbers another one.
 */
@Injectable({ providedIn: 'root' })
export class QzIdGenerator {
  readonly #counters = new Map<string, number>();

  /** Returns `<prefix>-<n>` with `n` starting at 1 for each prefix within this application. */
  next(prefix: string): string {
    const n = (this.#counters.get(prefix) ?? 0) + 1;
    this.#counters.set(prefix, n);
    return `${prefix}-${n}`;
  }
}
