import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ToastService } from './toast.service';
import { ToastComponent } from './toast.component';
import { ToastPosition, Toast } from './toast.model';

@Component({
  selector: 'qz-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToastComponent],
  template: `
    @for (position of positions; track position) {
      <div
        class="qz-toast-container"
        [class]="'qz-toast-container--' + position"
        [attr.aria-live]="position.startsWith('top') ? 'assertive' : 'polite'"
        [attr.aria-atomic]="'false'"
      >
        @for (toast of getToastsForPosition(position)(); track toast.id) {
          <qz-toast
            [toast]="toast"
            [progress]="calculateProgress(toast)"
            (dismiss)="toastService.dismiss(toast.id)"
            (pause)="toastService.pause(toast.id)"
            (resume)="toastService.resume(toast.id)"
          />
        }
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
    }
    
    .qz-toast-container {
      position: fixed;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      max-width: 400px;
      pointer-events: auto;
    }
    
    .qz-toast-container--top-left {
      top: 0;
      left: 0;
    }
    
    .qz-toast-container--top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .qz-toast-container--top-right {
      top: 0;
      right: 0;
    }
    
    .qz-toast-container--bottom-left {
      bottom: 0;
      left: 0;
      flex-direction: column-reverse;
    }
    
    .qz-toast-container--bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      flex-direction: column-reverse;
    }
    
    .qz-toast-container--bottom-right {
      bottom: 0;
      right: 0;
      flex-direction: column-reverse;
    }
  `],
  host: {
    '[class.qz-toast-portal]': 'true',
  }
})
export class ToastContainerComponent {
  protected toastService = inject(ToastService);
  
  positions: ToastPosition[] = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  getToastsForPosition(position: ToastPosition) {
    return computed(() => 
      this.toastService.toasts().filter((t: Toast) => t.position === position)
    );
  }

  calculateProgress(toast: { duration: number; remainingTime: number }): number {
    if (toast.duration === 0) return 100;
    return (toast.remainingTime / toast.duration) * 100;
  }
}