import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Toast, ToastOptions, ToastPosition, DEFAULT_TOAST_OPTIONS } from './toast.model';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private document = inject(DOCUMENT);

  #toasts = signal<Toast[]>([]);
  #isInitialized = signal(false);

  readonly toasts = computed(() => this.#toasts());
  readonly isInitialized = computed(() => this.#isInitialized());

  readonly toastsByPosition = computed(() => {
    const grouped = new Map<ToastPosition, Toast[]>();
    const positions: ToastPosition[] = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ];

    positions.forEach((pos) => grouped.set(pos, []));
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
    this.#stopTimerIfEmpty();
  }

  dismissAll(): void {
    this.#toasts.set([]);
    this.#stopTimerIfEmpty();
  }

  pause(id: string): void {
    this.#toasts.update((toasts) =>
      toasts.map((t) => (t.id === id ? { ...t, isPaused: true } : t)),
    );
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
  }

  #ensureTimer(): void {
    // SSR guard: do not start timers when there is no browser window.
    if (!this.document.defaultView || this.timerId !== null) {
      return;
    }

    const TICK = 100;
    const view = this.document.defaultView;

    this.timerId = view.setInterval(() => {
      this.#toasts.update((toasts) => {
        const now = new Date().getTime();

        const remaining = toasts
          .map((toast) => {
            if (toast.isPaused || toast.duration === 0) return toast;

            const elapsed = now - toast.createdAt.getTime();
            const remainingTime = Math.max(0, toast.duration - elapsed);

            return { ...toast, remainingTime };
          })
          .filter((toast) => toast.duration === 0 || toast.remainingTime > 0);

        // Stop the timer lazily when there is nothing left to count down.
        if (remaining.length === 0) {
          queueMicrotask(() => this.#stopTimerIfEmpty());
        }

        return remaining;
      });
    }, TICK);
  }

  #stopTimerIfEmpty(): void {
    if (this.#toasts().length === 0 && this.timerId !== null) {
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
