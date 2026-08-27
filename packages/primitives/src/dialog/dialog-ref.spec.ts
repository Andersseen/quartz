import { describe, it, expect, vi } from 'vitest';
import { DialogRef } from './dialog-ref';

describe('DialogRef', () => {
  it('should run the close callback only once', () => {
    const onClose = vi.fn();
    const ref = new DialogRef(onClose);

    ref.close();
    ref.close();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should replay closed$ to subscribers that arrive after the close', () => {
    // A dialog is one-shot: code awaiting `closed$` after the fact (an async guard, a
    // late `firstValueFrom`) must still complete instead of hanging. `OverlayRef` is
    // reusable and deliberately does not replay.
    const ref = new DialogRef(() => void 0);
    ref.close();

    let closed = false;
    let completed = false;
    ref.closed$.subscribe({
      next: () => (closed = true),
      complete: () => (completed = true),
    });

    expect(closed).toBe(true);
    expect(completed).toBe(true);
  });
});
