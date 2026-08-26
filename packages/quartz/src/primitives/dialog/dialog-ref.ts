import { ReplaySubject } from 'rxjs';

export class DialogRef {
  /**
   * `ReplaySubject(1)` on purpose: a dialog is one-shot, so code that subscribes after
   * the dialog already closed (a late `await firstValueFrom(closed$)`, an async guard)
   * must still learn about it instead of hanging forever.
   * `OverlayRef` is reusable and deliberately uses a plain `Subject` — see its comment.
   */
  #closed$ = new ReplaySubject<void>(1);
  readonly closed$ = this.#closed$.asObservable();

  #isClosed = false;

  constructor(private onCloseFn: () => void) {}

  /**
   * Closes the dialog. Safe to call multiple times.
   */
  close(): void {
    if (this.#isClosed) return;
    this.#isClosed = true;
    this.onCloseFn();
    this.#closed$.next();
    this.#closed$.complete();
  }
}
