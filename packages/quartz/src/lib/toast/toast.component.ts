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
          <div 
            class="qz-toast__progress-bar" 
            [style.width.%]="progress()"
          ></div>
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
  styles: [`
    :host {
      display: block;
    }
    
    .qz-toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      background: white;
      border-left: 4px solid #ccc;
      min-width: 300px;
      max-width: 400px;
      position: relative;
      overflow: hidden;
    }
    
    .qz-toast--success {
      border-left-color: #4caf50;
    }
    
    .qz-toast--error {
      border-left-color: #f44336;
    }
    
    .qz-toast--warning {
      border-left-color: #ff9800;
    }
    
    .qz-toast--info {
      border-left-color: #2196f3;
    }
    
    .qz-toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
    }
    
    .qz-toast__progress-bar {
      height: 100%;
      background: currentColor;
      opacity: 0.3;
      transition: width 0.1s linear;
    }
    
    .qz-toast--success .qz-toast__progress-bar {
      color: #4caf50;
    }
    
    .qz-toast--error .qz-toast__progress-bar {
      color: #f44336;
    }
    
    .qz-toast--warning .qz-toast__progress-bar {
      color: #ff9800;
    }
    
    .qz-toast--info .qz-toast__progress-bar {
      color: #2196f3;
    }
    
    .qz-toast__content {
      flex: 1;
      min-width: 0;
    }
    
    .qz-toast__title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
      color: #333;
    }
    
    .qz-toast__message {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    
    .qz-toast__close {
      background: none;
      border: none;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      margin: -4px -4px -4px 0;
      color: #999;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }
    
    .qz-toast__close:hover {
      background: rgba(0, 0, 0, 0.05);
      color: #333;
    }
  `],
  host: {
    '[class.qz-toast-wrapper]': 'true',
  }
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