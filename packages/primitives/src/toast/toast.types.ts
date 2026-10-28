import type { TemplateRef, Type } from '@angular/core';
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export const ALL_TOAST_POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];
export interface ToastAction {
  label: string;
  run: () => void;
  dismiss?: boolean;
}
export interface ToastContentContext {
  toast: Toast;
  dismiss: () => void;
}
export interface ToastTemplateContext extends ToastContentContext {
  $implicit: Toast;
}
export interface ToastContentComponent {
  context: ToastContentContext;
}
export interface ToastOptions {
  type?: ToastType;
  title?: string;
  message?: string;
  content?: TemplateRef<ToastTemplateContext> | Type<ToastContentComponent>;
  actions?: readonly ToastAction[];
  duration?: number;
  position?: ToastPosition;
  closable?: boolean;
  pauseOnHover?: boolean;
  showProgress?: boolean;
  maxVisible?: number;
}
export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  content?: TemplateRef<ToastTemplateContext> | Type<ToastContentComponent>;
  actions: readonly ToastAction[];
  duration: number;
  position: ToastPosition;
  closable: boolean;
  pauseOnHover: boolean;
  showProgress: boolean;
  maxVisible: number;
  createdAt: Date;
  remainingTime: number;
  isPaused: boolean;
}
export const DEFAULT_TOAST_OPTIONS: Required<
  Omit<ToastOptions, 'title' | 'message' | 'content' | 'actions'>
> = {
  type: 'info',
  duration: 5000,
  position: 'bottom-right',
  closable: true,
  pauseOnHover: true,
  showProgress: true,
  maxVisible: 5,
};
