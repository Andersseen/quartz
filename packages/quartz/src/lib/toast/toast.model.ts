export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  position?: ToastPosition;
  closable?: boolean;
  pauseOnHover?: boolean;
  showProgress?: boolean;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  position: ToastPosition;
  closable: boolean;
  pauseOnHover: boolean;
  showProgress: boolean;
  createdAt: Date;
  remainingTime: number;
  isPaused: boolean;
}

export const DEFAULT_TOAST_OPTIONS: Required<Omit<ToastOptions, 'title' | 'message'>> = {
  type: 'info',
  duration: 5000,
  position: 'bottom-right',
  closable: true,
  pauseOnHover: true,
  showProgress: true,
};
