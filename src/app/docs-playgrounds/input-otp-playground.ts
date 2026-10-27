import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { InputOtpComponent } from '@quartz-headless/primitives';

@Component({
  selector: 'app-input-otp-playground',
  imports: [InputOtpComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <qz-input-otp
      [length]="length()"
      [disabled]="disabled()"
      [(value)]="value"
      (completed)="onCompleted($event)"
    />
    <p aria-live="polite">{{ hasCompleted() ? 'Complete' : 'Enter the code' }}</p>
  `,
})
export class InputOtpPlaygroundComponent {
  readonly length = signal(6);
  readonly disabled = signal(false);
  readonly value = signal('');
  readonly completed = output<string>();
  readonly hasCompleted = signal(false);

  onCompleted(value: string): void {
    this.hasCompleted.set(true);
    this.completed.emit(value);
  }
}
