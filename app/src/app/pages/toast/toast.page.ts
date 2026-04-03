import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ToastService, ToastContainerComponent, type ToastPosition } from 'quartz';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';

@Component({
  selector: 'app-toast-page',
  imports: [ToastContainerComponent, DemoPageComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-page
      badge="Feedback"
      title="Toast"
      description="Notification system with multiple positions, durations, and action support. Keep users informed without interrupting their workflow."
      [features]="[
        { title: '6 Positions', description: 'All corners + centers' },
        { title: 'Auto-dismiss', description: 'Configurable duration' },
        { title: 'Persistent', description: 'Manual close option' },
        { title: 'Actions', description: 'Button support' },
      ]"
    >
      <div class="demos">
        <!-- Basic Types -->
        <section class="demo-section">
          <h2 class="demo-section__title">Toast Types</h2>
          <p class="demo-section__desc">
            Four built-in types with distinct colors and icons: Success, Error, Warning, and Info.
          </p>

          <app-code-block [code]="typesCode">
            <div preview class="demo-preview demo-preview--row">
              <button (click)="showSuccess()" class="btn btn--success">
                <span>✓</span> Success
              </button>
              <button (click)="showError()" class="btn btn--error"><span>✕</span> Error</button>
              <button (click)="showWarning()" class="btn btn--warning">
                <span>⚠</span> Warning
              </button>
              <button (click)="showInfo()" class="btn btn--info"><span>ℹ</span> Info</button>
            </div>
          </app-code-block>
        </section>

        <!-- Positions -->
        <section class="demo-section">
          <h2 class="demo-section__title">Positions</h2>
          <p class="demo-section__desc">
            Place toasts in any corner or center of the screen. Each position maintains its own
            queue.
          </p>

          <app-code-block [code]="positionsCode">
            <div preview class="demo-preview demo-preview--grid">
              @for (pos of positions; track pos) {
                <button (click)="showAtPosition(pos)" class="btn btn--ghost">
                  {{ formatPosition(pos) }}
                </button>
              }
            </div>
          </app-code-block>
        </section>

        <!-- Durations -->
        <section class="demo-section">
          <h2 class="demo-section__title">Duration Control</h2>
          <p class="demo-section__desc">
            Set custom durations or create persistent toasts that require manual dismissal.
          </p>

          <app-code-block [code]="durationCode">
            <div preview class="demo-preview demo-preview--row">
              <button (click)="showWithDuration(2000)" class="btn btn--ghost">2 Seconds</button>
              <button (click)="showWithDuration(5000)" class="btn btn--ghost">5 Seconds</button>
              <button (click)="showPersistent()" class="btn btn--ghost">Persistent</button>
              <button (click)="dismissAll()" class="btn btn--secondary">Dismiss All</button>
            </div>
          </app-code-block>
        </section>

        <!-- API Usage -->
        <section class="demo-section">
          <h2 class="demo-section__title">API Usage</h2>
          <p class="demo-section__desc">
            Full control with the ToastService. Create toasts with titles, messages, and custom
            options.
          </p>

          <app-code-block [code]="apiCode">
            <div preview class="demo-preview demo-preview--center">
              <button (click)="showWithTitle()" class="btn btn--primary">
                Show Toast with Title
              </button>
            </div>
          </app-code-block>
        </section>
      </div>

      <!-- Toast Container -->
      <qz-toast-container />
    </app-demo-page>
  `,
  styles: [
    `
      .demos {
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .demo-section {
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
        padding: 1.5rem;
      }

      .demo-section__title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0 0 0.5rem;
      }

      .demo-section__desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1.5rem;
        line-height: 1.5;
      }

      .demo-preview {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .demo-preview--row {
        justify-content: center;
      }

      .demo-preview--grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        max-width: 400px;
        margin: 0 auto;
      }

      .demo-preview--center {
        justify-content: center;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1.125rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn--primary {
        background: #7c3aed;
        color: #fff;
      }

      .btn--primary:hover {
        background: #6d28d9;
      }

      .btn--secondary {
        background: #1e1e2a;
        color: #e5e7eb;
        border: 1px solid #2a2a3a;
      }

      .btn--secondary:hover {
        background: #2a2a3a;
      }

      .btn--ghost {
        background: transparent;
        color: #9ca3af;
        border: 1px solid #2a2a3a;
      }

      .btn--ghost:hover {
        background: #1e1e2a;
        color: #e5e7eb;
      }

      .btn--success {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      .btn--success:hover {
        background: rgba(34, 197, 94, 0.25);
      }

      .btn--error {
        background: rgba(248, 113, 113, 0.15);
        color: #f87171;
        border: 1px solid rgba(248, 113, 113, 0.3);
      }

      .btn--error:hover {
        background: rgba(248, 113, 113, 0.25);
      }

      .btn--warning {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .btn--warning:hover {
        background: rgba(245, 158, 11, 0.25);
      }

      .btn--info {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      .btn--info:hover {
        background: rgba(59, 130, 246, 0.25);
      }
    `,
  ],
})
export class ToastPage {
  private toastService = inject(ToastService);

  readonly positions: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];

  // Code examples
  typesCode = `// Shorthand methods
toastService.success('Operation completed!', 'Success');
toastService.error('Something went wrong!', 'Error');
toastService.warning('Please review your input.', 'Warning');
toastService.info('This is an informational message.', 'Info');`;

  positionsCode = `// Any of 6 positions
toastService.show({
  type: 'info',
  message: 'Positioned toast',
  position: 'top-right', // or 'bottom-center', etc.
});`;

  durationCode = `// Custom duration (ms)
toastService.show({
  type: 'info',
  message: 'Quick toast',
  duration: 2000, // 2 seconds
});

// Persistent toast
toastService.show({
  type: 'info',
  message: 'Manual close required',
  duration: 0, // No auto-dismiss
  closable: true,
});`;

  apiCode = `// Full options
toastService.show({
  type: 'success',
  title: 'Changes Saved',
  message: 'Your modifications have been saved successfully.',
  position: 'bottom-right',
  duration: 5000,
  closable: true,
});`;

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

  formatPosition(pos: string): string {
    return pos
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
