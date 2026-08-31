export interface ScrollLock {
  readonly locked: boolean;
  lock(): void;
  unlock(): void;
  destroy(): void;
}

interface ScrollLockState {
  count: number;
  originalOverflow: string;
}

const states = new WeakMap<Document, ScrollLockState>();

export function createScrollLock(document: Document | null | undefined): ScrollLock {
  let localCount = 0;

  const getState = (): ScrollLockState | null => {
    if (!document?.defaultView || !document.body) return null;
    let state = states.get(document);
    if (!state) {
      state = {
        count: 0,
        originalOverflow: document.body.style.overflow,
      };
      states.set(document, state);
    }
    return state;
  };

  const release = (amount: number): void => {
    if (amount <= 0 || !document?.defaultView || !document.body) return;
    const state = states.get(document);
    if (!state) return;

    state.count = Math.max(0, state.count - amount);
    if (state.count > 0) return;

    document.body.style.overflow = state.originalOverflow;
    states.delete(document);
  };

  return {
    get locked() {
      return localCount > 0;
    },
    lock(): void {
      const state = getState();
      if (!state) return;
      if (state.count === 0) {
        state.originalOverflow = document!.body.style.overflow;
        document!.body.style.overflow = 'hidden';
      }
      state.count += 1;
      localCount += 1;
    },
    unlock(): void {
      if (localCount === 0) return;
      localCount -= 1;
      release(1);
    },
    destroy(): void {
      const amount = localCount;
      localCount = 0;
      release(amount);
    },
  };
}
