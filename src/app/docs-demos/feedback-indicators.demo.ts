import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AvatarComponent,
  MeterDirective,
  MeterIndicatorDirective,
  MeterTrackDirective,
  ProgressDirective,
  ProgressIndicatorDirective,
  ProgressTrackDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-progress-demo',
  standalone: true,
  imports: [ProgressDirective, ProgressTrackDirective, ProgressIndicatorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<label for="upload-progress">Upload progress</label>
    <div
      id="upload-progress"
      qzProgress
      [value]="value()"
      aria-valuetext="{{ value() }} percent"
      class="demo-meter"
    >
      <div qzProgressTrack class="demo-track">
        <div qzProgressIndicator class="demo-indicator"></div>
      </div>
    </div>
    <button type="button" (click)="next()">Advance progress</button
    ><button type="button" (click)="value.set(null)">Indeterminate</button>`,
})
export class ProgressDemoComponent {
  readonly value = signal<number | null>(35);
  next(): void {
    const current = this.value();
    this.value.set(current === null ? 0 : Math.min(100, current + 10));
  }
}

@Component({
  selector: 'app-meter-demo',
  standalone: true,
  imports: [MeterDirective, MeterTrackDirective, MeterIndicatorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<label for="storage-meter">Storage used: {{ value() }}%</label>
    <div id="storage-meter" qzMeter [value]="value()" class="demo-meter">
      <div qzMeterTrack class="demo-track"><div qzMeterIndicator class="demo-indicator"></div></div>
    </div>
    <button type="button" (click)="value.set(value() + 5)">Increase usage</button>`,
})
export class MeterDemoComponent {
  readonly value = signal(42);
}

@Component({
  selector: 'app-avatar-demo',
  standalone: true,
  imports: [AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-avatar
    src="/assets/avatar-demo.jpg"
    alt="Profile photo"
    fallback="JD"
    [fallbackDelay]="300"
  />`,
})
export class AvatarDemoComponent {}
