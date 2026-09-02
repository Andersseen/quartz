import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Toast,
  ToastOptions,
  ToastPosition,
  ALL_TOAST_POSITIONS,
  DEFAULT_TOAST_OPTIONS,
} from './toast.types';

let toastIdCounter = 0;

/** Monotonic ids: `track toast.id` breaks if two live toasts ever collide. */
function generateId(): string {
  return `qz-toast-${++toastIdCounter}`;
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private document = inject(DOCUMENT);

  #toasts = signal<Toast[]>([]);

  readonly toasts = computed(() => this.#toasts());

  readonly toastsByPosition = computed(() => {
    const grouped = new Map<ToastPosition, Toast[]>();

    ALL_TOAST_POSITIONS.forEach((pos) => grouped.set(pos, []));
    this.#toasts().forEach((toast) => {
      const list = grouped.get(toast.position) || [];
      list.push(toast);
      grouped.set(toast.position, list);
    });

    return grouped;
  });

  private timerId: number | null = null;

  show(options: ToastOptions): string {
    const id = generateId();
    const mergedOptions = { ...DEFAULT_TOAST_OPTIONS, ...options };

    const toast: Toast = {
      id,
      type: mergedOptions.type,
      title: mergedOptions.title,
      message: mergedOptions.message,
      duration: mergedOptions.duration,
      position: mergedOptions.position,
      closable: mergedOptions.closable,
      pauseOnHover: mergedOptions.pauseOnHover,
      showProgress: mergedOptions.showProgress,
      createdAt: new Date(),
      remainingTime: mergedOptions.duration,
      isPaused: false,
    };

    this.#toasts.update((toasts) => [...toasts, toast]);
    this.#ensureTimer();
    return id;
  }

  success(
    message: string,
    title?: string,
    options?: Omit<ToastOptions, 'type' | 'message' | 'title'>,
  ): string {
    return this.show({ type: 'success', message, title, ...options });
  }

  error(
    message: string,
    title?: string,
    options?: Omit<ToastOptions, 'type' | 'message' | 'title'>,
  ): string {
    return this.show({ type: 'error', message, title, ...options });
  }

  warning(
    message: string,
    title?: string,
    options?: Omit<ToastOptions, 'type' | 'message' | 'title'>,
  ): string {
    return this.show({ type: 'warning', message, title, ...options });
  }

  info(
    message: string,
    title?: string,
    options?: Omit<ToastOptions, 'type' | 'message' | 'title'>,
  ): string {
    return this.show({ type: 'info', message, title, ...options });
  }

  dismiss(id: string): void {
    this.#toasts.update((toasts) => toasts.filter((t) => t.id !== id));
    this.#stopTimerIfNoWork();
  }

  dismissAll(): void {
    this.#toasts.set([]);
    this.#stopTimerIfNoWork();
  }

  pause(id: string): void {
    this.#toasts.update((toasts) =>
      toasts.map((t) => (t.id === id ? { ...t, isPaused: true } : t)),
    );
    this.#stopTimerIfNoWork();
  }

  resume(id: string): void {
    this.#toasts.update((toasts) =>
      toasts.map((t) => {
        if (t.id !== id) return t;

        const elapsed = t.duration - t.remainingTime;
        const newCreatedAt = new Date(Date.now() - elapsed);

        return {
          ...t,
          isPaused: false,
          createdAt: newCreatedAt,
        };
      }),
    );
    // Resuming a toast can reintroduce active countdown work after the timer was stopped
    // (e.g. it was the only non-persistent toast and had been paused).
    this.#ensureTimer();
  }

  /** Is there at least one toast whose countdown actually needs ticking? A persistent
   * (`duration: 0`) toast never does, and a paused toast doesn't while paused — so a
   * persistent-only or fully-paused toast list must never keep the interval alive. */
  #hasActiveWork(toasts: Toast[] = this.#toasts()): boolean {
    return toasts.some((toast) => toast.duration > 0 && !toast.isPaused);
  }

  #ensureTimer(): void {
    // SSR guard: do not start timers when there is no browser window. Also don't start
    // (or keep) a timer when there's no active countdown work to do.
    if (!this.document.defaultView || this.timerId !== null || !this.#hasActiveWork()) {
      return;
    }

    const TICK = 100;
    const view = this.document.defaultView;

    this.timerId = view.setInterval(() => {
      const toasts = this.#toasts();
      const now = Date.now();
      let changed = false;

      const remaining = toasts
        .map((toast) => {
          if (toast.isPaused || toast.duration === 0) return toast;

          const elapsed = now - toast.createdAt.getTime();
          const remainingTime = Math.max(0, toast.duration - elapsed);
          if (remainingTime === toast.remainingTime) return toast;

          changed = true;
          return { ...toast, remainingTime };
        })
        .filter((toast) => toast.duration === 0 || toast.remainingTime > 0);

      if (remaining.length !== toasts.length) changed = true;
      // Only write the signal when something actually changed — a tick where every
      // toast is paused or persistent, or where nothing crossed a boundary, should not
      // force a recompute/re-render of toasts()/toastsByPosition() for no reason.
      if (changed) this.#toasts.set(remaining);

      // Safe to clear the interval from within its own callback; and since `remaining` is
      // already the up-to-date value (whether or not it was just written), no deferral is
      // needed to avoid reading a stale signal.
      if (!this.#hasActiveWork(remaining)) this.#stopTimerIfNoWork();
    }, TICK);
  }

  #stopTimerIfNoWork(): void {
    if (!this.#hasActiveWork() && this.timerId !== null) {
      this.document.defaultView?.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy(): void {
    if (this.timerId !== null) {
      this.document.defaultView?.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
