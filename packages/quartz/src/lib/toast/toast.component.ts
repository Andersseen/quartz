import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Toast } from './toast.model';

@Component({
  selector: 'qz-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="qz-toast"
      [class]="'qz-toast--' + toast().type"
      role="alert"
      [attr.aria-live]="toast().type === 'error' ? 'assertive' : 'polite'"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      @if (toast().showProgress && toast().duration > 0) {
        <div class="qz-toast__progress">
          <div class="qz-toast__progress-bar" [style.width.%]="progress()"></div>
        </div>
      }

      <div class="qz-toast__content">
        @if (toast().title) {
          <div class="qz-toast__title">{{ toast().title }}</div>
        }
        <div class="qz-toast__message">{{ toast().message }}</div>
      </div>

      @if (toast().closable) {
        <button
          type="button"
          class="qz-toast__close"
          (click)="dismiss.emit()"
          aria-label="Close notification"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      }
    </div>
  `,
  host: {
    '[class.qz-toast-wrapper]': 'true',
  },
})
export class ToastComponent {
  toast = input.required<Toast>();
  dismiss = output<void>();
  qzPause = output<void>();
  qzResume = output<void>();

  progress = input<number>(100);

  onMouseEnter(): void {
    if (this.toast().pauseOnHover) {
      this.qzPause.emit();
    }
  }

  onMouseLeave(): void {
    if (this.toast().pauseOnHover) {
      this.qzResume.emit();
    }
  }
}
