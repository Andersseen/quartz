import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type CopyStatus = 'idle' | 'copied' | 'failed' | 'unsupported';

/** How long a result stays visible before the control returns to `idle`. */
export const COPY_FEEDBACK_MS = 2000;

/**
 * Copies text and reports the real outcome as signals for one control. A command is only reported
 * as `copied` after the Clipboard API promise resolves; a rejection is `failed` and a missing API
 * is `unsupported`. Repeated clicks restart one timer, and the timer is cleared on teardown.
 * Provide it on the component (`providers: [ClipboardCopy]`) so state and teardown are per control.
 */
@Injectable()
export class ClipboardCopy {
  private readonly document = inject(DOCUMENT);
  private readonly status$ = signal<CopyStatus>('idle');
  private readonly copiedText$ = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;
  private generation = 0;

  readonly status = this.status$.asReadonly();
  /** The text most recently copied successfully, while the `copied` state is showing. */
  readonly copiedText = this.copiedText$.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.clearTimer();
    });
  }

  async copy(text: string): Promise<CopyStatus> {
    const run = ++this.generation;
    const clipboard = this.document.defaultView?.navigator?.clipboard;
    let result: CopyStatus;
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      result = 'unsupported';
    } else {
      try {
        await clipboard.writeText(text);
        result = 'copied';
      } catch {
        result = 'failed';
      }
    }
    // Ignore a stale completion (a newer click superseded it) and a destroyed control.
    if (this.destroyed || run !== this.generation) return result;
    this.copiedText$.set(result === 'copied' ? text : null);
    this.status$.set(result);
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.status$.set('idle');
      this.copiedText$.set(null);
    }, COPY_FEEDBACK_MS);
    return result;
  }

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
  }
}
