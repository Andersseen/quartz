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
      <h1>Toast Demo</h1>

      <section>
        <h2>Basic Toasts</h2>
        <div class="button-group">
          <button (click)="showSuccess()" class="btn btn-success">
            Show Success
          </button>
          <button (click)="showError()" class="btn btn-error">Show Error</button>
          <button (click)="showWarning()" class="btn btn-warning">
            Show Warning
          </button>
          <button (click)="showInfo()" class="btn btn-info">Show Info</button>
        </div>
      </section>

      <section>
        <h2>Positions</h2>
        <div class="button-group">
          <button (click)="showAtPosition('top-left')" class="btn">
            Top Left
          </button>
          <button (click)="showAtPosition('top-center')" class="btn">
            Top Center
          </button>
          <button (click)="showAtPosition('top-right')" class="btn">
            Top Right
          </button>
          <button (click)="showAtPosition('bottom-left')" class="btn">
            Bottom Left
          </button>
          <button (click)="showAtPosition('bottom-center')" class="btn">
            Bottom Center
          </button>
          <button (click)="showAtPosition('bottom-right')" class="btn">
            Bottom Right
          </button>
        </div>
      </section>

      <section>
        <h2>Custom Duration</h2>
        <div class="button-group">
          <button (click)="showWithDuration(1000)" class="btn">1 Second</button>
          <button (click)="showWithDuration(5000)" class="btn">5 Seconds</button>
          <button (click)="showWithDuration(10000)" class="btn">10 Seconds</button>
          <button (click)="showPersistent()" class="btn">Persistent (no auto-dismiss)</button>
        </div>
      </section>

      <section>
        <h2>With Title</h2>
        <button (click)="showWithTitle()" class="btn">Show Toast with Title</button>
      </section>

      <section>
        <h2>Actions</h2>
        <div class="button-group">
          <button (click)="dismissAll()" class="btn btn-secondary">
            Dismiss All
          </button>
        </div>
      </section>
    </div>

    <!-- Toast Container - Place this at the root of your app -->
    <qz-toast-container />
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    section {
      margin-bottom: 40px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    h1, h2 {
      margin-bottom: 16px;
    }

    .button-group {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      background: #2196f3;
      color: white;
      transition: background 0.2s;
    }

    .btn:hover {
      background: #1976d2;
    }

    .btn-success {
      background: #4caf50;
    }

    .btn-success:hover {
      background: #388e3c;
    }

    .btn-error {
      background: #f44336;
    }

    .btn-error:hover {
      background: #d32f2f;
    }

    .btn-warning {
      background: #ff9800;
    }

    .btn-warning:hover {
      background: #f57c00;
    }

    .btn-info {
      background: #2196f3;
    }

    .btn-info:hover {
      background: #1976d2;
    }

    .btn-secondary {
      background: #757575;
    }

    .btn-secondary:hover {
      background: #616161;
    }
  `],
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
    this.toastService.success(
      'Your changes have been saved successfully.',
      'Changes Saved'
    );
  }

  dismissAll(): void {
    this.toastService.dismissAll();
  }
}
