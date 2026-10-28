import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  AvatarComponent,
  MeterDirective,
  MeterIndicatorDirective,
  MeterTrackDirective,
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
  ToastService,
  type ToastPosition,
  type ToastTemplateContext,
  type ToastType,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-progress-playground',
  standalone: true,
  imports: [ProgressDirective, ProgressTrackDirective, ProgressIndicatorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div
      qzProgress
      [value]="indeterminate() ? null : value()"
      [min]="min()"
      [max]="max()"
      [ariaValueText]="valueText()"
      aria-label="Task progress"
    >
      <div qzProgressTrack><div qzProgressIndicator></div></div>
    </div>
    <output>{{ indeterminate() ? 'Working…' : value() + '%' }}</output>`,
})
export class ProgressPlaygroundComponent {
  readonly value = input(45);
  readonly min = input(0);
  readonly max = input(100);
  readonly indeterminate = input(false);
  readonly valueText = input<string | null>(null);
}
@Component({
  selector: 'app-meter-playground',
  standalone: true,
  imports: [MeterDirective, MeterTrackDirective, MeterIndicatorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div qzMeter [value]="value()" [min]="min()" [max]="max()" aria-label="Storage usage">
      <div qzMeterTrack><div qzMeterIndicator></div></div>
    </div>
    <output>{{ value() }}</output>`,
})
export class MeterPlaygroundComponent {
  readonly value = input(42);
  readonly min = input(0);
  readonly max = input(100);
}
@Component({
  selector: 'app-avatar-playground',
  standalone: true,
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-avatar
    [src]="broken() ? '/missing-avatar.jpg' : src()"
    [fallback]="fallback()"
    [fallbackDelay]="delay()"
    alt="Profile"
  />`,
})
export class AvatarPlaygroundComponent {
  readonly src = input('');
  readonly fallback = input('JD');
  readonly delay = input(0);
  readonly broken = input(false);
}

@Component({
  selector: 'app-toast-playground',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button" (click)="show()">Show toast</button>
    <button type="button" (click)="showStack()">Show stack</button>
    <output>Actions used: {{ actionCount() }}</output>
    <ng-template #custom let-dismiss="dismiss">
      <span>Custom template notification</span>
      <button type="button" (click)="dismiss()">Dismiss from content</button>
    </ng-template>`,
})
export class ToastPlaygroundComponent {
  readonly type = input<ToastType>('info');
  readonly duration = input(5000);
  readonly position = input<ToastPosition>('bottom-right');
  readonly closable = input(true);
  readonly customContent = input(false);
  readonly actions = input(false);
  readonly maxVisible = input(5);
  readonly actionCount = signal(0);
  private readonly toast = inject(ToastService);
  private readonly custom = viewChild.required<TemplateRef<ToastTemplateContext>>('custom');

  show(): void {
    this.toast.show(this.options('Playground toast'));
  }

  showStack(): void {
    for (let index = 1; index <= 3; index++) {
      this.toast.show(this.options(`Stack item ${index}`));
    }
  }

  private options(message: string) {
    return {
      type: this.type(),
      message,
      duration: this.duration(),
      position: this.position(),
      closable: this.closable(),
      maxVisible: this.maxVisible(),
      content: this.customContent() ? this.custom() : undefined,
      actions: this.actions()
        ? [
            {
              label: 'Undo',
              run: () => this.actionCount.update((count) => count + 1),
              dismiss: false,
            },
          ]
        : [],
    };
  }
}
