import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  ToastService,
  ToastContainerComponent,
  ToastPosition,
} from '../../../../packages/quartz/src/lib/toast';

@Component({
  selector: 'app-toast-demo',
  standalone: true,
  imports: [ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container">
      <h1 class="demo-title">Toast Demo</h1>

      <section class="demo-section">
        <h2 class="demo-subtitle">Basic Toasts</h2>
        <div class="button-group">
          <button (click)="showSuccess()" class="btn btn-success">Show Success</button>
          <button (click)="showError()" class="btn btn-error">Show Error</button>
          <button (click)="showWarning()" class="btn btn-warning">Show Warning</button>
          <button (click)="showInfo()" class="btn btn-info">Show Info</button>
        </div>
      </section>

      <section class="demo-section">
        <h2 class="demo-subtitle">Positions</h2>
        <div class="button-group">
          <button (click)="showAtPosition('top-left')" class="btn btn-outline">Top Left</button>
          <button (click)="showAtPosition('top-center')" class="btn btn-outline">Top Center</button>
          <button (click)="showAtPosition('top-right')" class="btn btn-outline">Top Right</button>
          <button (click)="showAtPosition('bottom-left')" class="btn btn-outline">
            Bottom Left
          </button>
          <button (click)="showAtPosition('bottom-center')" class="btn btn-outline">
            Bottom Center
          </button>
          <button (click)="showAtPosition('bottom-right')" class="btn btn-outline">
            Bottom Right
          </button>
        </div>
      </section>

      <section class="demo-section">
        <h2 class="demo-subtitle">Custom Duration</h2>
        <div class="button-group">
          <button (click)="showWithDuration(1000)" class="btn btn-outline">1 Second</button>
          <button (click)="showWithDuration(5000)" class="btn btn-outline">5 Seconds</button>
          <button (click)="showWithDuration(10000)" class="btn btn-outline">10 Seconds</button>
          <button (click)="showPersistent()" class="btn btn-outline">
            Persistent (no auto-dismiss)
          </button>
        </div>
      </section>

      <section class="demo-section">
        <h2 class="demo-subtitle">With Title</h2>
        <button (click)="showWithTitle()" class="btn btn-primary">Show Toast with Title</button>
      </section>

      <section class="demo-section">
        <h2 class="demo-subtitle">Actions</h2>
        <button (click)="dismissAll()" class="btn btn-secondary">Dismiss All</button>
      </section>
    </div>

    <qz-toast-container />
  `,
  styles: [
    `
      .demo-container {
        padding: 2rem;
        max-width: 72rem;
        margin: 0 auto;
      }

      .demo-title {
        font-size: 1.875rem;
        font-weight: 700;
        margin-bottom: 2rem;
        color: #111827;
      }

      .demo-section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
      }

      .demo-subtitle {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #1f2937;
      }

      .button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .btn {
        padding: 0.625rem 1.25rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        font-size: 0.875rem;
      }

      .btn:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
      }

      .btn-primary {
        background-color: #2563eb;
        color: white;
      }

      .btn-primary:hover {
        background-color: #1d4ed8;
      }

      .btn-secondary {
        background-color: #4b5563;
        color: white;
      }

      .btn-secondary:hover {
        background-color: #374151;
      }

      .btn-success {
        background-color: #16a34a;
        color: white;
      }

      .btn-success:hover {
        background-color: #15803d;
      }

      .btn-error {
        background-color: #dc2626;
        color: white;
      }

      .btn-error:hover {
        background-color: #b91c1c;
      }

      .btn-warning {
        background-color: #d97706;
        color: white;
      }

      .btn-warning:hover {
        background-color: #b45309;
      }

      .btn-info {
        background-color: #2563eb;
        color: white;
      }

      .btn-info:hover {
        background-color: #1d4ed8;
      }

      .btn-outline {
        background-color: white;
        color: #374151;
        border: 2px solid #d1d5db;
      }

      .btn-outline:hover {
        border-color: #9ca3af;
        background-color: #f9fafb;
      }
    `,
  ],
})
export class ToastDemoComponent {
  private toastService = inject(ToastService);

  showSuccess(): void {
    this.toastService.success('Operation completed successfully!', 'Success');
  }

  showError(): void {
    this.toastService.error('Something went wrong!', 'Error');
  }

  showWarning(): void {
    this.toastService.warning('Please review your input.', 'Warning');
  }

  showInfo(): void {
    this.toastService.info('This is an informational message.', 'Info');
  }

  showAtPosition(position: ToastPosition): void {
    this.toastService.show({
      type: 'info',
      title: 'Position Demo',
      message: `This toast is positioned at ${position}`,
      position,
      duration: 3000,
    });
  }

  showWithDuration(duration: number): void {
    this.toastService.show({
      type: 'info',
      title: 'Duration Demo',
      message: `This toast will disappear in ${duration / 1000} seconds`,
      duration,
    });
  }

  showPersistent(): void {
    this.toastService.show({
      type: 'info',
      title: 'Persistent Toast',
      message: 'This toast will not auto-dismiss. Click the X to close.',
      duration: 0,
      closable: true,
    });
  }

  showWithTitle(): void {
    this.toastService.success('Your changes have been saved successfully.', 'Changes Saved');
  }

  dismissAll(): void {
    this.toastService.dismissAll();
  }
}
