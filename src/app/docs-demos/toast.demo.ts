import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  ToastService,
  ToastContainerComponent,
  type ToastPosition,
} from '@quartz-headless/primitives';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-toast-demo',
  imports: [ToastContainerComponent, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.demo.html',
})
export class ToastDemoComponent {
  private toastService = inject(ToastService);

  readonly positions: ToastPosition[] = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
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
