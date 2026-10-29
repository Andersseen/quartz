import { signal, untracked, type Signal, type WritableSignal } from '@angular/core';
import { ReplaySubject } from 'rxjs';

/**
 * Lifecycle of a dialog panel, mirrored on the panel as `data-state` for consumer CSS:
 * `opening` (mounted, enter styles) → `open` → `closing` (exit transition running, only with
 * `presence`) → `closed` (removed).
 */
export type DialogState = 'opening' | 'open' | 'closing' | 'closed';

export class DialogRef {
  /**
   * `ReplaySubject(1)` on purpose: a dialog is one-shot, so code that subscribes after
   * the dialog already closed (a late `await firstValueFrom(closed$)`, an async guard)
   * must still learn about it instead of hanging forever.
   * `OverlayRef` is reusable and deliberately uses a plain `Subject` — see its comment.
   */
  #closed$ = new ReplaySubject<void>(1);
  /** Emits once, after the panel has been removed (after the exit transition, if any). */
  readonly closed$ = this.#closed$.asObservable();

  readonly #state: WritableSignal<DialogState>;
  /** Current lifecycle state. */
  readonly state: Signal<DialogState>;

  #isClosed = false;
  #completed = false;

  /**
   * @param onCloseFn Tears the dialog down. It receives `complete`, and returns `true` when the
   * teardown is deferred (an exit transition is running) and `complete` will be called later;
   * otherwise `closed$` fires as soon as it returns.
   */
  constructor(
    private onCloseFn: (complete: () => void) => boolean | void,
    state: WritableSignal<DialogState> = signal<DialogState>('open'),
  ) {
    this.#state = state;
    this.state = state.asReadonly();
  }

  /**
   * Closes the dialog. Safe to call multiple times.
   */
  close(): void {
    if (this.#isClosed) return;
    this.#isClosed = true;
    this.#state.set('closing');
    let deferred = false;
    try {
      deferred = this.onCloseFn(() => this.#complete()) === true;
    } catch (error) {
      // Teardown that throws must still notify: `closed$` fires exactly once per dialog.
      this.#complete();
      throw error;
    }
    if (!deferred) this.#complete();
  }

  #complete(): void {
    if (this.#completed) return;
    this.#completed = true;
    this.#state.set('closed');
    // `untracked`: a dialog can close while Angular is rendering (its host view was removed),
    // and subscribers must still be allowed to write signals from `closed$`.
    untracked(() => {
      this.#closed$.next();
      this.#closed$.complete();
    });
  }
}
