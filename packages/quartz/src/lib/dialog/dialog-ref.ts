import { ReplaySubject } from 'rxjs';

export class DialogRef {
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
