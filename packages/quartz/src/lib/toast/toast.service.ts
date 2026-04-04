import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  Toast,
  ToastOptions,
  ToastPosition,
  DEFAULT_TOAST_OPTIONS,
} from './toast.model';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

@Injectable({ providedIn: 'root' })
export class ToastService implements OnDestroy {
  private document = inject(DOCUMENT);

  private _toasts = signal<Toast[]>([]);
  private _isInitialized = signal(false);

  readonly toasts = computed(() => this._toasts());
  readonly isInitialized = computed(() => this._isInitialized());

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
    this._toasts().forEach((toast) => {
      const list = grouped.get(toast.position) || [];
      list.push(toast);
      grouped.set(toast.position, list);
    });

    return grouped;
  });

  private timerId: number | null = null;

  constructor() {
    this.startTimer();
  }

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

    this._toasts.update((toasts) => [...toasts, toast]);
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
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this._toasts.set([]);
  }

  pause(id: string): void {
    this._toasts.update((toasts) =>
      toasts.map((t) => (t.id === id ? { ...t, isPaused: true } : t)),
    );
  }

  resume(id: string): void {
    this._toasts.update((toasts) =>
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

  private startTimer(): void {
    const TICK = 100;

    this.timerId = window.setInterval(() => {
      this._toasts.update((toasts) => {
        const now = new Date().getTime();

        return toasts
          .map((toast) => {
            if (toast.isPaused || toast.duration === 0) {
              if (toast.isPaused) {
                return {
                  ...toast,
                  createdAt: new Date(now - (toast.duration - toast.remainingTime)),
                };
              }
              return toast;
            }

            const elapsed = now - toast.createdAt.getTime();
            const remaining = Math.max(0, toast.duration - elapsed);

            return { ...toast, remainingTime: remaining };
          })
          .filter((toast) => toast.duration === 0 || toast.remainingTime > 0);
      });
    }, TICK);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }
}
