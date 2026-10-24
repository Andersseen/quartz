import { DestroyRef, inject } from '@angular/core';

export interface LatestRequest {
  /**
   * Runs `task` as the current request. Any earlier request is aborted (its `AbortSignal` fires)
   * and its result is discarded even if the task ignores the signal. Resolves with the result,
   * or `undefined` when the request was superseded, cancelled or aborted.
   */
  run<R>(task: (signal: AbortSignal) => Promise<R>): Promise<R | undefined>;
  /** Aborts the in-flight request, if any. Called automatically when the owner is destroyed. */
  cancel(): void;
}

/**
 * Stale-response guard for consumer-owned searches. Quartz cannot cancel network work it does not
 * start, so the consumer starts it through `run()`: pass the provided signal to `fetch` and only
 * the latest request can ever resolve with a value. Must be called in an injection context; the
 * in-flight request is aborted on destroy.
 */
export function createLatestRequest(): LatestRequest {
  let current: AbortController | null = null;
  const cancel = (): void => {
    current?.abort();
    current = null;
  };
  inject(DestroyRef).onDestroy(cancel);
  return {
    cancel,
    async run<R>(task: (signal: AbortSignal) => Promise<R>): Promise<R | undefined> {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      try {
        const result = await task(controller.signal);
        return controller.signal.aborted ? undefined : result;
      } catch (error) {
        if (controller.signal.aborted) return undefined;
        throw error;
      } finally {
        if (current === controller) current = null;
      }
    },
  };
}
